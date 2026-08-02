"""
Halo2 / Groth16 proof envelope — scheme-aware bounds
====================================================
Aligned with contracts/soul-zk-verifier proof_bounds().
"""
from __future__ import annotations

import hashlib
import os
from typing import Any

SCHEME_HALO2 = 1
SCHEME_GROTH16 = 2
SCHEME_NAME = {1: "halo2", 2: "groth16"}

# Must match SC constants
BOUNDS = {
    SCHEME_HALO2: {"proof_min": 64, "proof_max": 4096},
    SCHEME_GROTH16: {"proof_min": 128, "proof_max": 512},
}
COMMITMENT_LEN = 32
NULLIFIER_MIN = 16
NULLIFIER_MAX = 32
PROOF_HARD_MAX = 4096


def vk_hash_from_bytes(vk_bytes: bytes) -> str:
    return hashlib.sha256(vk_bytes).hexdigest()


def vk_hash_from_hex(vk_hex: str) -> str:
    return vk_hash_from_bytes(bytes.fromhex(vk_hex.replace("0x", "")))


def validate_envelope(
    *,
    proof_hex: str,
    commitment_hex: str,
    nullifier_hex: str,
    scheme_id: int = SCHEME_HALO2,
) -> dict[str, Any]:
    bounds = BOUNDS.get(scheme_id) or BOUNDS[SCHEME_HALO2]
    try:
        proof = bytes.fromhex(proof_hex.replace("0x", ""))
        commitment = bytes.fromhex(commitment_hex.replace("0x", ""))
        nullifier = bytes.fromhex(nullifier_hex.replace("0x", ""))
    except ValueError as e:
        return {"ok": False, "error": f"hex decode: {e}"}

    plen = len(proof)
    if plen > PROOF_HARD_MAX:
        return {"ok": False, "error": f"proof hard max {PROOF_HARD_MAX}, got {plen}"}
    if plen < bounds["proof_min"] or plen > bounds["proof_max"]:
        return {
            "ok": False,
            "error": f"proof length {plen} outside [{bounds['proof_min']},{bounds['proof_max']}] for scheme {scheme_id}",
            "bounds": bounds,
        }
    if len(commitment) != COMMITMENT_LEN:
        return {"ok": False, "error": f"commitment must be {COMMITMENT_LEN} bytes, got {len(commitment)}"}
    if not (NULLIFIER_MIN <= len(nullifier) <= NULLIFIER_MAX):
        return {
            "ok": False,
            "error": f"nullifier length {len(nullifier)} outside [{NULLIFIER_MIN},{NULLIFIER_MAX}]",
        }

    return {
        "ok": True,
        "scheme": SCHEME_NAME.get(scheme_id, "unknown"),
        "scheme_id": scheme_id,
        "proof_len": plen,
        "bounds": bounds,
        "commitment_hex": commitment.hex(),
        "nullifier_hex": nullifier.hex(),
    }


def validate_halo2_envelope(
    *,
    proof_hex: str,
    commitment_hex: str,
    nullifier_hex: str,
    min_proof_bytes: int = 64,
    max_proof_bytes: int = 4096,
) -> dict[str, Any]:
    """Backward-compatible alias; prefers scheme-aware validate_envelope."""
    _ = (min_proof_bytes, max_proof_bytes)
    return validate_envelope(
        proof_hex=proof_hex,
        commitment_hex=commitment_hex,
        nullifier_hex=nullifier_hex,
        scheme_id=SCHEME_HALO2,
    )


def build_halo2_proof_placeholder(
    *,
    public_commitment: str,
    seed: str = "",
) -> dict[str, Any]:
    """Test-only placeholder sized within Halo2 bounds (96 bytes)."""
    material = f"halo2-placeholder|{public_commitment}|{seed}".encode()
    body = hashlib.sha512(material).digest() + hashlib.sha256(material).digest()  # 96B
    assert 64 <= len(body) <= 4096
    return {
        "ok": True,
        "status": "placeholder",
        "scheme": "halo2",
        "scheme_id": SCHEME_HALO2,
        "proof_hex": body.hex(),
        "proof_len": len(body),
        "warning": "Not a real Halo2 proof — test/dev only",
    }


def prover_status() -> dict[str, Any]:
    return {
        "scheme": "halo2",
        "scheme_id": SCHEME_HALO2,
        "bounds": BOUNDS,
        "commitment_len": COMMITMENT_LEN,
        "nullifier": [NULLIFIER_MIN, NULLIFIER_MAX],
        "real_prover": False,
        "env_SOUL_ZK_HALO2_PROVER": os.environ.get("SOUL_ZK_HALO2_PROVER", ""),
    }
