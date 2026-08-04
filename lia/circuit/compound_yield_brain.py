"""
LIA Brain — compound + yield trained with on-chain memory
=========================================================
Vellum entry: builds context from:
  - on-chain TX memory (wallet LIA)
  - compound streak / open ticket
  - yield sleeve decision
  - defense + mode

Outputs a structured "brain_state" for the next run (paper).
Does not sign. LIA_LIVE_TRADING must stay 0 until micro proof.
"""
from __future__ import annotations

import json
import os
import time
from pathlib import Path
from typing import Any, Optional

from lia.circuit.compound_engine import CompoundCircuit, CircuitConfig
from lia.circuit.defense_circuit import DefenseCircuit, evaluate_defense
from lia.circuit.yield_strategy import surplus_split, yield_decision

_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUT = _ROOT / "data" / "lia_brain_state.json"
DEFAULT_WALLET = "erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6"


def _load_memory(wallet: str, size: int = 50, fetch: bool = True) -> dict[str, Any]:
    try:
        from lia.memory.onchain_memory import build_memory, hours_since_last_swap

        if not fetch:
            path = _ROOT / "data" / "lia_onchain_memory.json"
            if path.exists():
                snap = json.loads(path.read_text(encoding="utf-8"))
                return {"ok": True, "source": "cache", **snap, "hours_since_swap": None}
        snap_obj = build_memory(address=wallet, size=size)
        d = snap_obj.to_dict()
        d["ok"] = True
        d["source"] = "api"
        d["hours_since_swap"] = hours_since_last_swap(snap_obj)
        return d
    except Exception as e:
        path = _ROOT / "data" / "lia_onchain_memory.json"
        if path.exists():
            try:
                snap = json.loads(path.read_text(encoding="utf-8"))
                return {"ok": True, "source": "cache_fallback", "error": str(e), **snap}
            except Exception:
                pass
        return {"ok": False, "error": str(e), "tx_count": 0, "by_kind": {}}


def _memory_lessons(mem: dict[str, Any]) -> list[str]:
    """Heuristic lessons from on-chain history for the brain."""
    lessons: list[str] = []
    by = mem.get("by_kind") or {}
    rate = float(mem.get("success_rate") or 0)
    if rate and rate < 0.85:
        lessons.append(f"onchain_success_rate_low={rate:.0%}_tighten_preflight")
    swaps = int(by.get("swap") or 0)
    stakes = int(by.get("stake") or 0)
    if swaps > 20 and stakes == 0:
        lessons.append("many_swaps_no_stake_consider_yield_sleeve")
    h = mem.get("hours_since_swap")
    if h is not None and h < 0.5:
        lessons.append("pace_last_swap_too_recent")
    if h is not None and h > 72:
        lessons.append("idle_wallet_long_consider_yield")
    avg_gap = float(mem.get("avg_gap_sec_swaps") or 0)
    if avg_gap and avg_gap < 600:
        lessons.append("swap_cadence_aggressive_raise_min_hours")
    if not lessons:
        lessons.append("memory_neutral")
    return lessons


