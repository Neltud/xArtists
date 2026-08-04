"""Winrate-weighted allocation + compounding. Reserve slice never absorbs cap excess."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Optional

from lia.claude_agent.strategy_base import StrategyPerformance


class AllocationError(Exception):
    pass


@dataclass
class AllocationResult:
    weights: Dict[str, float]
    budget_per_strategy: Dict[str, float]


def compute_allocation(
    performances: List[StrategyPerformance],
    total_budget: float,
    reserve_strategy_id: Optional[str] = None,
    reserve_pct: float = 0.0,
    exploration_floor_pct: float = 0.05,
    max_weight_pct: float = 0.60,
) -> AllocationResult:
    if total_budget < 0:
        raise AllocationError(f"total_budget must be >= 0, got {total_budget}")
    if not performances:
        raise AllocationError("performances list must not be empty")
    if reserve_pct < 0 or reserve_pct >= 1:
        raise AllocationError(f"reserve_pct must be in [0, 1), got {reserve_pct}")

    ids = [p.strategy_id for p in performances]
    if len(set(ids)) != len(ids):
        raise AllocationError(f"duplicate strategy_id: {ids}")

    weights: Dict[str, float] = {}
    remaining_pct = 1.0

    if reserve_strategy_id is not None:
        if reserve_strategy_id not in ids:
            raise AllocationError(f"reserve_strategy_id '{reserve_strategy_id}' not found")
        weights[reserve_strategy_id] = reserve_pct
        remaining_pct = 1.0 - reserve_pct

    non_reserve = [p for p in performances if p.strategy_id != reserve_strategy_id]
    if not non_reserve and reserve_strategy_id:
        weights[reserve_strategy_id] = 1.0
        remaining_pct = 0.0
        non_reserve = []

    if non_reserve:
        n = len(non_reserve)
        if exploration_floor_pct * n > remaining_pct:
            floor_each = remaining_pct / n
        else:
            floor_each = exploration_floor_pct
        variable_pool = remaining_pct - (floor_each * n)
        scores = [max(p.winrate, 0.0) * (1 if p.trades_count > 0 else 0) for p in non_reserve]
        total_score = sum(scores)
        for p, score in zip(non_reserve, scores):
            if total_score > 0:
                variable_share = variable_pool * (score / total_score)
            else:
                variable_share = variable_pool / n
            weights[p.strategy_id] = floor_each + variable_share

    capped_ids = [sid for sid in weights if sid != reserve_strategy_id]
    for _ in range(10):
        over = {sid: weights[sid] for sid in capped_ids if weights[sid] > max_weight_pct}
        if not over:
            break
        excess = sum(w - max_weight_pct for w in over.values())
        for sid in over:
            weights[sid] = max_weight_pct
        under_ids = [sid for sid in capped_ids if sid not in over]
        under_total = sum(weights[sid] for sid in under_ids)
        if under_total <= 0 or not under_ids:
            break
        for sid in under_ids:
            weights[sid] += excess * (weights[sid] / under_total)

    if reserve_strategy_id is not None:
        weights[reserve_strategy_id] = reserve_pct
        non_reserve_total = sum(weights[sid] for sid in capped_ids)
        target = 1.0 - reserve_pct
        if non_reserve_total <= 0:
            raise AllocationError("non-reserve weights sum to zero")
        for sid in capped_ids:
            weights[sid] = weights[sid] / non_reserve_total * target
    else:
        total = sum(weights.values())
        if total <= 0:
            raise AllocationError("weights sum to zero")
        weights = {sid: w / total for sid, w in weights.items()}

    budget_per_strategy = {sid: w * total_budget for sid, w in weights.items()}
    return AllocationResult(weights=weights, budget_per_strategy=budget_per_strategy)


def compound_budget(current_budget: float, realized_pnl_pct: float) -> float:
    return max(current_budget * (1 + realized_pnl_pct), 0.0)
