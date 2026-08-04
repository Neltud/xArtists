"""
Bridge Claude portfolio_allocator ↔ LIA compound_pyramids sleeves.

Use as:
  from lia.claude_agent.pyramids_adapter import pyramids_external_allocator
  from lia.claude_agent.portfolio_allocator import get_allocation
  get_allocation(perfs, budget, external_allocator=pyramids_external_allocator)
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from lia.claude_agent.portfolio_allocator import AllocationResult
from lia.claude_agent.strategy_base import StrategyPerformance
from lia.circuit.compound_pyramids import DEFAULT_PYRAMID, CompoundPyramids


def sleeves_to_weights() -> Dict[str, float]:
    return {s.id: s.weight for s in DEFAULT_PYRAMID}


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
    Prefer fixed pyramid weights (source of truth for LIA book split).
    Optional: scale by live sleeve equity from CompoundPyramids state.
    """
    base = sleeves_to_weights()
    # Map unknown performance ids → 0; keep pyramid ids always
    weights: Dict[str, float] = {k: float(v) for k, v in base.items()}

    if use_live_state:
        try:
            pyr = CompoundPyramids(total_budget)
            eq = {sid: max(0.0, st.equity_usd) for sid, st in pyr.sleeves.items()}
            s = sum(eq.values())
            if s > 0:
                weights = {sid: eq.get(sid, 0.0) / s for sid in weights}
        except Exception:
            pass

    # Ensure reserve id if requested
    if reserve_strategy_id and reserve_strategy_id in weights:
        # Re-normalize non-reserve around reserve_pct
        weights[reserve_strategy_id] = reserve_pct if reserve_pct > 0 else weights[reserve_strategy_id]
        others = [k for k in weights if k != reserve_strategy_id]
        rest = 1.0 - weights[reserve_strategy_id]
        osum = sum(weights[k] for k in others) or 1.0
        for k in others:
            weights[k] = weights[k] / osum * rest

    total = sum(weights.values()) or 1.0
    weights = {k: v / total for k, v in weights.items()}
    budget = {k: weights[k] * total_budget for k in weights}
    return AllocationResult(weights=weights, budget_per_strategy=budget)


def signal_source_caps() -> Dict[str, float]:
    """Canonical caps for Claude SignalBus — match social_intel."""
    return {
        "social_intel": 0.15,
        "green_smoke": 0.30,
        "oracle": 0.20,
        "onchain_memory": 0.10,
    }
