"""
Soul Protocol — zk proof interface (future)
===========================================
No prover/verifier live. Safe stubs for production builds.

Intended flow:
  1. Off-chain prover builds proof for credit / restake / eligibility
  2. Public inputs bound to MVX address + epoch
  3. Verifier SC (MVX) or Soul API accepts proof
  4. LIA gates size_usd or yield_sleeve unlock

Libraries (later): gnark / halo2 / risc0 / groth16 — TBD by Soul stack.
"""
from __future__ import annotations

import hashlib
from dataclasses import dataclass, field
from typing import Any, Optional

VERIFIER_ADDRESS: Optional[str] = None  # erd1... when deployed
PROVER_ENABLED = False


@dataclass
class ZkPublicInputs:
    subject: str  # bech32 or pubkey
    epoch: int
    claim_type: str  # credit | restake | eligibility
    amount_hash: str = ""
    extra: dict[str, Any] = field(default_factory=dict)

    def commitment(self) -> str:
        raw = f"{self.subject}|{self.epoch}|{self.claim_type}|{self.amount_hash}"
        return hashlib.sha256(raw.encode()).hexdigest()


@dataclass
class ZkProofBundle:
    proof_bytes_hex: str
    public_inputs: ZkPublicInputs
    scheme: str = "groth16"  # placeholder
    status: str = "planned"


def build_proof_request(
    *,
    subject: str,
    epoch: int,
    claim_type: str,
    amount: float = 0.0,
) -> dict[str, Any]:
    """Create a proof request envelope (no cryptography yet)."""
    amount_hash = hashlib.sha256(f"{amount:.8f}".encode()).hexdigest()[:32]
    inputs = ZkPublicInputs(
        subject=subject,
        epoch=epoch,
        claim_type=claim_type,
        amount_hash=amount_hash,
    )
    return {
        "ok": True,
        "status": "planned" if not PROVER_ENABLED else "ready",
        "commitment": inputs.commitment(),
        "public_inputs": {
            "subject": inputs.subject,
            "epoch": inputs.epoch,
            "claim_type": inputs.claim_type,
            "amount_hash": inputs.amount_hash,
        },
        "verifier": VERIFIER_ADDRESS,
        "note": "Submit to Soul prover when PROVER_ENABLED; verify on MVX verifier SC",
    }


def verify_proof_local(bundle: ZkProofBundle) -> dict[str, Any]:
    """
    Local stub verifier — always rejects unless PROVER_ENABLED and verifier set.
    Never accepts empty proofs.
    """
    if not PROVER_ENABLED or not VERIFIER_ADDRESS:
        return {
            "valid": False,
            "status": "verifier_unavailable",
            "commitment": bundle.public_inputs.commitment(),
        }
    if not bundle.proof_bytes_hex or len(bundle.proof_bytes_hex) < 64:
        return {"valid": False, "status": "invalid_proof_encoding"}
    # Real pairing check goes here later
    return {"valid": False, "status": "not_implemented"}


def gate_size_with_zk(
    *,
    base_size_usd: float,
    proof_valid: bool,
    max_boost: float = 1.5,
) -> float:
    """If zk credit valid, allow mild size boost; else keep base (or reduce)."""
    if not proof_valid:
        return base_size_usd
    return round(base_size_usd * max_boost, 2)


def status() -> dict[str, Any]:
    return {
        "prover_enabled": PROVER_ENABLED,
        "verifier_address": VERIFIER_ADDRESS,
        "schemes_planned": ["groth16", "plonk"],
        "claims": ["credit", "restake", "eligibility"],
        "integration": "lia.venues.soul + mvx_agent gate (future)",
    }
