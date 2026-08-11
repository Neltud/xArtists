"""Off-chain quote mirroring treasury-splitter bps (Mission/Reserve/Community)."""

from __future__ import annotations

from typing import Dict

DEFAULT_BPS = {"mission": 4000, "reserve": 3000, "community": 3000}
BPS_DENOM = 10_000


def quote_split(amount_atomic: int, bps: Dict[str, int] | None = None) -> Dict[str, int]:
    """Integer split; reserve absorbs remainder (same as SC)."""
    if amount_atomic < 0:
        raise ValueError("amount must be >= 0")
    b = dict(DEFAULT_BPS if bps is None else bps)
    if sum(b.values()) != BPS_DENOM:
        raise ValueError("bps must sum to 10000")
    mission = amount_atomic * b["mission"] // BPS_DENOM
    community = amount_atomic * b["community"] // BPS_DENOM
    reserve = amount_atomic - mission - community
    return {
        "amount": amount_atomic,
        "mission": mission,
        "reserve": reserve,
        "community": community,
        "bps": b,
    }
