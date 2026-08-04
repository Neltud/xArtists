"""
Bridge Claude portfolio_allocator ↔ LIA compound_pyramids sleeves.

Fixed targets (DEFAULT_PYRAMID):
  MOM 15% | MR 15% | MICRO_ARB 20% | WEEKLY_SWING 10% | YIELD 25% | RESERVE 15%
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from lia.claude_agent.portfolio_allocator import AllocationResult
from lia.claude_agent.strategy_base import StrategyPerformance

# --- import real pyramid; hard-fail weights only if import breaks ---
try:
    from lia.circuit.compound_pyramids import DEFAULT_PYRAMID, CompoundPyramids

    _PYRAMID_OK = True
except Exception:  # pragma: no cover
    DEFAULT_PYRAMID = []  # type: ignore
    CompoundPyramids = None  # type: ignore
    _PYRAMID_OK = False

# Canonical fallback identical to DEFAULT_PYRAMID (for offline Claude sandbox)
_FIXED_WEIGHTS: Dict[str, float] = {
    "MOM": 0.15,
    "MR": 0.15,
    "MICRO_ARB": 0.20,
    "WEEKLY_SWING": 0.10,
    "YIELD": 0.25,
    "RESERVE": 0.15,
}


def sleeves_to_weights() -> Dict[str, float]:
    if _PYRAMID_OK and DEFAULT_PYRAMID:
        return {s.id: float(s.weight) for s in DEFAULT_PYRAMID}
    return dict(_FIXED_WEIGHTS)


def pyramids_external_allocator(
    performances: List[StrategyPerformance],
    total_budget: float,
    *,
    reserve_strategy_id: Optional[str] = None,
    reserve_pct: float = 0.0,
    use_live_state: bool = False,
    **_kwargs: Any,
) -> AllocationResult:
    """
    Always returns pyramid target weights (15/15/20/10/25/15).
    Does NOT fall back to winrate scoring — that would diverge from LIA book.
    performances is accepted for API compatibility only.
    """
    _ = performances  # intentional: fixed sleeves, not winrate
    weights: Dict[str, float] = sleeves_to_weights()

    if use_live_state and _PYRAMID_OK and CompoundPyramids is not None:
        try:
            pyr = CompoundPyramids(total_budget)
            eq = {sid: max(0.0, st.equity_usd) for sid, st in pyr.sleeves.items()}
            s = sum(eq.values())
            if s > 0:
                weights = {sid: eq.get(sid, 0.0) / s for sid in weights}
        except Exception:
            weights = sleeves_to_weights()

    if reserve_strategy_id and reserve_strategy_id in weights and reserve_pct > 0:
        weights[reserve_strategy_id] = reserve_pct
        others = [k for k in weights if k != reserve_strategy_id]
        rest = max(0.0, 1.0 - weights[reserve_strategy_id])
        osum = sum(weights[k] for k in others) or 1.0
        for k in others:
            weights[k] = weights[k] / osum * rest

    total = sum(weights.values()) or 1.0
    weights = {k: v / total for k, v in weights.items()}
    budget = {k: weights[k] * float(total_budget) for k in weights}
    return AllocationResult(weights=weights, budget_per_strategy=budget)


def signal_source_caps() -> Dict[str, float]:
    return {
        "social_intel": 0.15,
        "green_smoke": 0.30,
        "oracle": 0.20,
        "onchain_memory": 0.10,
    }
