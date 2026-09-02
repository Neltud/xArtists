"""
DecisionProof — LIA → Vellum intent receipt (paper-first).

Honest mode:
  - zk_proof field is a commitment hash (NOT a real ZK-SNARK verifier).
  - agent_signature is HMAC-style digest when LIA_AGENT_HMAC_SECRET is set;
    otherwise a non-secret paper mark.
  - Live path still requires Guardian + go_live_gates + PEM (not this module alone).

Rust mirror: contracts/decision-proof/types_reference.rs
"""
from __future__ import annotations

import hashlib
import hmac
import json
import os
import time
from dataclasses import asdict, dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Optional

ROOT = Path(__file__).resolve().parents[2]
USED_PATH = ROOT / "data" / "decision_proofs_used.json"
OUT_PATH = ROOT / "data" / "lia_last_decision_proof.json"

# action_type codes (align with SC sketch)
ACTION_SWAP = 0
ACTION_STAKE = 1
ACTION_CLAIM = 2
ACTION_REBALANCE = 3
ACTION_BRIDGE = 4


class VerificationResult(str, Enum):
    VALID = "Valid"
    INVALID_PROOF = "InvalidProof"
    UNAUTHORIZED_AGENT = "UnauthorizedAgent"
    EXPIRED_DECISION = "ExpiredDecision"
    REPLAY = "Replay"
    PAPER_ONLY = "PaperOnly"  # structural OK, not live-authorized


@dataclass
class DecisionProof:
    decision_id: str
    action_type: int
    asset_id: str
    amount: int  # atomic units
    target_price: int
    zk_proof: str
    agent_signature: str
    agent_id: str = "LIA_CORE_01"
    created_ts: float = field(default_factory=time.time)
    ttl_seconds: int = 120
    paper: bool = True

    def to_dict(self) -> dict[str, Any]:
        d = asdict(self)
        d["action_name"] = {
            0: "SWAP",
            1: "STAKE",
            2: "CLAIM",
            3: "REBALANCE",
            4: "BRIDGE",
        }.get(self.action_type, "UNKNOWN")
        return d


def _load_used() -> set[str]:
    if not USED_PATH.is_file():
        return set()
    try:
        raw = json.loads(USED_PATH.read_text(encoding="utf-8"))
        return set(raw.get("ids") or [])
    except Exception:
        return set()


def _save_used(ids: set[str]) -> None:
    USED_PATH.parent.mkdir(parents=True, exist_ok=True)
    # keep last 5000
    trimmed = sorted(ids)[-5000:]
    USED_PATH.write_text(
        json.dumps({"ids": trimmed, "n": len(trimmed)}, indent=2),
        encoding="utf-8",
    )


def _commitment(action_type: int, amount: int, target_price: int, asset_id: str) -> str:
    """Simulated 'proof' — cryptographic commitment, not ZK."""
    msg = f"commit|{action_type}|{amount}|{target_price}|{asset_id}".encode()
    return hashlib.sha256(msg).hexdigest()


def _sign(agent_id: str, decision_id: str) -> str:
    secret = os.environ.get("LIA_AGENT_HMAC_SECRET", "")
    body = f"{agent_id}|{decision_id}".encode()
    if secret:
        return hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    # paper mark — not authenticating live
    return hashlib.sha256(b"paper|" + body).hexdigest()


def generate_decision_proof(
    *,
    action_type: int,
    asset_id: str,
    amount: int,
    target_price: int,
    agent_id: str = "LIA_CORE_01",
    ttl_seconds: int = 120,
    paper: bool = True,
    nonce: Optional[int] = None,
) -> DecisionProof:
    n = nonce if nonce is not None else int(time.time() * 1000)
    decision_id = hashlib.sha256(
        f"{agent_id}-{n}-{time.time()}".encode()
    ).hexdigest()
    zk = _commitment(action_type, amount, target_price, asset_id)
    sig = _sign(agent_id, decision_id)
    proof = DecisionProof(
        decision_id=decision_id,
        action_type=int(action_type),
        asset_id=str(asset_id),
        amount=int(amount),
        target_price=int(target_price),
        zk_proof=zk,
        agent_signature=sig,
        agent_id=agent_id,
        ttl_seconds=ttl_seconds,
        paper=paper,
    )
    try:
        OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
        OUT_PATH.write_text(json.dumps(proof.to_dict(), indent=2), encoding="utf-8")
    except OSError:
        pass
    return proof


def verify_decision_proof(
    proof: DecisionProof | dict[str, Any],
    *,
    mark_used: bool = True,
    allow_live: bool = False,
) -> VerificationResult:
    if isinstance(proof, dict):
        proof = DecisionProof(
            decision_id=str(proof["decision_id"]),
            action_type=int(proof["action_type"]),
            asset_id=str(proof["asset_id"]),
            amount=int(proof["amount"]),
            target_price=int(proof["target_price"]),
            zk_proof=str(proof["zk_proof"]),
            agent_signature=str(proof["agent_signature"]),
            agent_id=str(proof.get("agent_id") or "LIA_CORE_01"),
            created_ts=float(proof.get("created_ts") or time.time()),
            ttl_seconds=int(proof.get("ttl_seconds") or 120),
            paper=bool(proof.get("paper", True)),
        )

    used = _load_used()
    if proof.decision_id in used:
        return VerificationResult.REPLAY

    if time.time() - proof.created_ts > proof.ttl_seconds:
        return VerificationResult.EXPIRED_DECISION

    expected_commit = _commitment(
        proof.action_type, proof.amount, proof.target_price, proof.asset_id
    )
    if proof.zk_proof != expected_commit:
        return VerificationResult.INVALID_PROOF

    expected_sig = _sign(proof.agent_id, proof.decision_id)
    if not hmac.compare_digest(proof.agent_signature, expected_sig):
        return VerificationResult.UNAUTHORIZED_AGENT

    if mark_used:
        used.add(proof.decision_id)
        _save_used(used)

    if proof.paper or not allow_live:
        return VerificationResult.PAPER_ONLY
    return VerificationResult.VALID


def run_demo() -> dict[str, Any]:
    p = generate_decision_proof(
        action_type=ACTION_SWAP,
        asset_id="WEGLD-bd4d79",
        amount=10**17,
        target_price=25 * 10**5,
        paper=True,
    )
    r = verify_decision_proof(p, mark_used=True, allow_live=False)
    return {"proof": p.to_dict(), "result": r.value}


if __name__ == "__main__":
    print(json.dumps(run_demo(), indent=2))