def train_and_decide(
    *,
    wallet: str = DEFAULT_WALLET,
    fetch_memory: bool = True,
    memory_size: int = 50,
    price: float = 0.0,
    gs_regime: str = "NEUTRAL",
    fear_greed: Optional[float] = None,
    hatom_hf: float = 999.0,
    deployable_usd: float = 0.0,
    tp_mode: str = "log",
    persist: bool = True,
    out_path: Optional[Path] = None,
) -> dict[str, Any]:
    live_flag = os.environ.get("LIA_LIVE_TRADING", "0")

    mem = _load_memory(wallet, size=memory_size, fetch=fetch_memory)
    lessons = _memory_lessons(mem)

    circuit = CompoundCircuit(CircuitConfig(tp_mode=tp_mode))
    streak = circuit.streak
    equity = float(streak.compound_equity_usd + streak.yield_sleeve_usd)
    peak = float(streak.peak_equity_usd or equity)

    defense = evaluate_defense(
        gs_regime=gs_regime,
        fear_greed=fear_greed,
        equity_usd=equity,
        peak_usd=peak if peak > 0 else equity,
        hatom_hf=hatom_hf,
        consecutive_losses=streak.consecutive_losses,
        manual_halt=streak.halted,
        halt_reason=streak.halt_reason,
    )
    DefenseCircuit().save(defense)

    # Manage open position tick if price provided
    tick: dict[str, Any] = {"action": "NONE"}
    if circuit.open_ticket and price > 0:
        tick = circuit.on_tick(price)

    can_open, can_reason = circuit.can_open()
    if "pace_last_swap_too_recent" in lessons:
        can_open = False
        can_reason = "memory_pace"

    y_sig = yield_decision(
        yield_sleeve_usd=float(streak.yield_sleeve_usd),
        deployable_idle_usd=max(0.0, deployable_usd * 0.1) if not can_open else 0.0,
        hatom_hf=hatom_hf,
        defense_active=defense.active,
        mode_id="DEFENSE" if defense.active else "YIELD",
    )

    # Brain recommendation (paper)
    if defense.active:
        primary = "DEFENSE_HOLD"
    elif tick.get("action") in ("STOP_LOSS", "TAKE_PROFIT", "PARTIAL_TP"):
        primary = f"COMPOUND_{tick['action']}"
    elif circuit.open_ticket:
        primary = "COMPOUND_MANAGE"
    elif y_sig.action == "YIELD_DEPLOY" and float(streak.yield_sleeve_usd) >= 5:
        primary = "YIELD_DEPLOY"
    elif can_open and not defense.active:
        primary = "COMPOUND_SEEK_ENTRY"
    else:
        primary = "WAIT"

    brain = {
        "timestamp": time.time(),
        "LIA_LIVE_TRADING": live_flag,
        "paper": live_flag != "1",
        "wallet": wallet,
        "memory": {
            "ok": mem.get("ok"),
            "source": mem.get("source"),
            "tx_count": mem.get("tx_count"),
            "by_kind": mem.get("by_kind"),
            "success_rate": mem.get("success_rate"),
            "hours_since_swap": mem.get("hours_since_swap"),
            "last_swap_ts": mem.get("last_swap_ts"),
            "lessons": lessons,
        },
        "compound": {
            "tp_mode": tp_mode,
            "health": circuit.health(),
            "can_open": can_open,
            "can_reason": can_reason,
            "tick": tick,
            "split_rule": {"compound": 0.70, "yield_surplus": 0.30},
        },
        "yield": y_sig.to_dict(),
        "defense": defense.to_dict(),
        "primary_action": primary,
        "training_notes": [
            "Brain uses on-chain TX kinds + cadence as features",
            "Compound: 70% of net wins roll into compound_equity",
            "Yield: 30% surplus → yield_sleeve → venue signal",
            "No broadcast from this module",
        ],
    }

    if persist:
        path = Path(out_path or DEFAULT_OUT)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(brain, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return brain


def apply_win_to_sleeves(pnl_usd: float, circuit: Optional[CompoundCircuit] = None) -> dict[str, Any]:
    """Helper after a closed win (paper accounting)."""
    c = circuit or CompoundCircuit()
    split = surplus_split(pnl_usd)
    if pnl_usd > 0:
        c.streak.compound_equity_usd += split["to_compound"]
        c.streak.yield_sleeve_usd += split["to_yield"]
        eq = c.streak.compound_equity_usd + c.streak.yield_sleeve_usd
        c.streak.peak_equity_usd = max(c.streak.peak_equity_usd, eq)
        c.save()
    return {"split": split, "streak": c.streak.to_dict()}


if __name__ == "__main__":
    # Offline-friendly: try fetch, else cache
    out = train_and_decide(fetch_memory=True, deployable_usd=40, fear_greed=55)
    print(json.dumps({
        "primary": out["primary_action"],
        "lessons": out["memory"]["lessons"],
        "yield": out["yield"]["action"],
        "defense": out["defense"]["active"],
        "can_open": out["compound"]["can_open"],
    }, indent=2))
