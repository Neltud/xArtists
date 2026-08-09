"""
Paper Lab — multi-cycle autonomous swarm simulation
===================================================
Runs N paper cycles with synthetic market path.
Tracks equity, agent attribution, lock ledger, phase transitions.

  PYTHONPATH=. LIA_LIVE_TRADING=0 python -m lia.agents.paper_lab --cycles 50
"""
from __future__ import annotations

import argparse
import json
import math
import os
import random
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]


@dataclass
class LabStats:
    cycles: int = 0
    buys: int = 0
    sells: int = 0
    yields: int = 0
    waits: int = 0
    wins: int = 0
    losses: int = 0
    gross_pnl: float = 0.0
    max_equity: float = 0.0
    min_equity: float = 0.0
    max_dd: float = 0.0
    by_agent: dict[str, dict[str, float]] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def _synth_market(i: int, base: float = 10.0, seed: int = 42) -> dict[str, Any]:
    rng = random.Random(seed + i)
    drift = math.sin(i / 17.0) * 0.04 + math.sin(i / 7.0) * 0.015
    noise = (rng.random() - 0.5) * 0.02
    price = base * (1.0 + drift + noise)
    vwap = base * (1.0 + drift * 0.5)
    rsi = 50 + 25 * math.sin(i / 11.0) + (rng.random() - 0.5) * 8
    rsi = max(15.0, min(85.0, rsi))
    trend = 100.0 * drift
    spread = 0.001 + abs(noise) * 0.5
    return {
        "token": "WEGLD-bd4d79",
        "price": round(price, 6),
        "vwap_24h": round(vwap, 6),
        "rsi_14": round(rsi, 2),
        "trend_7d_pct": round(trend * 10, 3),
        "price_change_1h": round(noise * 100, 4),
        "liquidity_usd": 150_000,
        "dex_a": round(price * (1 - spread / 2), 6),
        "dex_b": round(price * (1 + spread / 2), 6),
        "fear_greed": int(45 + 20 * math.sin(i / 23.0)),
        "gs_bias": "BULL" if trend > 0.005 else ("BEAR" if trend < -0.005 else "NEUTRAL"),
        "gs_regime": "NEUTRAL",
    }


def run_lab(
    *,
    cycles: int = 50,
    start_equity: float = 100.0,
    seed: int = 42,
    persist: bool = True,
) -> dict[str, Any]:
    if os.getenv("LIA_LIVE_TRADING", "0") == "1":
        return {"error": "paper_lab refuses LIA_LIVE_TRADING=1"}

    from lia.agents.autonomous_swarm import run_swarm_cycle, paper_fill, SwarmDecision
    from lia.risk.profit_lock import ProfitLedger
    from lia.circuit.million_path import phase_for, adaptive_lock_ratio

    equity = start_equity
    peak = equity
    stats = LabStats(min_equity=equity, max_equity=equity)
    ledger = ProfitLedger()
    curve: list[dict[str, Any]] = []
    consecutive_wins = 0
    consecutive_losses = 0

    for i in range(cycles):
        m = _synth_market(i, seed=seed)
        book = {
            "equity_usd": equity,
            "deployable_usd": max(0.0, equity * 0.4),
            "drawdown": (equity - peak) / peak if peak > 0 else 0.0,
            "consecutive_wins": consecutive_wins,
            "consecutive_losses": consecutive_losses,
        }
        out = run_swarm_cycle(market=m, book=book, persist=False, settle=False)
        d = out.get("decision") or {}
        action = str(d.get("action") or "WAIT")
        lead = str(d.get("lead_agent") or "?")
        size = float(d.get("size_usd") or 0)
        conf = float(d.get("confidence") or 0.5)

        stats.cycles += 1
        if action == "BUY":
            stats.buys += 1
        elif action == "SELL":
            stats.sells += 1
        elif action == "YIELD":
            stats.yields += 1
        else:
            stats.waits += 1

        pnl = 0.0
        if action in ("BUY", "SELL") and size > 0 and d.get("preflight", {}).get("allow", True):
            # Honest edge: base ~55% WR, mild conf boost (cap 65%). Not live predictive.
            rng = random.Random(seed * 1000 + i)
            p_win = min(0.65, 0.50 + 0.15 * conf)
            win = rng.random() < p_win
            sd = SwarmDecision(
                action=action,
                token=str(d.get("token") or "WEGLD"),
                size_usd=size,
                confidence=conf,
                lead_agent=lead,
                reason=str(d.get("reason") or ""),
            )
            fill = paper_fill(sd, win=win)
            pnl = float(fill.get("pnl_usd") or 0)
            if pnl > 0:
                stats.wins += 1
                consecutive_wins += 1
                consecutive_losses = 0
                ratio = adaptive_lock_ratio(equity)
                ledger.credit(pnl, lock_ratio=ratio)
                equity += pnl
            elif pnl < 0:
                stats.losses += 1
                consecutive_losses += 1
                consecutive_wins = 0
                equity += pnl
            stats.gross_pnl += pnl

            ag = stats.by_agent.setdefault(lead, {"n": 0, "pnl": 0.0, "wins": 0, "losses": 0})
            ag["n"] += 1
            ag["pnl"] += pnl
            if pnl > 0:
                ag["wins"] += 1
            elif pnl < 0:
                ag["losses"] += 1
        elif action == "YIELD" and size > 0:
            y = size * 0.0001
            equity += y
            stats.gross_pnl += y

        peak = max(peak, equity)
        dd = (equity - peak) / peak if peak > 0 else 0.0
        stats.max_equity = max(stats.max_equity, equity)
        stats.min_equity = min(stats.min_equity, equity)
        stats.max_dd = min(stats.max_dd, dd)

        curve.append(
            {
                "i": i,
                "equity": round(equity, 4),
                "action": action,
                "lead": lead,
                "pnl": round(pnl, 6),
                "phase": phase_for(equity).value,
                "price": m["price"],
            }
        )

    wr = stats.wins / max(1, stats.wins + stats.losses)
    report = {
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "start_equity": start_equity,
        "end_equity": round(equity, 4),
        "return_pct": round(100.0 * (equity - start_equity) / start_equity, 4),
        "winrate": round(wr, 4),
        "stats": stats.to_dict(),
        "ledger": ledger.to_dict(),
        "curve_tail": curve[-10:],
        "curve_len": len(curve),
        "disclaimer": (
            "Synthetic paper path — not predictive of live results. "
            "Used to stress agent routing, locks, and phase transitions."
        ),
    }
    if persist:
        path = ROOT / "data" / "lia_paper_lab.json"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps({**report, "curve": curve}, indent=2), encoding="utf-8")
        report["path"] = str(path)
    return report


def main() -> int:
    if os.getenv("LIA_LIVE_TRADING", "0") == "1":
        print(json.dumps({"error": "LIA_LIVE_TRADING=1 blocked"}))
        return 2
    p = argparse.ArgumentParser()
    p.add_argument("--cycles", type=int, default=50)
    p.add_argument("--equity", type=float, default=100.0)
    p.add_argument("--seed", type=int, default=42)
    args = p.parse_args()
    print(json.dumps(run_lab(cycles=args.cycles, start_equity=args.equity, seed=args.seed), indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
