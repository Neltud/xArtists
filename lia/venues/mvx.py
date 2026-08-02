"""
MultiversX venue adapters — prices / yield hints for strategies.
No PEM; read-only HTTP. Fail soft → empty signals.
"""
from __future__ import annotations

import json
import urllib.request
from typing import Any, Optional

from lia.circuit.strategies import Signal, micro_arb, yield_first

API = "https://api.multiversx.com"


def _get_json(url: str, timeout: float = 12.0) -> Any:
    req = urllib.request.Request(url, headers={"User-Agent": "xArtists-LIA/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode())


def fetch_token_price(token_id: str) -> float:
    try:
        data = _get_json(f"{API}/tokens/{token_id}")
        return float(data.get("price") or 0)
    except Exception:
        return 0.0


def xexchange_onedex_arb(
    *,
    token: str = "WEGLD-bd4d79",
    price_xex: Optional[float] = None,
    price_onedex: Optional[float] = None,
    fee_roundtrip: float = 0.006,
) -> Signal:
    """
    Micro-arb between two MVX venues.
    Callers should pass live mid prices from each DEX when available;
    falls back to single API price (no arb).
    """
    if price_xex is None:
        price_xex = fetch_token_price(token)
    if price_onedex is None:
        price_onedex = price_xex  # no second source → no spread
    return micro_arb(
        token=token,
        price_a=float(price_xex or 0),
        price_b=float(price_onedex or 0),
        fee_roundtrip=fee_roundtrip,
    )


def hatom_yield_signal(
    *,
    trade_confidence: float,
    stable_apy: float = 0.08,
    min_trade_conf: float = 0.65,
) -> Signal:
    """Route idle capital narrative to Hatom/USDC sleeve when no trade edge."""
    sig = yield_first(
        trade_confidence=trade_confidence,
        min_trade_conf=min_trade_conf,
        stable_apy=stable_apy,
    )
    if sig.action == "YIELD":
        sig.meta = {**(sig.meta or {}), "venue": "hatom", "chain": "multiversx"}
        sig.reason = f"hatom/yield_sleeve: {sig.reason}"
    return sig


def xoxno_note() -> dict[str, Any]:
    return {
        "venue": "xoxno",
        "role": "external_nft",
        "status": "partial",
        "signal": None,
        "note": "NFT buys external; LIA compound does not trade NFT floor as +1% circuit",
    }
