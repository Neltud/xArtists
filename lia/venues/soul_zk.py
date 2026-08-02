"""
Soul Protocol — zk proof circuit (configured, disabled by default)
=================================================================
Loads config/soul_zk_circuit.json. Env overrides:
  SOUL_ZK_PROVER_ENABLED=1
  SOUL_ZK_VERIFIER_ADDRESS=erd1...

Circuits: credit | restake | eligibility
Settlement binding: MultiversX subject (bech32) + epoch.
"""
from __future__ import annotations

import hashlib
import json
import os
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Optional

ROOT = Path(__file__).resolve().parents[2]
CONFIG_PATH = ROOT / "config" / "soul_zk_circuit.json"

# Runtime flags (overridden by load_config + env)
PROVER_ENABLED = False
VERIFIER_ADDRESS: Optional[str] = None
_CIRCUIT_CFG: dict[str, Any] = {}
_NULLIFIERS: set[str] = set()


def _load_nullifiers(path: Path) -> set[str]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return set(data.get("nullifiers") or [])
    except (FileNotFoundError, json.JSONDecodeError):
        return set()


def load_config(path: Optional[Path] = None) -> dict[str, Any]:
    global PROVER_ENABLED, VERIFIER_ADDRESS, _CIRCUIT_CFG, _NULLIFIERS
    cfg_path = path or CONFIG_PATH
    try:
        _CIRCUIT_CFG = json.loads(cfg_path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        _CIRCUIT_CFG = {"version": "0", "status": "missing_config"}

    env_prov = os.environ.get("SOUL_ZK_PROVER_ENABLED", "").strip() in ("1", "true", "TRUE")
    file_prov = bool((_CIRCUIT_CFG.get("prover") or {}).get("enabled"))
    PROVER_ENABLED = env_prov or file_prov

    env_ver = os.environ.get("SOUL_ZK_VERIFIER_ADDRESS", "").strip() or None
    file_ver = (_CIRCUIT_CFG.get("verifier") or {}).get("address") or None
    VERIFIER_ADDRESS = env_ver or file_ver

    nf_path = ROOT / (_CIRCUIT_CFG.get("nullifier_store") or "data/soul_zk_nullifiers.json")
    _NULLIFIERS = _load_nullifiers(nf_path)
    return _CIRCUIT_CFG


# load at import
load_config()


def current_epoch() -> int:
    length = int(((_CIRCUIT_CFG.get("epoch") or {}).get("length_sec")) or 86400)
    return int(time.time()) // length


def _sha(s: str) -> str:
    return hashlib.sha256(s.encode()).hexdigest()


def _nullifier(subject: str, epoch: int, claim_type: str, salt: str = "") -> str:
    return _sha(f"nf|{subject}|{epoch}|{claim_type}|{salt}")[:48]


@dataclass
class ZkPublicInputs:
    subject: str
    epoch: int
    claim_type: str
    amount_hash: str = ""
    nullifier: str = ""
    circuit_id: str = ""
    threshold_bps: int = 0
    extra: dict[str, Any] = field(default_factory=dict)

    def commitment(self) -> str:
        raw = (
            f"{self.circuit_id}|{self.subject}|{self.epoch}|{self.claim_type}|"
            f"{self.amount_hash}|{self.nullifier}|{self.threshold_bps}"
        )
        return _sha(raw)


@dataclass
class ZkProofBundle:
    proof_bytes_hex: str
    public_inputs: ZkPublicInputs
    scheme: str = "groth16"
    status: str = "planned"


def circuit_spec(claim_type: str) -> dict[str, Any]:
    circuits = _CIRCUIT_CFG.get("circuits") or {}
    if claim_type not in circuits:
        return {"ok": False, "error": f"unknown claim_type={claim_type}"}
    return {"ok": True, **circuits[claim_type]}


def build_proof_request(
    *,
    subject: str,
    claim_type: str,
    amount: float = 0.0,
    epoch: Optional[int] = None,
    salt: str = "",
    threshold_bps: Optional[int] = None,
) -> dict[str, Any]:
    """Envelope for off-chain prover. No crypto until PROVER_ENABLED."""
    load_config()
    spec = circuit_spec(claim_type)
    if not spec.get("ok"):
        return {"ok": False, "error": spec.get("error"), "status": "invalid_claim"}

    ep = epoch if epoch is not None else current_epoch()
    amount_hash = _sha(f"{amount:.8f}")[:32]
    nf = _nullifier(subject, ep, claim_type, salt)
    thr = threshold_bps
    if thr is None:
        thr = int(spec.get("threshold_bps_default") or 0)

    inputs = ZkPublicInputs(
        subject=subject,
        epoch=ep,
        claim_type=claim_type,
        amount_hash=amount_hash,
        nullifier=nf,
        circuit_id=str(spec.get("id") or ""),
        threshold_bps=thr,
    )

    scheme = ((_CIRCUIT_CFG.get("scheme") or {}).get("primary")) or "groth16"
    return {
        "ok": True,
        "status": "ready" if PROVER_ENABLED else "configured_disabled",
        "scheme": scheme,
        "circuit": {"id": spec.get("id"), "public": spec.get("public"), "private": spec.get("private")},
        "commitment": inputs.commitment(),
        "public_inputs": {
            "subject": inputs.subject,
            "epoch": inputs.epoch,
            "claim_type": inputs.claim_type,
            "amount_hash": inputs.amount_hash,
            "nullifier": inputs.nullifier,
            "circuit_id": inputs.circuit_id,
            "threshold_bps": inputs.threshold_bps,
        },
        "prover": {
            "enabled": PROVER_ENABLED,
            "endpoint": (_CIRCUIT_CFG.get("prover") or {}).get("endpoint") or "",
        },
        "verifier": {
            "address": VERIFIER_ADDRESS,
            "chain_id": (_CIRCUIT_CFG.get("verifier") or {}).get("chain_id") or "1",
        },
        "note": "Off-chain prove → submit proof_bytes_hex to verify_pipeline",
    }


def verify_proof_local(bundle: ZkProofBundle) -> dict[str, Any]:
    load_config()
    commitment = bundle.public_inputs.commitment()

    if not PROVER_ENABLED or not VERIFIER_ADDRESS:
        return {
            "valid": False,
            "status": "verifier_unavailable",
            "commitment": commitment,
        }

    expected = int(((_CIRCUIT_CFG.get("scheme") or {}).get("proof_size_bytes_expected")) or 128)
    raw = bundle.proof_bytes_hex or ""
    if len(raw) < expected:
        return {"valid": False, "status": "invalid_proof_encoding", "commitment": commitment}

    nf = bundle.public_inputs.nullifier
    if nf and nf in _NULLIFIERS and (_CIRCUIT_CFG.get("gates") or {}).get("reject_if_nullifier_seen", True):
        return {"valid": False, "status": "nullifier_replay", "commitment": commitment}

    # Pairing / SC view call — not implemented until verifier live
    return {
        "valid": False,
        "status": "not_implemented",
        "commitment": commitment,
        "verifier": VERIFIER_ADDRESS,
        "hint": "Wire mxpy query verifyProof when SC deployed",
    }


def verify_pipeline(
    *,
    proof_bytes_hex: str,
    subject: str,
    claim_type: str,
    amount: float = 0.0,
    epoch: Optional[int] = None,
    salt: str = "",
) -> dict[str, Any]:
    """Full path: rebuild public inputs → local verify → optional nullifier mark."""
    req = build_proof_request(
        subject=subject,
        claim_type=claim_type,
        amount=amount,
        epoch=epoch,
        salt=salt,
    )
    if not req.get("ok"):
        return req

    pi = req["public_inputs"]
    inputs = ZkPublicInputs(
        subject=pi["subject"],
        epoch=int(pi["epoch"]),
        claim_type=pi["claim_type"],
        amount_hash=pi["amount_hash"],
        nullifier=pi["nullifier"],
        circuit_id=pi.get("circuit_id") or "",
        threshold_bps=int(pi.get("threshold_bps") or 0),
    )
    scheme = req.get("scheme") or "groth16"
    bundle = ZkProofBundle(
        proof_bytes_hex=proof_bytes_hex,
        public_inputs=inputs,
        scheme=scheme,
        status="submitted",
    )
    result = verify_proof_local(bundle)
    result["request"] = {
        "commitment": req["commitment"],
        "circuit_id": pi.get("circuit_id"),
        "claim_type": claim_type,
    }
    return result


def record_nullifier(nullifier: str) -> None:
    """Persist nullifier after successful on-chain verify (call from executor)."""
    global _NULLIFIERS
    if not nullifier:
        return
    _NULLIFIERS.add(nullifier)
    path = ROOT / (_CIRCUIT_CFG.get("nullifier_store") or "data/soul_zk_nullifiers.json")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(
            {
                "updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "nullifiers": sorted(_NULLIFIERS),
            },
            indent=2,
        ),
        encoding="utf-8",
    )


