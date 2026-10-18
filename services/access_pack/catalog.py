"""Server-side pack catalog — never trust client prices."""
from __future__ import annotations

from typing import Any

# cents EUR — source of truth, aligned with agentPacks.ts commercial list prices
PACK_CATALOG: dict[str, dict[str, Any]] = {
    "pulse": {
        "id": "pulse",
        "name": "Pulse Pack (Gold)",
        "price_eur": 110,
        "price_cents": 11000,
        "signal_intensity": 3,
        "strategies": ["MICRO_ARB", "MOMENTUM", "MEAN_REVERSION"],
        "model": "C",
    },
    "yield": {
        "id": "yield",
        "name": "Yield Pack (Silver)",
        "price_eur": 75,
        "price_cents": 7500,
        "signal_intensity": 2,
        "strategies": ["YIELD", "COMPOUND"],
        "model": "C",
    },
    "sentinel": {
        "id": "sentinel",
        "name": "Sentinel Pack (Platinum)",
        "price_eur": 50,
        "price_cents": 5000,
        "signal_intensity": 1,
        "strategies": ["DEFENSE", "SOCIAL_WATCH", "ADVISOR"],
        "model": "C",
    },
}


def get_pack(pack_id: str) -> dict[str, Any]:
    p = PACK_CATALOG.get(pack_id.lower())
    if not p:
        raise KeyError(f"unknown pack_id: {pack_id}")
    return p
