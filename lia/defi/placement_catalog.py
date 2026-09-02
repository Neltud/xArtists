"""
LIA placement catalog — MultiversX liquidity & yield venues.

Single source of truth for what LIA can consider (paper-first):
  Hatom money markets + liquid staking (sEGLD/HsEGLD/xEGLD)
  xExchange pools + farms + xMEX rewards
  OneDex / AshSwap pools (arb + optional LP)
  xMEX lock / weekly energy-boosted compounding

No hard-coded mainnet SC addresses required for signal mode.
Live needs contracts.json entries + LIA_LIVE_TRADING micro proof.
"""
from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from typing import Any, Optional


@dataclass
class Placement:
    id: str
    protocol: str
    kind: str  # lend | borrow | lp | farm | stake | lock_rewards | liquid_stake | arb_pool
    asset: str
    risk: str  # low | medium | high
    il_risk: bool
    leverage_ok: bool
    estimated_apy_hint: float  # informational only
    compound_style: str  # none | continuous | weekly | claim_manual
    notes: str = ""
    tools: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


# Catalog — strategic options for Vellum / board
CATALOG: list[Placement] = [
    # --- Hatom ---
    Placement(
        "hatom_mm_egld",
        "hatom",
        "lend",
        "EGLD/WEGLD",
        "medium",
        False,
        True,
        0.03,
        "continuous",
        "Money market supply; HF gated; optional collateral",
        ["hatom_routes", "yield_risk"],
    ),
    Placement(
        "hatom_mm_usdc",
        "hatom",
        "lend",
        "USDC",
        "low",
        False,
        True,
        0.04,
        "continuous",
        "Stable lend; preferred in DEFENSE for surplus",
        ["hatom_routes"],
    ),
    Placement(
        "hatom_borrow",
        "hatom",
        "borrow",
        "variable",
        "high",
        False,
        True,
        0.0,
        "none",
        "Borrow vs collateral; HF≥1.8; blocked in DEFENSE",
        ["hatom_routes", "yield_risk"],
    ),
    Placement(
        "hatom_liquid_segld",
        "hatom",
        "liquid_stake",
        "sEGLD",
        "medium",
        False,
        False,
        0.06,
        "continuous",
        "Liquid staking reward-bearing",
        ["hatom_routes"],
    ),
    Placement(
        "hatom_liquid_hsegld",
        "hatom",
        "liquid_stake",
        "HsEGLD",
        "medium",
        False,
        False,
        0.07,
        "continuous",
        "Boosted liquid stake form",
        ["hatom_routes"],
    ),
    Placement(
        "hatom_xegld",
        "hatom",
        "liquid_stake",
        "xEGLD",
        "high",
        False,
        True,
        0.10,
        "continuous",
        "Leveraged liquid staking — treat as high risk",
        ["hatom_routes", "yield_risk"],
    ),
    Placement(
        "hatom_htm_stake",
        "hatom",
        "stake",
        "HTM",
        "medium",
        False,
        False,
        0.0,
        "claim_manual",
        "Stake HTM; claim rewards periodically",
        ["hatom_routes"],
    ),
    # --- xExchange ---
    Placement(
        "xex_lp",
        "xexchange",
        "lp",
        "pair LP",
        "high",
        True,
        False,
        0.05,
        "none",
        "LP fees + IL; IL gate max 5%",
        ["yield_risk", "placement_strategy"],
    ),
    Placement(
        "xex_farm",
        "xexchange",
        "farm",
        "LP staked",
        "high",
        True,
        False,
        0.12,
        "weekly",
        "Farm LP → xMEX rewards (lockable)",
        ["xmex_compound", "yield_risk"],
    ),
    Placement(
        "xex_xmex_lock",
        "xexchange",
        "lock_rewards",
        "xMEX",
        "medium",
        False,
        False,
        0.0,
        "weekly",
        "Lock xMEX for energy / boosted farm rewards",
        ["xmex_compound"],
    ),
    Placement(
        "xex_mex_unlock",
        "xexchange",
        "lock_rewards",
        "MEX",
        "medium",
        False,
        False,
        0.0,
        "claim_manual",
        "Unlock xMEX→MEX when strategy prefers liquid MEX",
        ["xmex_compound"],
    ),
    # --- OneDex / AshSwap ---
    Placement(
        "onedex_pool",
        "onedex",
        "arb_pool",
        "pair",
        "medium",
        True,
        False,
        0.0,
        "none",
        "Price source + optional LP; primary use = arb scan",
        ["micro_arb", "strategies_venues"],
    ),
    Placement(
        "ashswap_pool",
        "ashswap",
        "arb_pool",
        "pair",
        "medium",
        True,
        False,
        0.0,
        "none",
        "Aggregator + pools; arb vs xEx/OneDex",
        ["micro_arb"],
    ),
    Placement(
        "ashswap_agg",
        "ashswap",
        "arb_pool",
        "route",
        "low",
        False,
        False,
        0.0,
        "none",
        "Best execution route for swaps (tool, not LP)",
        ["micro_arb", "gas.micro_trade"],
    ),
]


def list_placements(
    *,
    protocol: Optional[str] = None,
    kind: Optional[str] = None,
    max_risk: Optional[str] = None,
) -> list[dict[str, Any]]:
    risk_order = {"low": 0, "medium": 1, "high": 2}
    max_r = risk_order.get(max_risk or "high", 2)
    out = []
    for p in CATALOG:
        if protocol and p.protocol != protocol:
            continue
        if kind and p.kind != kind:
            continue
        if risk_order.get(p.risk, 2) > max_r:
            continue
        out.append(p.to_dict())
    return out


def best_tools_matrix() -> dict[str, list[str]]:
    """What LIA modules to call per goal."""
    return {
        "lend_stable": ["hatom_routes.SUPPLY", "yield_risk.HF"],
        "lend_egld": ["hatom_routes.SUPPLY", "yield_risk.HF"],
        "borrow_loop": ["hatom_routes.LEVERAGE_LOOP", "yield_risk", "defense_circuit"],
        "liquid_stake": ["hatom liquid sEGLD/HsEGLD", "avoid xEGLD unless HF high"],
        "lp_farm_xmex": ["xex_lp + xex_farm", "yield_risk.IL", "xmex_compound weekly"],
        "arb": ["micro_arb xEx vs OneDex vs Ash", "should_skip_micro_trade"],
        "swap_exec": ["ashswap_agg preferred", "gas gate"],
        "weekly_rewards": ["xmex_compound.claim_and_compound"],
        "defense": ["stable_idle or hatom_mm_usdc only"],
    }


if __name__ == "__main__":
    print(json.dumps({"n": len(CATALOG), "tools": best_tools_matrix()}, indent=2))
