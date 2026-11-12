"""xOrus owner PayBox.sh wallet reference — noncustodial, watch-only PREP.

No OAuth, PayBox network calls, SIWX bypass, signing, transfer, swap or bridge.
All wallet candidates, including historical addresses in the repo, remain
UNVERIFIED until a separate trusted provider/session proof is established.
"""
from __future__ import annotations

import re
from collections.abc import Mapping
from typing import Any

PROVIDER = "paybox.sh"
SOLANA_ADDRESS = re.compile(r"^[1-9A-HJ-NP-Za-km-z]{32,44}$")
EVM_ADDRESS = re.compile(r"^0x[0-9a-fA-F]{40}$")
MVX_ADDRESS = re.compile(r"^erd1[0-9a-z]{58}$")
WALLET_STATUS = "pending_owner_and_provider_proof"


def _public_address(address: Any, family: str) -> bool:
    if not isinstance(address, str) or address != address.strip():
        return False
    if family == "solana":
        return SOLANA_ADDRESS.fullmatch(address) is not None
    if family == "evm":
        return EVM_ADDRESS.fullmatch(address) is not None
    if family == "multiversx":
        # Basic shape only; a checksum+signature proof must be checked elsewhere.
        return MVX_ADDRESS.fullmatch(address) is not None
    return False


def inspect_paybox_wallet_source(config: Mapping[str, Any] | None) -> dict[str, Any]:
    """Sanitize public owner wallet references. Client flags NEVER approve a link.

    A candidate address is NOT proof of control or funds. MultiversX is not
    supported for direct PayBox.sh sends; it needs its own xPortal signer.
    """
    if not isinstance(config, Mapping):
        config = {}
    candidates = config.get("paybox_public_candidates")
    candidates = candidates if isinstance(candidates, list) else []
    accepted = []
    rejected = 0
    seen: set[tuple[str, str]] = set()
    for row in candidates[:20]:
        if not isinstance(row, Mapping):
            rejected += 1
            continue
        family = row.get("network_family")
        address = row.get("address")
        # Unknown chain id for EVM must stay unknown, not default to mainnet.
        if (family not in ("solana", "evm") or
            not _public_address(address, family)):
            rejected += 1
            continue
        if family == "solana":
            chain = "solana:mainnet" if row.get("chain") == "solana:mainnet" else None
        else:
            raw_chain = row.get("chain")
            chain = raw_chain if isinstance(raw_chain, str) and re.fullmatch(r"eip155:[1-9][0-9]*", raw_chain) else None
        key = (family, address.lower() if family == "evm" else address)
        if key in seen:
            rejected += 1
            continue
        seen.add(key)
        accepted.append({
            "network_family": family, "chain": chain, "address": address,
            "control_verified": False, "source": "unverified_public_reference",
            "can_sign": False, "can_send": False, "can_fund_xorus": False,
        })
    xorus = config.get("xorus_multiversx_wallet")
    xorus_address = (xorus.get("address") if isinstance(xorus, Mapping) else None)
    if not _public_address(xorus_address, "multiversx"):
        xorus_address = None
    return {
        "agent": "xorus",
        "provider": PROVIDER,
        "mode": "watch_only",
        "status": WALLET_STATUS,
        "paybox_wallet_candidates": accepted,
        "rejected_candidates": rejected + max(0, len(candidates) - 20),
        "xorus_multiversx_wallet": {
            "network": "multiversx:1", "address": xorus_address,
            "ownership_verified": False,
            "can_receive_direct_paybox": False,
        },
        "credentials_connected": False,
        "provider_control_verified": False,
        "user_transfer_approval": False,
        "auto_funding_enabled": False,
        "trade_enabled": False,
        "transfer_authorized": False,
        "bridge_authorized": False,
        "funded_confirmed": False,
        "required_next_gate": "revalidate_paybox_session_address_and_chain_off_repo",
    }


def inspect_funding_preflight(
    config: Mapping[str, Any] | None,
    *,
    source_chain: Any,
    target_chain: Any,
    amount_atomic: Any = None,
) -> dict[str, Any]:
    """No wallet side effects. Never return a sendable transaction or quote."""
    source = inspect_paybox_wallet_source(config)
    chain_match = (isinstance(source_chain, str) and isinstance(target_chain, str)
                   and source_chain == target_chain)
    amount_format_valid = (
        isinstance(amount_atomic, str) and
        re.fullmatch(r"[1-9][0-9]*", amount_atomic) is not None
    )
    known_source = any(row["chain"] == source_chain and row["chain"]
                       for row in source["paybox_wallet_candidates"])
    return {
        "status": "BLOCKED",
        "reason": (
            "cross_chain_requires_separately_reviewed_bridge"
            if not chain_match else
            "source_wallet_unverified"
            if known_source else "source_chain_not_verified"
        ),
        "source_chain_compatible": bool(chain_match),
        "source_reference_known": bool(known_source),
        "amount_format_valid": bool(amount_format_valid),
        "source_owner_proof_verified": False,
        "target_owner_proof_verified": False,
        "provider_session_verified": False,
        "balance_verified": False,
        "user_approved": False,
        "tx_payload": None,
        "signing_request": None,
        "broadcast": False,
        "transfer_authorized": False,
        "funded_confirmed": False,
    }
