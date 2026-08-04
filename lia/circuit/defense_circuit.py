"""
Defense circuit — capital preservation layer for LIA / Vellum.

Activates mode DEFENSE when any hard trigger fires:
  - GreenSmoke RISK_OFF
  - Fear & Greed <= 25
  - Drawdown from peak >= 12% (soft) / 15% (hard → also set halt)
  - Social rumor + bearish pressure
  - Hatom HF below safe threshold
  - Consecutive losses / manual halt (via CircuitGuards)
  - LIA_LIVE_TRADING mishandled (optional caution)

While active:
  - No new BUY / ACCUMULATE
  - Allowed: SELL, YIELD, HOLD, WAIT
  - COMPOUND exits (SL/TP) still allowed on open positions
  - Publishes data/lia_defense_state.json

Does not sign transactions. Caller still enforces LIA_LIVE_TRADING=0
and micro_trade gates.
"""
from __future__ import annotations

import json
import os
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Optional

_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_STATE = _ROOT / "data" / "lia_defense_state.json"

# Thresholds (aligned with trading_modes DEFENSE + guards G16)
FEAR_ENTER = 25.0
FEAR_EXIT = 40.0
DD_SOFT_PCT = 0.12  # enter DEFENSE
DD_HARD_PCT = 0.15  # enter DEFENSE + recommend halt
HF_MIN = 1.5


@dataclass
class DefenseTrigger:
    code: str
    active: bool
    detail: str
    severity: str  # soft | hard


@dataclass
class DefenseSnapshot:
    active: bool
    reasons: list[str]
    triggers: list[dict[str, Any]]
    allow_buy: bool
    allow_sell: bool
    allow_yield: bool
    recommend_halt: bool
    mode_id: str  # DEFENSE | CLEAR
    drawdown_pct: float
    updated: float
    meta: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def _dd(equity: float, peak: float) -> float:
    if peak <= 0:
        return 0.0
    return max(0.0, (peak - equity) / peak)


