"""
LIA trading modes — explicit regimes with triggers for Vellum.

Each mode defines:
- when it activates (triggers)
- which strategy sleeves are allowed
- max notional / cadence hints
- whether social/GSN may increase size

All modes respect LIA_LIVE_TRADING and micro_trade gates externally.
"""
from __future__ import annotations

from dataclasses import dataclass, asdict, field
from typing import Any, Optional


@dataclass
class ModeSpec:
    id: str
    name: str
    description: str
    triggers_enter: list[str]
    triggers_exit: list[str]
    allowed_strategies: list[str]  # MR | MOM | ARB | YIELD | HOLD
    max_notional_usd: float
    max_trades_per_day: int
    social_weight_mult: float  # 0 = ignore social for sizing
    gs_required: bool  # if True, need GSN not RISK_OFF for directional
    paper_only: bool = False

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


# Canonical modes — used by mode_orchestrator and Vellum docs
MODES: dict[str, ModeSpec] = {
    "DEFENSE": ModeSpec(
        id="DEFENSE",
        name="Defense / Risk-Off",
        description="Capital preservation: no new BUY; allow SELL/YIELD only.",
        triggers_enter=[
            "gs_regime == RISK_OFF",
            "social.rumor_flag and social.bias == SELL",
            "fear_greed <= 25",
            "circuit_breaker_halt",
            "drawdown_pct >= 0.12",
        ],
        triggers_exit=[
            "gs_regime != RISK_OFF",
            "fear_greed >= 40",
            "drawdown_pct < 0.08",
        ],
        allowed_strategies=["SELL", "YIELD", "HOLD"],
        max_notional_usd=0.0,
        max_trades_per_day=3,
        social_weight_mult=0.0,
        gs_required=False,
        paper_only=False,
    ),
    "YIELD": ModeSpec(
        id="YIELD",
        name="Yield sleeve",
        description="No trade edge → Hatom / stable yield signals only.",
        triggers_enter=[
            "fuse_action == YIELD",
            "best_buy_confidence < 0.62",
            "mode was DEFENSE and recovery",
        ],
        triggers_exit=[
            "best_buy_confidence >= 0.70",
            "arb_spread_edge",
        ],
        allowed_strategies=["YIELD", "HOLD"],
        max_notional_usd=50.0,
        max_trades_per_day=5,
        social_weight_mult=0.25,
        gs_required=False,
    ),
    "MICRO_ARB": ModeSpec(
        id="MICRO_ARB",
        name="Block-time micro-arb",
        description="xExchange vs OneDex structural spread; prefers ARB in fuse.",
        triggers_enter=[
            "strategy ARB confidence >= 0.62",
            "spread > fee_roundtrip * 2.5",
            "notional passes should_skip_micro_trade",
        ],
        triggers_exit=[
            "spread < fee_roundtrip * 1.5",
            "gas_frac too high",
        ],
        allowed_strategies=["ARB"],
        max_notional_usd=40.0,
        max_trades_per_day=20,
        social_weight_mult=0.0,  # arb is structural, not social
        gs_required=False,
    ),
    "MEAN_REVERSION": ModeSpec(
        id="MEAN_REVERSION",
        name="Liquid mean-reversion",
        description="VWAP dislocation + RSI extremes on liquid pairs.",
        triggers_enter=[
            "MR BUY conf >= 0.62",
            "liquidity_usd >= 50000",
            "gs_regime != RISK_OFF",
        ],
        triggers_exit=[
            "price back to VWAP",
            "RSI mid-range",
        ],
        allowed_strategies=["MR", "HOLD", "SELL"],
        max_notional_usd=30.0,
        max_trades_per_day=8,
        social_weight_mult=0.5,
        gs_required=True,
    ),
    "MOMENTUM": ModeSpec(
        id="MOMENTUM",
        name="Momentum + regime",
        description="1h/24h trend + volume spike + GSN bullish bias.",
        triggers_enter=[
            "MOM BUY conf >= 0.62",
            "gs_bias in BULLISH|BUY|ACCUMULATE",
            "gs_regime != RISK_OFF",
            "social not rumor_flag",
        ],
        triggers_exit=[
            "gs_regime == RISK_OFF",
            "volume_spike < 1.0",
            "trailing_stop hit",
        ],
        allowed_strategies=["MOM", "SELL", "HOLD"],
        max_notional_usd=25.0,
        max_trades_per_day=6,
        social_weight_mult=0.8,
        gs_required=True,
    ),
    "COMPOUND": ModeSpec(
        id="COMPOUND",
        name="Compound / TP curves",
        description="Manage open positions with tp_mode log/exp/ladder + trailing.",
        triggers_enter=[
            "open_position exists",
            "tp_mode configured",
        ],
        triggers_exit=[
            "position closed",
            "full TP or SL",
        ],
        allowed_strategies=["SELL", "HOLD"],
        max_notional_usd=0.0,  # manage existing only
        max_trades_per_day=15,
        social_weight_mult=0.3,
        gs_required=False,
    ),
    "ADVISOR": ModeSpec(
        id="ADVISOR",
        name="Claude daily advisor",
        description="One structured proposal/day — auto_execute=False by default.",
        triggers_enter=[
            "schedule daily",
            "market_context built",
        ],
        triggers_exit=["proposal journaled"],
        allowed_strategies=["HOLD"],
        max_notional_usd=0.0,
        max_trades_per_day=0,
        social_weight_mult=1.0,
        gs_required=False,
        paper_only=True,
    ),
    "SOCIAL_WATCH": ModeSpec(
        id="SOCIAL_WATCH",
        name="Permanent social watch",
        description="Refresh social_intel.json; never trades alone.",
        triggers_enter=[
            "timer 5–15 min",
            "vellum cycle start",
        ],
        triggers_exit=["social_intel persisted"],
        allowed_strategies=["HOLD"],
        max_notional_usd=0.0,
        max_trades_per_day=0,
        social_weight_mult=1.0,
        gs_required=False,
        paper_only=True,
    ),
}


