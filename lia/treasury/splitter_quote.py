"""Off-chain quote — Mission 40% · Reserve 30% · Reward 20% · Ops 10%."""
from __future__ import annotations

from typing import Dict

DEFAULT_BPS = {"mission": 4000, "reserve": 3000, "reward": 2000, "ops": 1000}
BPS_DENOM = 10_000


def quote_split(amount_atomic: int, bps: Dict[str, int] | None = None) -> Dict[str, int]:
    if amount_atomic < 0:
        raise ValueError("amount must be >= 0")
    b = dict(DEFAULT_BPS if bps is None else bps)
    if sum(b.values()) != BPS_DENOM:
        raise ValueError("bps must sum to 10000")
    mission = amount_atomic * b["mission"] // BPS_DENOM
    reserve = amount_atomic * b["reserve"] // BPS_DENOM
    reward = amount_atomic * b.get("reward", b.get("community", 0)) // BPS_DENOM
    ops = amount_atomic - mission - reserve - reward
    return {
        "amount": amount_atomic,
        "mission": mission,
        "reserve": reserve,
        "reward": reward,
        "ops": ops,
        "bps": b,
    }
