"""xOrus physical NFT reward policy candidate — never broadcasts a TRO transfer."""
from __future__ import annotations

import re
from collections.abc import Mapping, Collection
from typing import Any

TX_HASH = re.compile(r"^[0-9a-f]{64}$")
NFT_ID = re.compile(r"^[A-Z0-9]{3,20}-[0-9a-f]{6}-[0-9a-f]{2,16}$")
ADDR = re.compile(r"^erd1[a-z0-9]{58}$")
MAX_NFTS_PER_COLLECTION = 500


def evaluate_physical_mint(
    proof: Mapping[str, Any] | None,
    *,
    already_reserved: Collection[str] = (),
    reserved_count: int = 0,
    verified_reserve_tro: int = 0,
    trusted_verifier: bool = False,
) -> dict[str, Any]:
    """Plan max 1 TRO for a verified physical NFT minted through xArtists.

    This function cannot verify chain receipts itself. trusted_verifier must
    come from an authenticated backend, never a browser field. A positive
    result needs durable atomic reservation and later human approval.
    """
    def result(code: str, amount: int = 0, key: str | None = None) -> dict[str, Any]:
        return {"code": code, "amount_tro": str(amount), "key": key,
                "transfer_authorized": False, "payout_status": "not_paid"}
    if not trusted_verifier or not isinstance(proof, Mapping):
        return result("VERIFIER_REQUIRED")
    if proof.get("chain") != "multiversx-mainnet":
        return result("CHAIN_NOT_SUPPORTED_FOR_TRO_REWARD")
    if proof.get("physical_verified") is not True or proof.get("mint_success") is not True:
        return result("PHYSICAL_MINT_NOT_VERIFIED")
    if proof.get("xartists_issuer_verified") is not True or proof.get("artist_rights_verified") is not True:
        return result("ISSUER_OR_RIGHTS_NOT_VERIFIED")
    tx, nft, creator = proof.get("tx_hash"), proof.get("nft_id"), proof.get("creator")
    physical_id = proof.get("physical_object_id")
    if (not isinstance(tx, str) or not TX_HASH.fullmatch(tx)
        or not isinstance(nft, str) or not NFT_ID.fullmatch(nft)
        or not isinstance(creator, str) or not ADDR.fullmatch(creator)
        or not isinstance(physical_id, str) or not physical_id.strip()
        or not isinstance(proof.get("block_nonce"), int)
        or isinstance(proof.get("block_nonce"), bool) or proof["block_nonce"] <= 0
        or proof.get("finalized") is not True):
        return result("RECEIPT_INVALID_OR_UNFINALIZED")
    key = f"multiversx-mainnet:{nft}"
    if key in already_reserved:
        return result("DUPLICATE_REWARD", key=key)
    if isinstance(reserved_count, bool) or not isinstance(reserved_count, int) or reserved_count < 0:
        return result("BAD_RESERVATION_STATE")
    if reserved_count >= MAX_NFTS_PER_COLLECTION:
        return result("CAP_REACHED", key=key)
    if isinstance(verified_reserve_tro, bool) or not isinstance(verified_reserve_tro, int) or verified_reserve_tro < 1:
        return result("RESERVE_NOT_VERIFIED", key=key)
    return result("PENDING_DURABLE_RESERVATION_AND_HUMAN_APPROVAL", amount=1, key=key)
