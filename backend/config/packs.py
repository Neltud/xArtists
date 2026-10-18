"""Commercial pack prices — server source of truth for PayBox / Stripe.

Never accept amount from the client or from a query string.
Aligned with apps/frontend/src/config/agentPacks.ts and services/access_pack/catalog.py.
"""
from __future__ import annotations

from typing import Any

AGENT_PACKS_EUR: dict[str, dict[str, Any]] = {
    "pulse": {
        "id": "pulse",
        "name": "Pulse Pack (Gold)",
        "price_eur": 110,
        "price_cents": 11000,
    },
    "yield": {
        "id": "yield",
        "name": "Yield Pack (Silver)",
        "price_eur": 75,
        "price_cents": 7500,
    },
    "sentinel": {
        "id": "sentinel",
        "name": "Sentinel Pack (Platinum)",
        "price_eur": 50,
        "price_cents": 5000,
    },
}


def get_pack(pack_id: str) -> dict[str, Any]:
    key = (pack_id or "").strip().lower()
    pack = AGENT_PACKS_EUR.get(key)
    if not pack:
        raise KeyError(f"unknown pack_id: {pack_id}")
    return dict(pack)


def price_cents(pack_id: str) -> int:
    """Always the catalog price. Client amount is ignored."""
    return int(get_pack(pack_id)["price_cents"])
