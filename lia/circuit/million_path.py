"""
Million Path Engine — $start → $1M path with adaptive lock + phases.
Honest: geometric +1% needs ~1270 pure wins from $3; losses/fees lengthen path.
"""
from __future__ import annotations

import math
import time
from dataclasses import dataclass
from enum import Enum
from typing import Any, Optional

GOAL_USD = 1_000_000.0


class PathPhase(str, Enum):
    BOOTSTRAP = "BOOTSTRAP"
    ACCUMULATE = "ACCUMULATE"
    COMPOUND = "COMPOUND"
    HARVEST = "HARVEST"
    PRESERVE = "PRESERVE"


def phase_for(equity: float, start: float = 3.0, goal: float = GOAL_USD) -> PathPhase:
    if equity <= 0:
        return PathPhase.BOOTSTRAP
    if equity >= goal:
        return PathPhase.PRESERVE
    mult = equity / max(start, 1e-9)
    progress = equity / goal
    if mult < 2.0:
        return PathPhase.BOOTSTRAP
    if progress < 0.01:
        return PathPhase.ACCUMULATE
    if progress < 0.25:
        return PathPhase.COMPOUND
    if progress < 1.0:
        return PathPhase.HARVEST
    return PathPhase.PRESERVE


@dataclass
class PhasePolicy:
    lock_ratio: float
    max_risk_pct_equity: float
    max_leverage: float
    tp_mode: str
    trailing_activate_pct: float
    trailing_giveback_pct: float
    partial_tp_fracs: tuple[float, ...]
    compound_intensity: float
    allow_new_risk: bool = True


PHASE_POLICIES: dict[PathPhase, PhasePolicy] = {
    PathPhase.BOOTSTRAP: PhasePolicy(
        0.50, 0.005, 1.0, "fixed", 0.015, 0.006, (0.5, 0.3, 0.2), 0.2, True
    ),
    PathPhase.ACCUMULATE: PhasePolicy(
        0.60, 0.01, 1.2, "log", 0.02, 0.008, (0.4, 0.3, 0.2), 0.4, True
    ),
    PathPhase.COMPOUND: PhasePolicy(
        0.70, 0.015, 1.5, "log", 0.025, 0.01, (0.35, 0.35, 0.2), 0.55, True
    ),
    PathPhase.HARVEST: PhasePolicy(
        0.85, 0.008, 1.2, "ladder", 0.02, 0.007, (0.5, 0.3, 0.2), 0.25, True
    ),
    PathPhase.PRESERVE: PhasePolicy(
        0.95, 0.003, 1.0, "fixed", 0.01, 0.005, (0.7, 0.3), 0.1, False
    ),
}


def compounds_needed(start: float, goal: float = GOAL_USD, net_pct: float = 0.01) -> int:
    if start <= 0 or net_pct <= 0:
        return 10**9
    return int(math.ceil(math.log(goal / start) / math.log(1.0 + net_pct)))


def adaptive_lock_ratio(equity: float, start: float = 3.0, goal: float = GOAL_USD) -> float:
    return PHASE_POLICIES[phase_for(equity, start, goal)].lock_ratio


def size_for_path(equity: float, start: float = 3.0, goal: float = GOAL_USD) -> dict[str, Any]:
    ph = phase_for(equity, start, goal)
    pol = PHASE_POLICIES[ph]
    notional = equity * pol.max_risk_pct_equity * 20
    notional = max(0.0, min(notional, equity * 0.25))
    if not pol.allow_new_risk:
        notional = 0.0
    return {
        "phase": ph.value,
        "notional_usd": round(notional, 4),
        "lock_ratio": pol.lock_ratio,
        "tp_mode": pol.tp_mode,
        "trailing_activate_pct": pol.trailing_activate_pct,
        "trailing_giveback_pct": pol.trailing_giveback_pct,
        "partial_tp_fracs": list(pol.partial_tp_fracs),
        "compound_intensity": pol.compound_intensity,
        "allow_new_risk": pol.allow_new_risk,
        "max_leverage": pol.max_leverage,
    }


