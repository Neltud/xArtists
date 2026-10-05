"""
Strategy registry — unified catalog for shadow + future Beta.
Mirrors frontend strategySwitcher + deployer signals + extensions.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

StrategyId = Literal[
    "STRAT_TREND_FOLLOW",
    "STRAT_MEAN_REVERSION",
    "STRAT_SENTIMENT_DIV",
    "STRAT_DELTA_NEUTRAL",
    "STRAT_COMPOUND_MAX",
    "STRAT_YIELD_OPTIMIZER",
    "STRAT_VOLATILITY_EXT",
    "STRAT_ARB_MARKET",
    "STRAT_CORRELATION_ARB",
    "STRAT_SENTINEL",
    "STRAT_MOMENTUM_BREAKOUT",
    "STRAT_LIQUIDITY_SNIPER",
    "STRAT_MICRO_PROOF",
]

Action = Literal["BUY", "SELL", "HOLD", "STAKE", "COMPOUND", "FLATTEN", "MICRO_PROOF"]


@dataclass(frozen=True)
class StrategyMeta:
    id: StrategyId
    label: str
    family: str  # trend | mean | yield | hedge | meta
    paper_only: bool = True
    description: str = ""


STRATEGIES: dict[str, StrategyMeta] = {
    "STRAT_TREND_FOLLOW": StrategyMeta(
        "STRAT_TREND_FOLLOW", "Trend follow", "trend", description="Ride directional moves with vol filter"
    ),
    "STRAT_MEAN_REVERSION": StrategyMeta(
        "STRAT_MEAN_REVERSION", "Mean reversion", "mean", description="Fade extremes when distance high"
    ),
    "STRAT_SENTIMENT_DIV": StrategyMeta(
        "STRAT_SENTIMENT_DIV", "Sentiment divergence", "mean", description="Price sideways + strong sentiment"
    ),
    "STRAT_DELTA_NEUTRAL": StrategyMeta(
        "STRAT_DELTA_NEUTRAL", "Delta neutral", "hedge", description="Reduce exposure on down+high vol"
    ),
    "STRAT_COMPOUND_MAX": StrategyMeta(
        "STRAT_COMPOUND_MAX", "Compound max", "yield", description="Up + low vol → compound path"
    ),
    "STRAT_YIELD_OPTIMIZER": StrategyMeta(
        "STRAT_YIELD_OPTIMIZER", "Yield optimizer", "yield", description="Sideways liquid foundation"
    ),
    "STRAT_VOLATILITY_EXT": StrategyMeta(
        "STRAT_VOLATILITY_EXT", "Vol extraction", "yield", description="Sideways low-vol premium"
    ),
    "STRAT_ARB_MARKET": StrategyMeta(
        "STRAT_ARB_MARKET", "Market arb", "meta", description="Cross-venue / sideways arb"
    ),
    "STRAT_CORRELATION_ARB": StrategyMeta(
        "STRAT_CORRELATION_ARB", "Correlation arb", "meta", description="Pair divergence (paper)"
    ),
    "STRAT_SENTINEL": StrategyMeta(
        "STRAT_SENTINEL", "Sentinel", "hedge", description="Locked/burned → no trade"
    ),
    "STRAT_MOMENTUM_BREAKOUT": StrategyMeta(
        "STRAT_MOMENTUM_BREAKOUT",
        "Momentum breakout",
        "trend",
        description="Break + confirmation (new)",
    ),
    "STRAT_LIQUIDITY_SNIPER": StrategyMeta(
        "STRAT_LIQUIDITY_SNIPER",
        "Liquidity sniper",
        "meta",
        description="Thin book opportunistic (paper)",
    ),
    "STRAT_MICRO_PROOF": StrategyMeta(
        "STRAT_MICRO_PROOF",
        "Micro proof",
        "meta",
        paper_only=False,
        description="Ops dust TX only",
    ),
}

VOL_HIGH = 0.55
VOL_LOW = 0.22
CONF_MIN = 0.7
DIST_EXTREME = 0.65


def select_strategy(
    *,
    sentiment: float = 0.0,
    volatility: float = 0.35,
    trend: str = "SIDEWAYS",
    distance: float = 0.0,
    confidence: float = 0.5,
    asset_state: str = "Liquid",
    liquidity: float = 0.5,
) -> tuple[StrategyId, str]:
    if asset_state in ("Locked", "Burned"):
        return "STRAT_SENTINEL", "asset_state_blocked"

    if trend == "SIDEWAYS" and sentiment >= 0.75 and confidence >= 0.55:
        return "STRAT_SENTIMENT_DIV", "sentiment_price_gap"

    if distance >= DIST_EXTREME and volatility < VOL_HIGH:
        return "STRAT_MEAN_REVERSION", "distance_extreme"

    # Momentum breakout (new)
    if trend == "UP" and volatility >= VOL_HIGH * 0.9 and confidence >= 0.65 and distance > 0.35:
        return "STRAT_MOMENTUM_BREAKOUT", "breakout_confirmed"

    if trend == "UP" and volatility >= VOL_HIGH and confidence >= CONF_MIN:
        return "STRAT_TREND_FOLLOW", "trend_up_vol_high"

    if trend == "DOWN" and volatility >= VOL_HIGH:
        return "STRAT_DELTA_NEUTRAL", "trend_down_vol_high"

    if trend == "UP" and volatility <= VOL_LOW and asset_state == "Liquid":
        return "STRAT_COMPOUND_MAX", "trend_up_vol_low"

    if trend == "SIDEWAYS":
        if liquidity > 0.4 and volatility < VOL_LOW:
            return "STRAT_VOLATILITY_EXT", "sideways_low_vol"
        if liquidity < 0.2 and confidence >= 0.6:
            return "STRAT_LIQUIDITY_SNIPER", "thin_book"
        if asset_state == "Liquid":
            return "STRAT_YIELD_OPTIMIZER", "sideways_liquid"
        return "STRAT_ARB_MARKET", "sideways_arb"

    if asset_state == "Staked":
        return "STRAT_COMPOUND_MAX", "already_staked"

    return "STRAT_YIELD_OPTIMIZER", "default_foundation"


def action_for(strategy: StrategyId, *, trend: str = "SIDEWAYS", distance: float = 0.0) -> Action:
    if strategy == "STRAT_MICRO_PROOF":
        return "MICRO_PROOF"
    if strategy == "STRAT_SENTINEL":
        return "HOLD"
    if strategy in ("STRAT_TREND_FOLLOW", "STRAT_SENTIMENT_DIV", "STRAT_CORRELATION_ARB", "STRAT_MOMENTUM_BREAKOUT"):
        return "SELL" if trend == "DOWN" else "BUY"
    if strategy == "STRAT_MEAN_REVERSION":
        return "SELL" if distance > 0 else "BUY"
    if strategy in ("STRAT_COMPOUND_MAX",):
        return "COMPOUND"
    if strategy in ("STRAT_YIELD_OPTIMIZER", "STRAT_VOLATILITY_EXT"):
        return "STAKE"
    if strategy == "STRAT_DELTA_NEUTRAL":
        return "FLATTEN"
    if strategy == "STRAT_LIQUIDITY_SNIPER":
        return "BUY"
    return "HOLD"


def list_strategies() -> list[dict]:
    return [
        {
            "id": m.id,
            "label": m.label,
            "family": m.family,
            "paper_only": m.paper_only,
            "description": m.description,
        }
        for m in STRATEGIES.values()
    ]
