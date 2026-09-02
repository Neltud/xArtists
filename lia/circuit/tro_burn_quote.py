"""Off-chain quote for tro-burn rewards (mirrors SC quoteReward)."""
from __future__ import annotations
from dataclasses import dataclass

@dataclass
class BurnQuote:
    reward_total_wei: int
    to_user_wei: int
    to_protocol_wei: int
    whole_tro: int
    capped_by_pool: bool

def quote_reward(
    tro_amount_atomic: int,
    *,
    tro_decimals: int = 6,
    egld_per_whole_tro: int = 10**15,
    protocol_fee_bps: int = 1000,
    pool_egld_wei: int = 10**18,
) -> BurnQuote:
    if tro_amount_atomic <= 0:
        return BurnQuote(0, 0, 0, 0, False)
    divisor = 10**tro_decimals
    whole = tro_amount_atomic // divisor
    reward = whole * egld_per_whole_tro
    capped = False
    if reward > pool_egld_wei:
        reward = max(0, pool_egld_wei)
        capped = True
    fee = (reward * protocol_fee_bps) // 10_000
    return BurnQuote(reward, reward - fee, fee, whole, capped)

def human_tro_to_atomic(human: float, decimals: int = 6) -> int:
    return int(round(human * (10**decimals)))
