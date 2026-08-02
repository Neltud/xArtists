"""
Halo2 proof envelope for Soul zk (off-chain)
============================================
Does not embed a full Halo2 prover (heavy Rust/WASM toolchain).
Provides:
  - scheme constants matching on-chain soul-zk-verifier
  - VK hash helper
  - proof envelope validation before attestor submits verifyProof

Phase 2: replace build_halo2_proof with real halo2 / pse / ezkl binding.
"""
from __future__ import annotations

import hashlib
import os
from typing import Any, Optional

SCHEME_HALO2 = 1
SCHEME_GROTH16 = 2
SCHEME_NAME = {1: "halo2", 2: "groth16"}


def vk_hash_from_bytes(vk_bytes: bytes) -> str:
    return hashlib.sha256(vk_bytes).hexdigest()


def vk_hash_from_hex(vk_hex: str) -> str:
    raw = bytes.fromhex(vk_hex.replace("0x", ""))
    return vk_hash_from_bytes(raw)


def validate_halo2_envelope(
    *,
    proof_hex: str,
    commitment_hex: str,
    nullifier_hex: str,
    min_proof_bytes: int = 32,
    max_proof_bytes: int = 8192,
) -> dict[str, Any]:
    try:
        proof = bytes.fromhex(proof_hex.replace("0x", ""))
        commitment = bytes.fromhex(commitment_hex.replace("0x", ""))
        nullifier = bytes.fromhex(nullifier_hex.replace("0x", ""))
    except ValueError as e:
        return {"ok": False, "error": f"hex decode: {e}"}

    if not (min_proof_bytes <= len(proof) <= max_proof_bytes):
        return {"ok": False, "error": f"proof length {len(proof)}"}
    if len(commitment) < 16:
        return {"ok": False, "error": "commitment too short"}
    if len(nullifier) < 8:
        return {"ok": False, "error": "nullifier too short"}

    return {
        "ok": True,
        "scheme": "halo2",
        "scheme_id": SCHEME_HALO2,
        "proof_len": len(proof),
        "commitment_hex": commitment.hex(),
        "nullifier_hex": nullifier.hex(),
    }


def build_halo2_proof_placeholder(
    *,
    public_commitment: str,
    seed: str = "",
) -> dict[str, Any]:
    """
    Deterministic placeholder proof bytes for integration tests only.
    NOT a real Halo2 proof — attestor must never submit this on mainnet.
    """
    material = f"halo2-placeholder|{public_commitment}|{seed}".encode()
    body = hashlib.sha512(material).digest() + hashlib.sha256(material).digest()
    return {
        "ok": True,
        "status": "placeholder",
        "scheme": "halo2",
        "scheme_id": SCHEME_HALO2,
        "proof_hex": body.hex(),
        "warning": "Not a real Halo2 proof — test/dev only",
    }


def prover_status() -> dict[str, Any]:
    return {
        "scheme": "halo2",
        "scheme_id": SCHEME_HALO2,
        "real_prover": False,
        "env_SOUL_ZK_HALO2_PROVER": os.environ.get("SOUL_ZK_HALO2_PROVER", ""),
        "note": "Wire ezkl/pse/halo2 binary when available; on-chain is Phase1 attestor gate",
    }
