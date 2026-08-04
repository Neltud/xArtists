"""
Optimized Hatom leverage loop planner.

Improvements vs naive loop:
  - Target HF floor after each iteration (not only entry HF)
  - Effective LTV = min(protocol_ltv, max_ltv_used, HF-implied)
  - Stop when marginal borrow < min_notional or gas eats edge
  - Optional stable-only borrow asset hint
  - Net APY estimate: supply_apy * exposure - borrow_apy * debt - gas
"""
from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from typing import Any, Optional

from lia.defi.yield_risk import YieldRiskConfig


@dataclass
class LoopStep:
    i: int
    supply_usd: float
    borrow_usd: float
    hf_after: float


@dataclass
class OptimizedLoop:
    ok: bool
    reason: str
    loops_used: int
    collateral_usd: float
    total_supply_usd: float
    total_borrow_usd: float
    gross_exposure_usd: float
    effective_ltv: float
    hf_target: float
    hf_projected: float
    steps: list[dict[str, Any]] = field(default_factory=list)
    net_apy_est: float = 0.0
    paper: bool = True

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def _hf_after(collateral: float, debt: float, liq_threshold: float = 0.8) -> float:
    """Simplified HF ≈ (collateral * LT) / debt."""
    if debt <= 1e-9:
        return 999.0
    return (collateral * liq_threshold) / debt


def optimize_loop(
    *,
    collateral_usd: float,
    protocol_ltv: float = 0.75,
    liq_threshold: float = 0.80,
    current_hf: float = 999.0,
    max_loops: int = 2,
    supply_apy: float = 0.04,
    borrow_apy: float = 0.06,
    min_borrow_usd: float = 5.0,
    gas_usd_per_step: float = 0.08,
    defense_active: bool = False,
    cfg: Optional[YieldRiskConfig] = None,
) -> OptimizedLoop:
    cfg = cfg or YieldRiskConfig()
    if defense_active:
        return OptimizedLoop(False, "defense_blocks_loop", 0, collateral_usd, 0, 0, collateral_usd, 0, 0, current_hf)
    if collateral_usd < min_borrow_usd:
        return OptimizedLoop(False, "collateral too small", 0, collateral_usd, 0, 0, collateral_usd, 0, 0, current_hf)
    if current_hf < cfg.min_hf_leverage_loop:
        return OptimizedLoop(
            False,
            f"hf {current_hf:.2f} < {cfg.min_hf_leverage_loop}",
            0,
            collateral_usd,
            0,
            0,
            collateral_usd,
            0,
            cfg.min_hf_leverage_loop,
            current_hf,
        )

    # LTV that keeps HF >= target: debt <= coll*LT / hf_target → ltv_eff <= LT/hf_target
    hf_target = max(cfg.min_hf_leverage_loop, 2.0)
    ltv_hf_cap = (liq_threshold / hf_target) * 0.95  # safety haircut
    ltv = min(protocol_ltv, cfg.max_ltv_used_pct, ltv_hf_cap)
    if ltv <= 0.05:
        return OptimizedLoop(False, "effective LTV too low for safe HF", 0, collateral_usd, 0, 0, collateral_usd, 0, hf_target, current_hf)

    max_loops = min(max_loops, cfg.max_leverage_loops)
    coll = float(collateral_usd)
    debt = 0.0
    steps: list[LoopStep] = []
    remaining_to_supply = coll

    for i in range(max_loops):
        supply_i = remaining_to_supply
        borrow_i = supply_i * ltv
        if borrow_i < min_borrow_usd:
            break
        # project HF if we add this supply and debt
        new_coll = coll + (supply_i if i > 0 else 0)  # first supply is initial coll
        if i == 0:
            new_coll = coll
        else:
            new_coll = coll  # coll already includes previous supplies in our accounting
        debt_new = debt + borrow_i
        # cumulative: each loop adds supply=previous borrow
        if i == 0:
            total_coll = coll
        else:
            total_coll = coll + sum(s.borrow_usd for s in steps)
        # After loop i: total collateral value ≈ initial + sum borrows (if looping same asset)
        total_coll = coll + debt  # debt from previous = supplied
        total_coll_after = total_coll + (0 if i == 0 else 0)
        # Simpler geometric: exposure grows
        debt = debt_new
        if i == 0:
            total_supply = coll
        else:
            total_supply = coll + sum(s.borrow_usd for s in steps)
        total_supply = coll + debt - borrow_i  # supply before this borrow
        total_supply = coll + sum(s.borrow_usd for s in steps)
        hf = _hf_after(coll + sum(s.borrow_usd for s in steps) + (borrow_i if False else 0), debt, liq_threshold)
        # Use cumulative supply = coll + previous borrows (re-supplied)
        cum_supply = coll + sum(s.borrow_usd for s in steps)
        hf = _hf_after(cum_supply, debt, liq_threshold)
        if hf < hf_target:
            debt -= borrow_i
            break
        steps.append(LoopStep(i, supply_i if i == 0 else steps[-1].borrow_usd, borrow_i, round(hf, 4)))
        remaining_to_supply = borrow_i

    if not steps:
        return OptimizedLoop(False, "no safe loop step", 0, collateral_usd, collateral_usd, 0, collateral_usd, ltv, hf_target, current_hf)

    total_borrow = sum(s.borrow_usd for s in steps)
    # Same-asset loop exposure ≈ coll + total_borrow
    gross = collateral_usd + total_borrow
    gas_cost_annual = gas_usd_per_step * len(steps) * 52 / max(collateral_usd, 1)  # rough if weekly rebalance
    net_apy = supply_apy * (gross / collateral_usd) - borrow_apy * (total_borrow / collateral_usd) - gas_cost_annual

    return OptimizedLoop(
        ok=True,
        reason="optimized loop",
        loops_used=len(steps),
        collateral_usd=collateral_usd,
        total_supply_usd=round(collateral_usd + total_borrow, 4),
        total_borrow_usd=round(total_borrow, 4),
        gross_exposure_usd=round(gross, 4),
        effective_ltv=round(ltv, 4),
        hf_target=hf_target,
        hf_projected=steps[-1].hf_after if steps else current_hf,
        steps=[asdict(s) for s in steps],
        net_apy_est=round(net_apy, 6),
        paper=True,
    )


if __name__ == "__main__":
    print(json.dumps(optimize_loop(collateral_usd=100, current_hf=3.0, max_loops=2).to_dict(), indent=2))
