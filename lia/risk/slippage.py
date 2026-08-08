"""
Slippage management — size-aware, venue-aware, adaptive caps.
=============================================================
Used before any swap/intent (MVX DEX, Jupiter, HL).
Never assumes zero impact; scales max_slippage_bps with notional.
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Any, Optional


@dataclass(frozen=True)
class SlippagePolicy:
    base_bps: int = 30  # 0.30%
    max_bps: int = 150  # hard cap 1.5%
    min_bps: int = 15
    # impact ≈ k * sqrt(notional / depth_usd)
    impact_k: float = 80.0
    default_depth_usd: float = 50_000.0
    # volatility bump
    vol_bps_per_atr_pct: float = 20.0
    # cross-chain / bridge extra
    bridge_extra_bps: int = 40


VENUE_DEPTH: dict[str, float] = {
    "xexchange": 80_000,
    "onedex": 25_000,
    "jexchange": 20_000,
    "ashswap": 40_000,
    "jupiter": 500_000,
    "raydium": 200_000,
    "hyperliquid": 1_000_000,
    "hatom": 0,  # not a swap venue
}


def estimate_impact_bps(
    notional_usd: float,
    *,
    depth_usd: float,
    policy: Optional[SlippagePolicy] = None,
) -> float:
    p = policy or SlippagePolicy()
    depth = max(depth_usd, 1.0)
    # square-root market impact
    return p.impact_k * math.sqrt(max(notional_usd, 0.0) / depth)


def recommended_slippage_bps(
    *,
    notional_usd: float,
    venue_id: str = "xexchange",
    atr_pct: float = 0.0,
    cross_chain: bool = False,
    policy: Optional[SlippagePolicy] = None,
) -> dict[str, Any]:
    p = policy or SlippagePolicy()
    depth = VENUE_DEPTH.get(venue_id, p.default_depth_usd)
    impact = estimate_impact_bps(notional_usd, depth_usd=depth, policy=p)
    vol_bump = max(0.0, atr_pct) * 100 * p.vol_bps_per_atr_pct  # atr_pct e.g. 0.02
    raw = p.base_bps + impact + vol_bump
    if cross_chain:
        raw += p.bridge_extra_bps
    bps = int(min(p.max_bps, max(p.min_bps, round(raw))))
    return {
        "slippage_bps": bps,
        "slippage_pct": bps / 10_000,
        "impact_bps": round(impact, 2),
        "vol_bump_bps": round(vol_bump, 2),
        "depth_usd": depth,
        "venue_id": venue_id,
        "cross_chain": cross_chain,
        "policy_max_bps": p.max_bps,
    }


def effective_fill_price(
    mid: float,
    *,
    side: str,
    slippage_bps: int,
) -> float:
    """Worst-case fill for limit protection."""
    if mid <= 0:
        return 0.0
    s = slippage_bps / 10_000.0
    side_u = (side or "buy").lower()
    if side_u in ("buy", "long"):
        return mid * (1 + s)
    return mid * (1 - s)


def net_edge_after_slippage(
    gross_edge: float,
    *,
    buy_slip_bps: int,
    sell_slip_bps: int,
    fee_roundtrip: float = 0.006,
    bridge_bps: int = 0,
) -> float:
    """gross_edge is relative (e.g. 0.01 = 1%)."""
    slip = (buy_slip_bps + sell_slip_bps + bridge_bps) / 10_000.0
    return gross_edge - slip - fee_roundtrip


def guard_quote(
    *,
    mid: float,
    side: str,
    notional_usd: float,
    venue_id: str,
    max_slippage_bps: Optional[int] = None,
    atr_pct: float = 0.0,
    cross_chain: bool = False,
) -> dict[str, Any]:
    """Return allowed slip + worst fill; reject if required > max."""
    rec = recommended_slippage_bps(
        notional_usd=notional_usd,
        venue_id=venue_id,
        atr_pct=atr_pct,
        cross_chain=cross_chain,
    )
    cap = max_slippage_bps if max_slippage_bps is not None else SlippagePolicy().max_bps
    ok = rec["slippage_bps"] <= cap
    fill = effective_fill_price(mid, side=side, slippage_bps=rec["slippage_bps"])
    return {
        "ok": ok,
        "reason": "ok" if ok else "slippage_above_cap",
        "fill_price": fill,
        "max_slippage_bps": cap,
        **rec,
    }