def get_mode(mode_id: str) -> Optional[ModeSpec]:
    return MODES.get(mode_id.upper())


def list_modes() -> list[dict[str, Any]]:
    return [m.to_dict() for m in MODES.values()]


def select_mode(
    *,
    gs_regime: str = "NEUTRAL",
    fuse_action: str = "WAIT",
    fuse_strategy: str = "",
    fuse_confidence: float = 0.0,
    fear_greed: Optional[float] = None,
    rumor_flag: bool = False,
    has_open_position: bool = False,
    drawdown_pct: float = 0.0,
) -> ModeSpec:
    """Priority: DEFENSE → COMPOUND → MICRO_ARB → MOMENTUM → MR → YIELD → SOCIAL_WATCH."""
    if (
        gs_regime == "RISK_OFF"
        or drawdown_pct >= 0.12
        or (fear_greed is not None and fear_greed <= 25)
    ):
        return MODES["DEFENSE"]
    if has_open_position:
        return MODES["COMPOUND"]
    if fuse_strategy == "ARB" and fuse_action == "BUY" and fuse_confidence >= 0.62:
        return MODES["MICRO_ARB"]
    if fuse_strategy == "MOM" and fuse_action == "BUY" and fuse_confidence >= 0.62 and not rumor_flag:
        return MODES["MOMENTUM"]
    if fuse_strategy == "MR" and fuse_action == "BUY" and fuse_confidence >= 0.62:
        return MODES["MEAN_REVERSION"]
    if fuse_action == "YIELD" or fuse_confidence < 0.62:
        return MODES["YIELD"]
    return MODES["SOCIAL_WATCH"]


def mode_allows_action(mode: ModeSpec, action: str, strategy: str) -> bool:
    if action == "WAIT" or action == "HOLD":
        return True
    if action == "SELL" and "SELL" in mode.allowed_strategies:
        return True
    if action == "BUY" and strategy in mode.allowed_strategies:
        return True
    if action == "YIELD" and "YIELD" in mode.allowed_strategies:
        return True
    return False