def gate_size_with_zk(
    *,
    base_size_usd: float,
    proof_valid: bool,
    max_boost: Optional[float] = None,
) -> float:
    gates = _CIRCUIT_CFG.get("gates") or {}
    boost = float(max_boost if max_boost is not None else gates.get("size_boost_max") or 1.5)
    if not proof_valid:
        return base_size_usd
    return round(base_size_usd * boost, 2)


def status() -> dict[str, Any]:
    load_config()
    return {
        "config_version": _CIRCUIT_CFG.get("version"),
        "status": _CIRCUIT_CFG.get("status"),
        "prover_enabled": PROVER_ENABLED,
        "verifier_address": VERIFIER_ADDRESS,
        "scheme": _CIRCUIT_CFG.get("scheme"),
        "circuits": list((_CIRCUIT_CFG.get("circuits") or {}).keys()),
        "epoch": current_epoch(),
        "nullifier_count": len(_NULLIFIERS),
        "settlement_chain": _CIRCUIT_CFG.get("settlement_chain"),
        "env": {
            "SOUL_ZK_PROVER_ENABLED": os.environ.get("SOUL_ZK_PROVER_ENABLED"),
            "SOUL_ZK_VERIFIER_ADDRESS_set": bool(os.environ.get("SOUL_ZK_VERIFIER_ADDRESS")),
        },
    }


if __name__ == "__main__":
    print(json.dumps(status(), indent=2))
    demo = build_proof_request(
        subject="erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6",
        claim_type="credit",
        amount=0.0,
    )
    print(json.dumps(demo, indent=2))
    print(
        json.dumps(
            verify_pipeline(
                proof_bytes_hex="00" * 32,
                subject=demo["public_inputs"]["subject"],
                claim_type="credit",
            ),
            indent=2,
        )
    )