def evaluate_defense(
    *,
    gs_regime: str = "NEUTRAL",
    fear_greed: Optional[float] = None,
    equity_usd: float = 0.0,
    peak_usd: float = 0.0,
    hatom_hf: float = 999.0,
    consecutive_losses: int = 0,
    max_consecutive_losses: int = 3,
    manual_halt: bool = False,
    manual_halt_reason: str = "",
    social_rumor: bool = False,
    social_bias: str = "WAIT",
    social_weight: float = 0.0,
    circuit_halted: bool = False,
    halt_reason: str = "",
    now: Optional[float] = None,
) -> DefenseSnapshot:
    now = time.time() if now is None else now
    triggers: list[DefenseTrigger] = []
    reasons: list[str] = []
    recommend_halt = False

    regime = str(gs_regime or "NEUTRAL").upper()
    if regime == "RISK_OFF":
        triggers.append(DefenseTrigger("GS_RISK_OFF", True, "GreenSmoke RISK_OFF", "hard"))
        reasons.append("gs_regime=RISK_OFF")

    if fear_greed is not None and fear_greed <= FEAR_ENTER:
        triggers.append(
            DefenseTrigger("FEAR", True, f"fear_greed={fear_greed} <= {FEAR_ENTER}", "hard")
        )
        reasons.append(f"fear_greed={fear_greed}")

    dd = _dd(equity_usd, peak_usd if peak_usd > 0 else equity_usd)
    if dd >= DD_HARD_PCT:
        triggers.append(
            DefenseTrigger("DD_HARD", True, f"drawdown={dd:.1%} >= {DD_HARD_PCT:.0%}", "hard")
        )
        reasons.append(f"drawdown_hard={dd:.2%}")
        recommend_halt = True
    elif dd >= DD_SOFT_PCT:
        triggers.append(
            DefenseTrigger("DD_SOFT", True, f"drawdown={dd:.1%} >= {DD_SOFT_PCT:.0%}", "soft")
        )
        reasons.append(f"drawdown_soft={dd:.2%}")

    if hatom_hf < HF_MIN:
        triggers.append(
            DefenseTrigger("HF", True, f"hatom_hf={hatom_hf:.2f} < {HF_MIN}", "hard")
        )
        reasons.append(f"hatom_hf={hatom_hf:.2f}")
        recommend_halt = True

    if consecutive_losses >= max_consecutive_losses:
        triggers.append(
            DefenseTrigger(
                "LOSS_STREAK",
                True,
                f"consecutive_losses={consecutive_losses}",
                "hard",
            )
        )
        reasons.append("loss_streak")
        recommend_halt = True

    if manual_halt or circuit_halted:
        triggers.append(
            DefenseTrigger(
                "HALT",
                True,
                manual_halt_reason or halt_reason or "halt flag",
                "hard",
            )
        )
        reasons.append("halt")
        recommend_halt = True

    if social_rumor and str(social_bias).upper() in ("SELL", "WAIT"):
        triggers.append(
            DefenseTrigger(
                "SOCIAL_RUMOR",
                True,
                f"rumor + bias={social_bias} w={social_weight:.2f}",
                "soft",
            )
        )
        reasons.append("social_rumor")

    active = len(reasons) > 0
    # BUY never allowed in defense; SELL/YIELD ok for de-risk / park capital
    return DefenseSnapshot(
        active=active,
        reasons=reasons,
        triggers=[asdict(t) for t in triggers],
        allow_buy=not active,
        allow_sell=True,
        allow_yield=True,
        recommend_halt=recommend_halt,
        mode_id="DEFENSE" if active else "CLEAR",
        drawdown_pct=round(dd, 6),
        updated=now,
        meta={
            "gs_regime": regime,
            "fear_greed": fear_greed,
            "equity_usd": equity_usd,
            "peak_usd": peak_usd,
            "hatom_hf": hatom_hf,
            "thresholds": {
                "fear_enter": FEAR_ENTER,
                "fear_exit": FEAR_EXIT,
                "dd_soft": DD_SOFT_PCT,
                "dd_hard": DD_HARD_PCT,
                "hf_min": HF_MIN,
            },
            "LIA_LIVE_TRADING": os.environ.get("LIA_LIVE_TRADING", "0"),
        },
    )


def can_exit_defense(
    *,
    gs_regime: str = "NEUTRAL",
    fear_greed: Optional[float] = None,
    equity_usd: float = 0.0,
    peak_usd: float = 0.0,
    hatom_hf: float = 999.0,
    consecutive_losses: int = 0,
    max_consecutive_losses: int = 3,
    manual_halt: bool = False,
    circuit_halted: bool = False,
    social_rumor: bool = False,
) -> dict[str, Any]:
    """Exit only when no hard trigger remains and soft conditions recovered."""
    snap = evaluate_defense(
        gs_regime=gs_regime,
        fear_greed=fear_greed,
        equity_usd=equity_usd,
        peak_usd=peak_usd,
        hatom_hf=hatom_hf,
        consecutive_losses=consecutive_losses,
        max_consecutive_losses=max_consecutive_losses,
        manual_halt=manual_halt,
        circuit_halted=circuit_halted,
        social_rumor=social_rumor,
        social_bias="WAIT",
    )
    if snap.active:
        return {"ok": False, "reasons": snap.reasons, "snapshot": snap.to_dict()}
    if fear_greed is not None and fear_greed < FEAR_EXIT:
        return {
            "ok": False,
            "reasons": [f"fear_greed={fear_greed} < exit {FEAR_EXIT}"],
            "snapshot": snap.to_dict(),
        }
    dd = _dd(equity_usd, peak_usd if peak_usd > 0 else equity_usd)
    if dd >= DD_SOFT_PCT:
        return {"ok": False, "reasons": [f"dd still {dd:.2%}"], "snapshot": snap.to_dict()}
    return {"ok": True, "reasons": [], "snapshot": snap.to_dict()}


