"""
Task 2 — Server-side friction model for paper legs (Vellum / aggregator).
Mirrors browser shadowLedger assumptions.
"""
from __future__ import annotations

from typing import Any

GAS_EGLD = 0.0008
EGLD_USD_FALLBACK = 20.0


def estimate_slippage_pct(liquidity: float, amount: float) -> float:
    depth = max(float(liquidity or 0.05), 0.05)
    impact = min(2.5, (float(amount) / (depth * 100.0)) * 100.0)
    return max(0.05, impact)


def apply_friction_to_leg(leg: dict[str, Any], *, egld_usd: float = EGLD_USD_FALLBACK) -> dict[str, Any]:
    """Return a copy of leg with friction fields; does not mutate strategy truth."""
    out = dict(leg)
    liq = float(leg.get("liquidity") or 0.5)
    amount = float(leg.get("amount") or leg.get("size") or 0.1)
    slip = estimate_slippage_pct(liq, amount)
    fee_usd = GAS_EGLD * (egld_usd or EGLD_USD_FALLBACK)
    out["slippage_pct"] = round(slip, 4)
    out["fee_egld"] = GAS_EGLD
    out["fee_usd_est"] = round(fee_usd, 6)
    # Adjust pnl if present
    try:
        pnl = float(leg.get("pnl_usd") if leg.get("pnl_usd") is not None else leg.get("pnl") or 0)
        out["pnl_usd_friction"] = round(pnl - fee_usd - abs(pnl) * (slip / 100.0) * 0.1, 6)
    except (TypeError, ValueError):
        out["pnl_usd_friction"] = None
    out["friction_model"] = "gas_0.0008_egld+slip_liquidity"
    return out


def enrich_legs(legs: list[Any], *, egld_usd: float = EGLD_USD_FALLBACK) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for leg in legs:
        if isinstance(leg, dict):
            out.append(apply_friction_to_leg(leg, egld_usd=egld_usd))
    return out
