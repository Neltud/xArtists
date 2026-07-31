"""
LIA Asset Policy — Vellum final construction
===========================================
Règle stricte (Neltud 31 juil 2026):

  LIA ACCUMULE uniquement : EGLD, WEGLD, WBTC / HWBTC, USDC
  LIA NE GARDE PAS $TRO dans le wallet opérationnel.

  Tout $TRO récupéré (trading, fees, rewards, airdrops) est redistribué :
    - pool (LP TRO/EGLD ou TRO/USDC)     → default 40%
    - stake (TRO staking / governance)   → default 30%
    - rewards (distribute to stakers)    → default 20%
    - burn                               → default 10%

Ces ratios sont configurables via data/lia_tro_policy.json.
"""
from __future__ import annotations

import json
import os
from dataclasses import dataclass, asdict
from typing import Any, Optional

# Tokens LIA is allowed to hold / accumulate
ACCUMULATE_TOKENS = frozenset({
    "EGLD",
    "WEGLD-bd4d79",
    "WEGLD",
    "USDC-c76f1f",
    "USDC",
    "WBTC",
    "HWBTC-49ca31",
    "HWBTC",
    "BTC",
})

TRO_ID = "TRO-94c925"
TRO_ALIASES = frozenset({TRO_ID, "TRO", "TUDURIORIGINAL"})

DEFAULT_TRO_SPLIT = {
    "pool_bps": 4000,      # 40% → LP
    "stake_bps": 3000,     # 30% → staking SC
    "rewards_bps": 2000,   # 20% → rewards pot
    "burn_bps": 1000,      # 10% → burn
}


@dataclass
class TroDistributionPlan:
    total_atomic: int
    pool: int
    stake: int
    rewards: int
    burn: int
    pool_target: str
    stake_target: str
    rewards_target: str
    burn_target: str  # dead address or local burn

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def load_policy(path: str = "data/lia_tro_policy.json") -> dict[str, Any]:
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return {
            "accumulate": list(ACCUMULATE_TOKENS),
            "tro_token": TRO_ID,
            "split_bps": DEFAULT_TRO_SPLIT,
            "pool_address": "erd1qqqqqqqqqqqqqpgqqz6vp9y50ep867vnr296mqf3dduh6guvmvlsu3sujc",
            "stake_address": "erd1qqqqqqqqqqqqqpgqrscvsxseyw04l0urzgnm2er5mxd2z64nyj7s6e0ca8",
            "rewards_address": "",
            "burn_address": "erd1deaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaqtvj5r6",
            "note": "LIA holds EGLD/WBTC/USDC only; TRO is always redistributed",
        }


def is_accumulate_token(identifier: str) -> bool:
    id_up = identifier.upper()
    if id_up in {t.upper() for t in ACCUMULATE_TOKENS}:
        return True
    # prefix match for variants
    for t in ACCUMULATE_TOKENS:
        if id_up.startswith(t.upper().split("-")[0]):
            if "TRO" in id_up:
                return False
            return True
    return False


def is_tro(identifier: str) -> bool:
    id_up = identifier.upper()
    return any(a.upper() in id_up or id_up == a.upper() for a in TRO_ALIASES)


def plan_tro_distribution(
    amount_atomic: int,
    policy: Optional[dict[str, Any]] = None,
) -> TroDistributionPlan:
    """Split TRO amount according to policy. Remainder goes to pool."""
    pol = policy or load_policy()
    split = pol.get("split_bps", DEFAULT_TRO_SPLIT)
    pool_bps = int(split.get("pool_bps", 4000))
    stake_bps = int(split.get("stake_bps", 3000))
    rewards_bps = int(split.get("rewards_bps", 2000))
    burn_bps = int(split.get("burn_bps", 1000))
    total_bps = pool_bps + stake_bps + rewards_bps + burn_bps
    if total_bps <= 0:
        total_bps = 10000

    pool = amount_atomic * pool_bps // total_bps
    stake = amount_atomic * stake_bps // total_bps
    rewards = amount_atomic * rewards_bps // total_bps
    burn = amount_atomic * burn_bps // total_bps
    # fix rounding remainder → pool
    used = pool + stake + rewards + burn
    if used < amount_atomic:
        pool += amount_atomic - used

    return TroDistributionPlan(
        total_atomic=amount_atomic,
        pool=pool,
        stake=stake,
        rewards=rewards,
        burn=burn,
        pool_target=pol.get("pool_address", ""),
        stake_target=pol.get("stake_address", ""),
        rewards_target=pol.get("rewards_address") or pol.get("stake_address", ""),
        burn_target=pol.get("burn_address", "erd1deaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaqtvj5r6"),
    )


def filter_portfolio_for_lia(assets: dict[str, Any]) -> dict[str, Any]:
    """
    From a portfolio snapshot, separate holdable vs TRO-to-redistribute.
    assets: { identifier: { balance, ... }, ... }
    """
    keep: dict[str, Any] = {}
    redistribute_tro: list[dict[str, Any]] = []
    for ident, meta in assets.items():
        if is_tro(ident):
            redistribute_tro.append({"identifier": ident, **(meta if isinstance(meta, dict) else {"raw": meta})})
        elif is_accumulate_token(ident):
            keep[ident] = meta
        # other tokens ignored for accumulation (don't force sell)
    return {"accumulate": keep, "tro_to_distribute": redistribute_tro}


def build_tro_redistribution_txs(
    amount_atomic: int,
    policy: Optional[dict[str, Any]] = None,
) -> list[dict[str, Any]]:
    """
    Build high-level tx intents for UniversalExecutor / Vellum nodes.
    Actual ESDTTransfer data is left to the executor (token id TRO-94c925).
    """
    plan = plan_tro_distribution(amount_atomic, policy)
    txs: list[dict[str, Any]] = []
    if plan.pool > 0 and plan.pool_target:
        txs.append({"kind": "esdt_transfer", "token": TRO_ID, "amount": plan.pool, "to": plan.pool_target, "label": "pool"})
    if plan.stake > 0 and plan.stake_target:
        txs.append({"kind": "esdt_transfer", "token": TRO_ID, "amount": plan.stake, "to": plan.stake_target, "label": "stake"})
    if plan.rewards > 0 and plan.rewards_target:
        txs.append({"kind": "esdt_transfer", "token": TRO_ID, "amount": plan.rewards, "to": plan.rewards_target, "label": "rewards"})
    if plan.burn > 0 and plan.burn_target:
        txs.append({"kind": "esdt_transfer", "token": TRO_ID, "amount": plan.burn, "to": plan.burn_target, "label": "burn"})
    return txs


if __name__ == "__main__":
    pol = load_policy()
    print(json.dumps(pol, indent=2))
    plan = plan_tro_distribution(10_000_000_000_000_000_000)  # 10 TRO (18 decimals)
    print(plan.to_dict())
    print(build_tro_redistribution_txs(10_000_000_000_000_000_000))
