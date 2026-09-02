"""Creator $TRO rewards — max 1 TRO per real/physical NFT (first sale)."""
from __future__ import annotations

MAX_TRO_PER_PHYSICAL_NFT = 1.0


def reward_for_physical_nft(*, is_physical: bool, first_sale: bool, already_paid: bool) -> dict:
    if not is_physical:
        return {"tro": 0.0, "reason": "digital_no_auto_reward"}
    if not first_sale:
        return {"tro": 0.0, "reason": "not_first_sale"}
    if already_paid:
        return {"tro": 0.0, "reason": "already_paid"}
    return {"tro": MAX_TRO_PER_PHYSICAL_NFT, "reason": "physical_first_sale_cap_1"}
