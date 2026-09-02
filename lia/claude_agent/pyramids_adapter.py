"""
Bridge real sleeve allocator (lia.circuit.compound_pyramids) into
portfolio_allocator.get_allocation(external_allocator=...).

FIXED weights (never winrate):
  MOM 15% · MR 15% · MICRO_ARB 20% · WEEKLY_SWING 10% · YIELD 25% · RESERVE 15%
"""
from __future__ import annotations

import importlib
import warnings
from typing import Any, Dict, List, Optional

from lia.claude_agent.portfolio_allocator import AllocationResult
from lia.claude_agent.strategy_base import StrategyPerformance

_FIXED_WEIGHTS: Dict[str, float] = {
    "MOM": 0.15,
    "MR": 0.15,
    "MICRO_ARB": 0.20,
    "WEEKLY_SWING": 0.10,
    "YIELD": 0.25,
    "RESERVE": 0.15,
}
assert abs(sum(_FIXED_WEIGHTS.values()) - 1.0) < 1e-9


class PyramidsAdapterWarning(UserWarning):
    pass


def _read_weights_from_real_module() -> Optional[Dict[str, float]]:
    try:
        module = importlib.import_module("lia.circuit.compound_pyramids")
    except ImportError:
        return None
    pyramid = getattr(module, "DEFAULT_PYRAMID", None)
    if pyramid is None:
        warnings.warn(
            "compound_pyramids importable but no DEFAULT_PYRAMID — using _FIXED_WEIGHTS",
            PyramidsAdapterWarning,
        )
        return None
    try:
        weights: Dict[str, float] = {}
        for sleeve in pyramid:
            sleeve_id = getattr(sleeve, "id", None) or getattr(sleeve, "name", None)
            weight = getattr(sleeve, "weight", None)
            if sleeve_id is None or weight is None:
                raise AttributeError("sleeve missing id/name or weight")
            weights[str(sleeve_id)] = float(weight)
    except (TypeError, AttributeError, ValueError) as e:
        warnings.warn(f"DEFAULT_PYRAMID shape unexpected ({e!r})", PyramidsAdapterWarning)
        return None
    total = sum(weights.values())
    if total <= 0 or not weights:
        return None
    return {sid: w / total for sid, w in weights.items()}


def sleeves_to_weights() -> Dict[str, float]:
    live = _read_weights_from_real_module()
    if live is not None:
        return live
    return dict(_FIXED_WEIGHTS)


def pyramids_external_allocator(
    performances: List[StrategyPerformance],
    total_budget: float,
    **kwargs: Any,
) -> AllocationResult:
    """Fixed sleeve weights only — performances ignored by design."""
    _ = performances
    _ = kwargs
    weights = sleeves_to_weights()
    budget_per_strategy = {sid: w * float(total_budget) for sid, w in weights.items()}
    return AllocationResult(weights=weights, budget_per_strategy=budget_per_strategy)


pyramids_allocator = pyramids_external_allocator  # alias


def signal_source_caps() -> Dict[str, float]:
    return {
        "social_intel": 0.15,
        "green_smoke": 0.30,
        "oracle": 0.20,
        "onchain_memory": 0.10,
    }
