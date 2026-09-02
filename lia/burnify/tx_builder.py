"""Build MultiversX data payloads for Burnify staking SC (deposit, claimRewards)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .config import BFY_TOKEN_ID, STAKING_SC, TRO_TOKEN_ID


def _str_to_hex(s: str) -> str:
    return "".join(f"{b:02x}" for b in s.encode("utf-8"))


def _int_to_hex(n: int) -> str:
    h = format(int(n), "x")
    return h if len(h) % 2 == 0 else f"0{h}"


@dataclass
class TxIntent:
    kind: str
    receiver: str
    value_egld_atomic: int
    data: str
    gas_limit: int
    notes: str
    chain_id: str = "1"

    def as_dict(self) -> dict[str, Any]:
        return {
            "kind": self.kind,
            "receiver": self.receiver,
            "value": str(self.value_egld_atomic),
            "data": self.data,
            "gasLimit": self.gas_limit,
            "chainID": self.chain_id,
            "notes": self.notes,
        }


def build_claim_rewards_egld(*, staking_sc: str = STAKING_SC) -> TxIntent:
    return TxIntent(
        kind="claim_egld",
        receiver=staking_sc,
        value_egld_atomic=0,
        data=_str_to_hex("claimRewards"),
        gas_limit=12_000_000,
        notes="Burnify staking claimRewards → EGLD to LIA",
    )


def build_stake_bfy(
    amount_atomic: int, *, staking_sc: str = STAKING_SC, bfy_token: str = BFY_TOKEN_ID
) -> TxIntent:
    if amount_atomic <= 0:
        raise ValueError("BFY amount must be > 0")
    data = "@".join(
        ["ESDTTransfer", _str_to_hex(bfy_token), _int_to_hex(amount_atomic), _str_to_hex("deposit")]
    )
    return TxIntent(
        kind="stake_bfy",
        receiver=staking_sc,
        value_egld_atomic=0,
        data=data,
        gas_limit=15_000_000,
        notes="Stake BFY on Burnify (deposit)",
    )


def build_tro_batch_intent(
    *, n_batches: int, tro_atomic: int, egld_atomic: int, tro_token: str = TRO_TOKEN_ID
) -> dict[str, Any]:
    return {
        "kind": "tro_burn_batch",
        "n_batches": n_batches,
        "tro_token": tro_token,
        "tro_atomic": tro_atomic,
        "egld_atomic": egld_atomic,
        "receiver": "BURNIFY_BATCH_SC",
        "status": "intent",
        "notes": "Requires TRO listed. Execute via burnify.app or official batch endpoint.",
    }
