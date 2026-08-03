"""
Gas-aware gates for LIA micro-trades on MultiversX.
Keeps fees from eating edge on small notionals.
"""
from __future__ import annotations

import json
import os
from typing import Any, Optional

from lia.gas.mvx_gas import estimate_fee_egld, network_gas_config

# Micro-tier limits (lower than deploy/heavy ops)
MICRO_GAS_LIMITS = {
    "transfer_egld": 50_000,
    "esdt_transfer": 500_000,
    "swap_simple": int(os.environ.get("MICRO_GAS_LIMIT_SWAP", "15000000")),
    "swap_complex": 30_000_000,
    "nft_transfer": 1_000_000,
}

MIN_NOTIONAL_USD = float(os.environ.get("MICRO_MIN_NOTIONAL_USD", "5"))
MAX_GAS_FRAC = float(os.environ.get("MICRO_MAX_GAS_FRAC_OF_NOTIONAL", "0.15"))
COST_MARGIN = float(os.environ.get("MICRO_COST_MARGIN", "1.20"))
MIN_EDGE_OVER_GAS = float(os.environ.get("MICRO_MIN_EDGE_OVER_GAS", "2.0"))


def fee_for_op(op: str = "swap_simple", *, egld_usd: float = 20.0) -> dict[str, Any]:
    limit = MICRO_GAS_LIMITS.get(op, MICRO_GAS_LIMITS["swap_simple"])
    cfg = network_gas_config()
    est = estimate_fee_egld(limit, is_contract=op != "transfer_egld", cfg=cfg)
    fee_egld = est["fee_egld"]
    return {
        **est,
        "op": op,
        "fee_usd": fee_egld * egld_usd,
        "egld_usd": egld_usd,
    }


def recommend_gas_limit(simulated_units: Optional[int], op: str = "swap_simple") -> int:
    """Apply margin on simulated cost; floor to micro table."""
    base = MICRO_GAS_LIMITS.get(op, MICRO_GAS_LIMITS["swap_simple"])
    if simulated_units and simulated_units > 0:
        return max(int(simulated_units * COST_MARGIN), int(base * 0.5))
    return base


def should_skip_micro_trade(
    *,
    notional_usd: float,
    expected_edge_usd: float = 0.0,
    op: str = "swap_simple",
    egld_usd: float = 20.0,
    simulated_gas_units: Optional[int] = None,
) -> dict[str, Any]:
    """
    Return skip=True when gas dominates micro-trade economics.
    """
    limit = recommend_gas_limit(simulated_gas_units, op)
    fee = estimate_fee_egld(
        limit,
        is_contract=op != "transfer_egld",
        cfg=network_gas_config(),
    )
    gas_usd = fee["fee_egld"] * egld_usd
    reasons: list[str] = []

    if notional_usd < MIN_NOTIONAL_USD:
        reasons.append(f"notional ${notional_usd:.2f} < min ${MIN_NOTIONAL_USD}")
    if notional_usd > 0 and gas_usd > MAX_GAS_FRAC * notional_usd:
        reasons.append(
            f"gas ${gas_usd:.4f} > {MAX_GAS_FRAC:.0%} of notional ${notional_usd:.2f}"
        )
    if expected_edge_usd > 0 and expected_edge_usd < MIN_EDGE_OVER_GAS * gas_usd:
        reasons.append(
            f"edge ${expected_edge_usd:.4f} < {MIN_EDGE_OVER_GAS}× gas ${gas_usd:.4f}"
        )

    skip = len(reasons) > 0
    return {
        "skip": skip,
        "allow": not skip,
        "reasons": reasons,
        "gas_limit": limit,
        "gas_usd": round(gas_usd, 6),
        "notional_usd": notional_usd,
        "expected_edge_usd": expected_edge_usd,
        "rules": {
            "min_notional_usd": MIN_NOTIONAL_USD,
            "max_gas_frac": MAX_GAS_FRAC,
            "min_edge_over_gas": MIN_EDGE_OVER_GAS,
            "cost_margin": COST_MARGIN,
        },
    }


def optimize_plan(
    trades: list[dict[str, Any]],
    *,
    egld_usd: float = 20.0,
) -> dict[str, Any]:
    """Filter a list of candidate micro-trades by gas gates."""
    kept = []
    dropped = []
    for t in trades:
        decision = should_skip_micro_trade(
            notional_usd=float(t.get("notional_usd") or 0),
            expected_edge_usd=float(t.get("expected_edge_usd") or 0),
            op=str(t.get("op") or "swap_simple"),
            egld_usd=egld_usd,
            simulated_gas_units=t.get("simulated_gas_units"),
        )
        row = {**t, "gas_decision": decision}
        (dropped if decision["skip"] else kept).append(row)
    return {
        "kept": kept,
        "dropped": dropped,
        "n_kept": len(kept),
        "n_dropped": len(dropped),
        "egld_usd": egld_usd,
    }


if __name__ == "__main__":
    egld = 25.0
    print("fee swap_simple", json.dumps(fee_for_op("swap_simple", egld_usd=egld), indent=2))
    print(
        "gate $3",
        json.dumps(
            should_skip_micro_trade(notional_usd=3, expected_edge_usd=0.05, egld_usd=egld),
            indent=2,
        ),
    )
    print(
        "gate $20",
        json.dumps(
            should_skip_micro_trade(notional_usd=20, expected_edge_usd=0.5, egld_usd=egld),
            indent=2,
        ),
    )
