"""
Block-time arb scan (MVX).
Not sub-second HFT — MultiversX block ~6s. Edge must clear fees+gas.
"""
from __future__ import annotations

import time
from typing import Any, Optional

from lia.venues.mvx import fetch_token_price, xexchange_onedex_arb


def scan_micro_arb(
    *,
    token: str = "WEGLD-bd4d79",
    price_xex: Optional[float] = None,
    price_onedex: Optional[float] = None,
    fee_roundtrip: float = 0.006,
    min_edge: float = 0.004,
) -> dict[str, Any]:
    px = price_xex if price_xex is not None else fetch_token_price(token)
    py = price_onedex if price_onedex is not None else px
    sig = xexchange_onedex_arb(
        token=token,
        price_xex=px,
        price_onedex=py,
        fee_roundtrip=fee_roundtrip,
    )
    edge = 0.0
    if px and py and min(px, py) > 0:
        edge = abs(px - py) / min(px, py)
    actionable = edge > (fee_roundtrip + min_edge) and sig.action in ("BUY", "SELL", "ARB")
    return {
        "hf_mode": "block_scan",
        "note": "MVX settlement is block-time; not CEX sub-ms HFT",
        "token": token,
        "price_xexchange": px,
        "price_onedex": py,
        "edge": round(edge, 6),
        "fee_roundtrip": fee_roundtrip,
        "signal": {
            "action": sig.action,
            "confidence": sig.confidence,
            "reason": sig.reason,
            "meta": sig.meta,
        },
        "actionable": actionable,
        "updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
