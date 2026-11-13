"""Read-only native SOL transfer evidence for xArtists ops.

NO PayBox integration, wallet-control attestation, payment reconciliation, or
signing. Never interpret this result as a paid order or permission to trade.
"""
from __future__ import annotations

import json
import re
import urllib.request
from typing import Any

_RPC = {
    "devnet": "https://api.devnet.solana.com",
    "mainnet": "https://api.mainnet-beta.solana.com",
}
_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
_VALID = re.compile(r"^[1-9A-HJ-NP-Za-km-z]+$")
_SYSTEM_PROGRAM = "11111111111111111111111111111111"
_COMPUTE_BUDGET = "ComputeBudget111111111111111111111111111111"


def _valid_base58(value: str, byte_length: int) -> bool:
    if not isinstance(value, str) or not (32 <= len(value) <= 90):
        return False
    if not _VALID.fullmatch(value):
        return False
    number = 0
    for char in value:
        number = number * 58 + _ALPHABET.index(char)
    zeros = len(value) - len(value.lstrip("1"))
    return len(b"\\x00" * zeros + (number.to_bytes((number.bit_length() + 7) // 8, "big") if number else b"")) == byte_length


def inspect_native_sol_receipt(
    *,
    signature: str,
    recipient: str,
    rpc_response: dict[str, Any],
    minimum_lamports: int = 1,
    network: str = "devnet",
) -> dict[str, Any]:
    """Require one finalized, successful, direct, signed SystemProgram transfer.

    A positive result is an observation only. It is *not* a PayBox balance,
    a proof of credential control, or an idempotent order entitlement.
    """
    def reject(reason: str) -> dict[str, Any]:
        return {"status": "rejected", "reason": reason, "settlement_recorded": False,
                "paybox_control_verified": False, "can_execute": False}

    if network not in _RPC:
        return reject("unsupported_network")
    if not _valid_base58(recipient, 32) or not _valid_base58(signature, 64):
        return reject("invalid_public_identifier")
    if type(minimum_lamports) is not int or minimum_lamports < 1:
        return reject("invalid_amount")
    if not isinstance(rpc_response, dict) or rpc_response.get("error"):
        return reject("rpc_error")
    item = rpc_response.get("result")
    if not isinstance(item, dict):
        return reject("not_finalized_or_missing")
    meta = item.get("meta")
    tx = item.get("transaction")
    if not isinstance(meta, dict) or not isinstance(tx, dict):
        return reject("invalid_transaction")
    if meta.get("err") is not None or meta.get("innerInstructions") not in (None, []):
        return reject("failed_or_complex_transaction")
    if not isinstance(item.get("slot"), int) or item["slot"] <= 0:
        return reject("invalid_slot")
    signatures = tx.get("signatures")
    msg = tx.get("message")
    if not isinstance(signatures, list) or not signatures or signatures[0] != signature:
        return reject("signature_mismatch")
    if not isinstance(msg, dict):
        return reject("invalid_message")
    keys = msg.get("accountKeys")
    instructions = msg.get("instructions")
    if not isinstance(keys, list) or not isinstance(instructions, list) or not keys:
        return reject("invalid_message")
    if not all(isinstance(k, dict) and isinstance(k.get("pubkey"), str) for k in keys):
        return reject("unsupported_keys")
    pubs = [k["pubkey"] for k in keys]
    if len(pubs) != len(set(pubs)) or recipient not in pubs:
        return reject("recipient_not_in_transaction")
    pre = meta.get("preBalances")
    post = meta.get("postBalances")
    if (not isinstance(pre, list) or not isinstance(post, list)
            or len(pre) != len(pubs) or len(post) != len(pubs)
            or any(type(n) is not int or n < 0 for n in pre + post)):
        return reject("invalid_balances")
    direct_transfers = []
    for inst in instructions:
        if not isinstance(inst, dict):
            return reject("unparsed_instruction")
        program_id = inst.get("programId")
        if program_id == _COMPUTE_BUDGET:
            continue
        if inst.get("program") != "system" or program_id != _SYSTEM_PROGRAM:
            return reject("unexpected_program")
        parsed = inst.get("parsed")
        if not isinstance(parsed, dict) or parsed.get("type") != "transfer":
            return reject("unexpected_system_instruction")
        info = parsed.get("info")
        if not isinstance(info, dict):
            return reject("invalid_transfer")
        direct_transfers.append(info)
    if len(direct_transfers) != 1:
        return reject("not_single_direct_transfer")
    tr = direct_transfers[0]
    sender, dest, amount = tr.get("source"), tr.get("destination"), tr.get("lamports")
    if (dest != recipient or sender == recipient or sender not in pubs
            or type(amount) is not int or amount < minimum_lamports):
        return reject("transfer_mismatch")
    source_signer = next((bool(k.get("signer")) for k in keys if k["pubkey"] == sender), False)
    if not source_signer:
        return reject("sender_not_signer")
    index = pubs.index(recipient)
    if post[index] - pre[index] != amount:
        return reject("balance_delta_mismatch")
    return {
        "status": "observed_finalized_native_sol",
        "network": network,
        "signature": signature,
        "slot": item["slot"],
        "recipient": recipient,
        "source": sender,
        "lamports": amount,
        "block_time": item.get("blockTime"),
        "settlement_recorded": False,
        "paybox_control_verified": False,
        "can_execute": False,
    }


def query_native_sol_receipt(
    *, signature: str, recipient: str, minimum_lamports: int = 1, network: str = "devnet",
) -> dict[str, Any]:
    """Read from a pinned official Solana RPC endpoint; no private wallet access."""
    if network not in _RPC:
        raise ValueError("unsupported_network")
    if not _valid_base58(signature, 64) or not _valid_base58(recipient, 32):
        raise ValueError("invalid_public_identifier")
    payload = json.dumps({
        "jsonrpc": "2.0", "id": 1, "method": "getTransaction",
        "params": [signature, {
            "commitment": "finalized", "encoding": "jsonParsed",
            "maxSupportedTransactionVersion": 0,
        }],
    }).encode()
    req = urllib.request.Request(_RPC[network], data=payload, method="POST",
        headers={"Content-Type": "application/json", "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=10) as response:
        raw = response.read(262145)
    if len(raw) > 262144:
        raise ValueError("oversized_rpc_response")
    return inspect_native_sol_receipt(
        signature=signature, recipient=recipient, rpc_response=json.loads(raw),
        minimum_lamports=minimum_lamports, network=network,
    )
