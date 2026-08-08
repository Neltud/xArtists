"""
Multi-chain leverage & venue policy — single source of truth.
=============================================================
MVX  = base layer (spot / LP / lending loops capped)
SOL  = signals + paper; live micro only ≤1.5x
HL   = perps paper high-lev OK; live blocked above 1.5x
Soul = experimental / signals
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional

from lia.guardian.spiral import PolicyLimits, sol_perps_allowed
from lia.risk.secure_tp import live_trading_enabled
from lia.venues.registry import VENUES, get_venue


@dataclass(frozen=True)
class LeverRule:
    chain: str
    max_live: float
    max_paper: float
    hatom_loop_max: float  # effective leverage via borrow
    notes: str


RULES: dict[str, LeverRule] = {
    "multiversx": LeverRule(
        chain="multiversx",
        max_live=1.5,
        max_paper=2.0,
        hatom_loop_max=1.8,  # soft loop HF-safe target
        notes="Spot + limited Hatom recursive supply/borrow; no perps",
    ),
    "solana": LeverRule(
        chain="solana",
        max_live=1.5,
        max_paper=20.0,
        hatom_loop_max=0.0,
        notes="Jupiter spot live micro; high lev paper only",
    ),
    "hyperliquid": LeverRule(
        chain="hyperliquid",
        max_live=1.5,
        max_paper=20.0,
        hatom_loop_max=0.0,
        notes="Perps paper; live high lev forbidden (death spiral)",
    ),
    "multi": LeverRule(
        chain="multi",
        max_live=1.0,
        max_paper=1.0,
        hatom_loop_max=0.0,
        notes="Soul experimental — no live capital",
    ),
}

# Strategy → default venue preference (ordered)
STRATEGY_VENUES: dict[str, list[str]] = {
    "MICRO_ARB": ["xexchange", "onedex", "ashswap", "jupiter"],
    "MOMENTUM": ["xexchange", "jupiter"],
    "MEAN_REVERSION": ["xexchange", "onedex"],
    "YIELD": ["hatom", "ashswap", "xmex"],
    "COMPOUND": ["xexchange", "hatom"],
    "DEFENSE": [],  # no new risk venues
    "SOCIAL_WATCH": [],
    "ADVISOR": [],
    "HEDGE": ["hyperliquid"],  # paper/signals
}

# Sleeve weights (aligned with compound_pyramids target)
SLEEVE_CAPS: dict[str, float] = {
    "MOMENTUM": 0.15,
    "MEAN_REVERSION": 0.15,
    "MICRO_ARB": 0.20,
    "WEEKLY": 0.10,
    "YIELD": 0.25,
    "RESERVE": 0.15,
}


def max_leverage(chain: str, *, live: Optional[bool] = None) -> float:
    live = live_trading_enabled() if live is None else live
    rule = RULES.get(chain.lower()) or RULES["multiversx"]
    return rule.max_live if live else rule.max_paper


def allow_execution(
    *,
    chain: str,
    venue_id: str,
    requested_leverage: float,
    strategy: str = "MOMENTUM",
    live: Optional[bool] = None,
) -> dict[str, Any]:
    """Unified gate: venue status + chain lev + live flag."""
    live = live_trading_enabled() if live is None else live
    venue = get_venue(venue_id)
    strat = (strategy or "").upper()

    if strat in ("DEFENSE", "RISK_OFF", "SOCIAL_WATCH"):
        return {"allow": False, "reason": "strategy_no_exec", "execution": "NONE"}

    if venue is None:
        return {"allow": False, "reason": "unknown_venue", "execution": "NONE"}

    if venue.status == "experimental":
        return {"allow": False, "reason": "experimental_venue", "execution": "SIGNALS_ONLY"}

    lev_max = max_leverage(chain, live=live)
    if requested_leverage > lev_max + 1e-9:
        return {
            "allow": False,
            "reason": "leverage_above_policy",
            "lev": requested_leverage,
            "max": lev_max,
            "execution": "NONE",
        }

    if chain.lower() in ("solana", "hyperliquid"):
        v = sol_perps_allowed(live=live, requested_leverage=requested_leverage)
        if not v.allow:
            return {
                "allow": False,
                "reason": v.reason,
                "execution": "NONE",
                "guardian": v.__dict__,
            }

    if live and venue.status == "planned":
        return {"allow": False, "reason": "venue_not_live", "execution": "PAPER"}

    if not live:
        return {"allow": True, "reason": "paper_ok", "execution": "PAPER", "venue": venue_id}

    if venue.status in ("live", "partial"):
        return {"allow": True, "reason": "ok", "execution": "LIVE", "venue": venue_id}

    return {"allow": False, "reason": "venue_blocked", "execution": "NONE"}


def preferred_venues(strategy: str, *, chain: Optional[str] = None) -> list[str]:
    ids = STRATEGY_VENUES.get((strategy or "").upper(), ["xexchange"])
    if not chain:
        return ids
    out = []
    for vid in ids:
        v = get_venue(vid)
        if v and v.chain == chain:
            out.append(vid)
    return out or ids


def policy_snapshot() -> dict[str, Any]:
    return {
        "live_trading": live_trading_enabled(),
        "rules": {k: v.__dict__ for k, v in RULES.items()},
        "sleeves": SLEEVE_CAPS,
        "strategies": STRATEGY_VENUES,
        "venues": {k: v.to_dict() for k, v in VENUES.items()},
        "guardian_defaults": PolicyLimits().__dict__,
    }