def filter_action(action: str, defense: DefenseSnapshot) -> dict[str, Any]:
    """Apply defense policy to a proposed action string."""
    a = (action or "WAIT").upper()
    if not defense.active:
        return {"action": a, "blocked": False, "reason": "defense_clear"}
    if a in ("BUY", "ACCUMULATE"):
        return {
            "action": "WAIT",
            "blocked": True,
            "reason": "defense_blocks_buy: " + ",".join(defense.reasons),
        }
    if a in ("SELL", "YIELD", "HOLD", "WAIT", "SKIP"):
        return {"action": a, "blocked": False, "reason": "allowed_in_defense"}
    return {"action": "WAIT", "blocked": True, "reason": f"unknown_action_{a}_in_defense"}


class DefenseCircuit:
    """Stateful defense layer with persistence."""

    def __init__(self, state_path: Optional[Path] = None):
        self.state_path = Path(state_path or DEFAULT_STATE)
        self.active: bool = False
        self.entered_at: float = 0.0
        self.last_reasons: list[str] = []
        self._load()

    def _load(self) -> None:
        try:
            raw = json.loads(self.state_path.read_text(encoding="utf-8"))
            self.active = bool(raw.get("active", False))
            self.entered_at = float(raw.get("entered_at", 0))
            self.last_reasons = list(raw.get("reasons") or [])
        except Exception:
            pass

    def save(self, snap: DefenseSnapshot) -> None:
        self.state_path.parent.mkdir(parents=True, exist_ok=True)
        if snap.active and not self.active:
            self.entered_at = snap.updated
        if not snap.active:
            self.entered_at = 0.0
        self.active = snap.active
        self.last_reasons = list(snap.reasons)
        payload = {
            **snap.to_dict(),
            "entered_at": self.entered_at,
            "duration_sec": (snap.updated - self.entered_at) if self.entered_at else 0,
        }
        self.state_path.write_text(
            json.dumps(payload, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )

    def update(self, **kwargs: Any) -> DefenseSnapshot:
        snap = evaluate_defense(**kwargs)
        self.save(snap)
        return snap

    def gate_buy(self, **kwargs: Any) -> dict[str, Any]:
        snap = self.update(**kwargs)
        filtered = filter_action("BUY", snap)
        return {
            "allow_buy": snap.allow_buy and not filtered["blocked"],
            "defense": snap.to_dict(),
            "filter": filtered,
        }


def run_defense_check(
    *,
    gs_regime: str = "NEUTRAL",
    fear_greed: Optional[float] = None,
    equity_usd: float = 0.0,
    peak_usd: float = 0.0,
    hatom_hf: float = 999.0,
    consecutive_losses: int = 0,
    social_rumor: bool = False,
    social_bias: str = "WAIT",
    proposed_action: str = "WAIT",
    persist: bool = True,
) -> dict[str, Any]:
    """Vellum entry: evaluate + filter proposed action."""
    circuit = DefenseCircuit()
    snap = evaluate_defense(
        gs_regime=gs_regime,
        fear_greed=fear_greed,
        equity_usd=equity_usd,
        peak_usd=peak_usd,
        hatom_hf=hatom_hf,
        consecutive_losses=consecutive_losses,
        social_rumor=social_rumor,
        social_bias=social_bias,
    )
    if persist:
        circuit.save(snap)
    filtered = filter_action(proposed_action, snap)
    return {
        "defense": snap.to_dict(),
        "proposed": proposed_action,
        "final_action": filtered["action"],
        "blocked": filtered["blocked"],
        "filter_reason": filtered["reason"],
    }


if __name__ == "__main__":
    # Demo scenarios
    for label, kw in [
        ("clear", {"gs_regime": "NEUTRAL", "fear_greed": 50, "equity_usd": 100, "peak_usd": 100}),
        ("risk_off", {"gs_regime": "RISK_OFF", "fear_greed": 50, "equity_usd": 100, "peak_usd": 100}),
        ("fear", {"gs_regime": "NEUTRAL", "fear_greed": 20, "equity_usd": 100, "peak_usd": 100}),
        ("dd", {"gs_regime": "NEUTRAL", "fear_greed": 50, "equity_usd": 85, "peak_usd": 100}),
    ]:
        r = run_defense_check(proposed_action="BUY", **kw)
        print(label, r["final_action"], r["defense"]["reasons"])
