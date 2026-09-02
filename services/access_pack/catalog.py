"""Server-side pack catalog — never trust client prices."""
from __future__ import annotations

from typing import Any

# cents EUR — aligned agentPacks.ts list prices
PACK_CATALOG: dict[str, dict[str, Any]] = {
    "pulse": {
        "id": "pulse",
        "name": "Pulse",
        "price_eur": 18,
        "price_cents": 1800,
        "signal_intensity": 3,
        "strategies": ["MICRO_ARB", "MOMENTUM", "MEAN_REVERSION"],
        "model": "C",
    },
    "yield": {
        "id": "yield",
        "name": "Yield",
        "price_eur": 12,
        "price_cents": 1200,
        "signal_intensity": 2,
        "strategies": ["YIELD", "COMPOUND"],
        "model": "C",
    },
    "sentinel": {
        "id": "sentinel",
        "name": "Sentinel",
        "price_eur": 8,
        "price_cents": 800,
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