def settle_win(
    net_pnl_usd: float,
    equity_usd: float,
    *,
    start: float = 3.0,
    goal: float = GOAL_USD,
    ledger: Any = None,
) -> dict[str, Any]:
    ratio = adaptive_lock_ratio(equity_usd, start, goal)
    if net_pnl_usd <= 0:
        return {
            "phase": phase_for(equity_usd, start, goal).value,
            "lock_ratio": ratio,
            "locked": 0.0,
            "compoundable": 0.0,
            "net_pnl": net_pnl_usd,
        }
    locked = net_pnl_usd * ratio
    comp = net_pnl_usd - locked
    if ledger is not None and hasattr(ledger, "credit"):
        ledger.credit(net_pnl_usd, lock_ratio=ratio)
    return {
        "phase": phase_for(equity_usd, start, goal).value,
        "lock_ratio": ratio,
        "locked": round(locked, 6),
        "compoundable": round(comp, 6),
        "net_pnl": net_pnl_usd,
    }


def path_status(
    equity: float, start: float = 3.0, goal: float = GOAL_USD
) -> dict[str, Any]:
    ph = phase_for(equity, start, goal)
    pol = PHASE_POLICIES[ph]
    progress = min(1.0, max(0.0, equity / goal)) if goal > 0 else 0.0
    steps = compounds_needed(max(equity, start), goal, 0.01)
    return {
        "equity": equity,
        "goal": goal,
        "phase": ph.value,
        "progress_pct": round(progress * 100, 4),
        "lock_ratio": pol.lock_ratio,
        "steps_at_1pct": steps,
        "size": size_for_path(equity, start, goal),
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "disclaimer": "Expectancy path — not a guarantee of reaching goal",
    }


def expected_trades_with_winrate(
    start: float,
    goal: float = GOAL_USD,
    winrate: float = 0.55,
    avg_win_pct: float = 0.01,
    avg_loss_pct: float = 0.01,
) -> dict[str, Any]:
    edge = winrate * avg_win_pct - (1 - winrate) * avg_loss_pct
    if edge <= 0:
        return {"edge": edge, "trades": None, "note": "non-positive edge"}
    trades = math.log(goal / max(start, 1e-9)) / math.log(1.0 + edge)
    return {
        "edge": round(edge, 6),
        "trades": int(math.ceil(trades)),
        "winrate": winrate,
        "note": "approx; path lengthens with variance",
    }


@dataclass
class OpenPositionTP:
    entry: float
    side: str
    size_usd: float
    peak: float = 0.0
    scaled_out: float = 0.0


@dataclass
class TPAction:
    kind: str
    frac: float = 0.0
    reason: str = ""


def on_tick_tp(
    pos: OpenPositionTP,
    price: float,
    equity: float,
    *,
    start: float = 3.0,
    goal: float = GOAL_USD,
) -> TPAction:
    pol = PHASE_POLICIES[phase_for(equity, start, goal)]
    if pos.side == "long":
        ret = (price - pos.entry) / pos.entry if pos.entry else 0.0
        pos.peak = max(pos.peak or pos.entry, price)
        give = (pos.peak - price) / pos.peak if pos.peak else 0.0
    else:
        ret = (pos.entry - price) / pos.entry if pos.entry else 0.0
        pos.peak = min(pos.peak or pos.entry, price) if pos.peak else price
        give = (price - pos.peak) / pos.peak if pos.peak else 0.0

    if ret >= pol.trailing_activate_pct and give >= pol.trailing_giveback_pct:
        return TPAction("trail_exit", 1.0 - pos.scaled_out, "trailing stop")
    for i, thr in enumerate((0.01, 0.02, 0.035)):
        if ret >= thr and pos.scaled_out < sum(pol.partial_tp_fracs[: i + 1]):
            frac = pol.partial_tp_fracs[min(i, len(pol.partial_tp_fracs) - 1)]
            return TPAction("partial", frac, f"tp_level_{i+1}")
    return TPAction("hold", 0.0, "no trigger")
