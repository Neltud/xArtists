"""
Block-by-block multi-DEX arb scan (MultiversX).
Venues: xExchange, OneDex, JEXchange, AshSwap (mids).
XOXNO = NFT only (excluded from ESDT arb).
Soul = experimental (excluded from mainnet arb).
"""
from __future__ import annotations

import time
from itertools import combinations
from typing import Any, Optional

from lia.board.risk import DEFAULT_LIMITS, RiskLimits
from lia.venues.onchain_feeds import (
    all_placement_feeds,
    network_block_meta,
)

ARB_VENUES = ("xexchange", "onedex", "jexchange", "ashswap")


def _mids_from_feeds(feeds: dict[str, Any]) -> dict[str, float]:
    venues = feeds.get("venues") or {}
    out: dict[str, float] = {}
    for vid in ARB_VENUES:
        v = venues.get(vid) or {}
        mid = float(v.get("mid_usd") or 0)
        if mid > 0:
            out[vid] = mid
    return out


def pairwise_edges(mids: dict[str, float]) -> list[dict[str, Any]]:
    rows = []
    for a, b in combinations(sorted(mids.keys()), 2):
        pa, pb = mids[a], mids[b]
        if pa <= 0 or pb <= 0:
            continue
        edge = abs(pa - pb) / min(pa, pb)
        buy = a if pa < pb else b
        sell = b if buy == a else a
        rows.append(
            {
                "buy_venue": buy,
                "sell_venue": sell,
                "price_buy": pa if buy == a else pb,
                "price_sell": pb if buy == a else pa,
                "edge": round(edge, 6),
            }
        )
    rows.sort(key=lambda x: x["edge"], reverse=True)
    return rows


def scan_block_arb(
    *,
    token: str = "WEGLD-bd4d79",
    limits: Optional[RiskLimits] = None,
    trades_today: int = 0,
    feeds: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    lim = limits or DEFAULT_LIMITS
    block = network_block_meta()
    data = feeds or all_placement_feeds(token=token)
    mids = _mids_from_feeds(data)
    edges = pairwise_edges(mids)
    best = edges[0] if edges else None
    fee = lim.fee_roundtrip
    min_edge = lim.min_edge_after_fees
    actionable = False
    if best and best["edge"] > (fee + min_edge):
        if trades_today < lim.max_trades_per_day:
            actionable = True

    return {
        "hf_mode": lim.hf_mode,
        "limits": lim.to_dict(),
        "block": block,
        "token": token,
        "mids": mids,
        "pairs": edges,
        "best": best,
        "actionable": actionable,
        "excluded": {
            "xoxno": "NFT market — not ESDT arb",
            "soul": "testnet/experimental — no mainnet arb",
            "hatom": "lending — yield sleeve not arb path",
        },
        "note": (
            "Block-time scan only (~6s). Not sub-ms HFT. "
            "When all mids come from the same MVX index, edges≈0 until venue-specific quotes are wired."
        ),
        "updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }


def scan_micro_arb(**kwargs: Any) -> dict[str, Any]:
    """Backward-compatible alias."""
    return scan_block_arb(**kwargs)
