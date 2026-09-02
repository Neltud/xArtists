"""
Yield risk management — IL, leverage loops, HF, concentration.

Used before any Hatom/Soul paper or live action.
Impermanent loss: only for LP pairs (xExchange etc), NOT for pure lend.
Leverage loop risk: borrow/supply recursive HF decay.
"""
from __future__ import annotations

import math
from dataclasses import asdict, dataclass
from typing import Any, Optional


@dataclass
class YieldRiskConfig:
    min_hf_open: float = 1.8
    min_hf_maintain: float = 1.5
    min_hf_leverage_loop: float = 2.0
    max_leverage_loops: int = 2  # recursive supply/borrow iterations
    max_ltv_used_pct: float = 0.50  # use at most 50% of available borrow power
    max_il_estimated_pct: float = 0.05  # skip LP if expected IL > 5%
    max_yield_sleeve_pct_equity: float = 0.40
    max_single_venue_pct: float = 0.60
    block_leverage_if_defense: bool = True
    block_lp_if_high_vol: bool = True


def impermanent_loss_approx(price_ratio: float) -> float:
    """
    Classic 50/50 AMM IL vs HODL.
    price_ratio = new_price / old_price (token A in terms of B).
    Returns IL as fraction of portfolio (0.05 = 5% underperformance vs hold).
    """
    if price_ratio <= 0:
        return 1.0
    # IL = 2*sqrt(k)/(1+k) - 1
    k = price_ratio
    return abs(2.0 * math.sqrt(k) / (1.0 + k) - 1.0)


def il_from_move_pct(move_pct: float) -> float:
    """move_pct e.g. 0.25 = +25% price move of one side."""
    return impermanent_loss_approx(1.0 + move_pct)


def leverage_loop_capacity(
    *,
    collateral_usd: float,
    ltv_max: float,
    loops: int,
    cfg: Optional[YieldRiskConfig] = None,
) -> dict[str, Any]:
    """
    Geometric borrow power after N supply→borrow→supply loops.
    Effective exposure ≈ collateral * (1 + ltv + ltv^2 + ...).
    """
    cfg = cfg or YieldRiskConfig()
    loops = max(0, min(int(loops), cfg.max_leverage_loops))
    ltv = min(float(ltv_max), cfg.max_ltv_used_pct)
    if collateral_usd <= 0 or ltv <= 0:
        return {
            "loops": 0,
            "gross_exposure_usd": collateral_usd,
            "borrowed_usd": 0.0,
            "ltv_used": 0.0,
            "ok": False,
            "reason": "no capacity",
        }
    # sum of geometric series: C * (1 - ltv^(n+1)) / (1 - ltv) for exposure
    if abs(1 - ltv) < 1e-9:
        exposure = collateral_usd * (loops + 1)
    else:
        exposure = collateral_usd * (1 - ltv ** (loops + 1)) / (1 - ltv)
    borrowed = exposure - collateral_usd
    return {
        "loops": loops,
        "gross_exposure_usd": round(exposure, 4),
        "borrowed_usd": round(max(0.0, borrowed), 4),
        "ltv_used": ltv,
        "ok": loops <= cfg.max_leverage_loops,
        "reason": "ok",
    }


def assess_position_risk(
    *,
    kind: str,  # lend | borrow | lp | stake | leverage_loop
    hatom_hf: float = 999.0,
    defense_active: bool = False,
    price_move_expected_pct: float = 0.0,
    lp_price_ratio: Optional[float] = None,
    equity_usd: float = 0.0,
    sleeve_usd: float = 0.0,
    venue_pct: float = 0.0,
    ltv_max: float = 0.75,
    loops: int = 0,
    cfg: Optional[YieldRiskConfig] = None,
) -> dict[str, Any]:
    cfg = cfg or YieldRiskConfig()
    blockers: list[str] = []
    warnings: list[str] = []

    if kind in ("borrow", "leverage_loop") and defense_active and cfg.block_leverage_if_defense:
        blockers.append("defense_blocks_leverage")

    if kind in ("lend", "borrow", "leverage_loop"):
        if hatom_hf < cfg.min_hf_maintain:
            blockers.append(f"hf={hatom_hf:.2f}<maintain_{cfg.min_hf_maintain}")
        elif hatom_hf < cfg.min_hf_open and kind != "lend":
            blockers.append(f"hf={hatom_hf:.2f}<open_{cfg.min_hf_open}")
        if kind == "leverage_loop" and hatom_hf < cfg.min_hf_leverage_loop:
            blockers.append(f"hf={hatom_hf:.2f}<loop_{cfg.min_hf_leverage_loop}")

    if kind == "lp":
        ratio = lp_price_ratio if lp_price_ratio is not None else (1.0 + price_move_expected_pct)
        il = impermanent_loss_approx(ratio)
        if il > cfg.max_il_estimated_pct:
            blockers.append(f"il={il:.2%}>max_{cfg.max_il_estimated_pct:.0%}")
        elif il > cfg.max_il_estimated_pct * 0.5:
            warnings.append(f"il_elevated={il:.2%}")
        if cfg.block_lp_if_high_vol and abs(price_move_expected_pct) >= 0.20:
            warnings.append("high_vol_lp")

    if equity_usd > 0 and sleeve_usd / equity_usd > cfg.max_yield_sleeve_pct_equity:
        warnings.append("sleeve_concentration")
    if venue_pct > cfg.max_single_venue_pct:
        warnings.append("venue_concentration")

    loop_info = leverage_loop_capacity(
        collateral_usd=sleeve_usd or equity_usd * 0.1,
        ltv_max=ltv_max,
        loops=loops,
        cfg=cfg,
    )
    if kind == "leverage_loop" and loops > cfg.max_leverage_loops:
        blockers.append("too_many_loops")

    ok = len(blockers) == 0
    return {
        "ok": ok,
        "blockers": blockers,
        "warnings": warnings,
        "il_pct": round(impermanent_loss_approx(lp_price_ratio or 1.0), 6)
        if kind == "lp"
        else 0.0,
        "loop": loop_info,
        "cfg": asdict(cfg),
    }


if __name__ == "__main__":
    print("IL +25%", impermanent_loss_approx(1.25))
    print("risk lend", assess_position_risk(kind="lend", hatom_hf=2.5))
    print("risk loop defense", assess_position_risk(kind="leverage_loop", hatom_hf=2.5, defense_active=True, loops=2))
