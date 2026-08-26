"""
Pre-trade signal gate: run fusion then optionally shrink/block size.
Advisory path for paper + live (live still needs Guardian/Intent).
Optionally attaches DecisionProof when size allowed.
"""
from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "data" / "lia_pretrade_gate.json"


def apply_gate(
    *,
    lia_decision: str = "WAIT",
    lia_confidence: float = 0.5,
    size_usd: float = 0.0,
    attach_proof: bool = False,
    asset_id: str = "USDC-c76f1f",
) -> dict[str, Any]:
    """
    Returns gated decision + size.
    - conflict / low conf → WAIT, size 0
    - external agree → mild size boost cap
    - rumor / poly extreme politics → no boost
    - attach_proof=True → DecisionProof paper when size > 0
    """
    try:
        from lia.signals.fusion import fuse

        fusion = fuse(lia_decision, lia_confidence)
    except Exception as e:
        fusion = {
            "error": str(e),
            "fused": {
                "decision": lia_decision,
                "confidence": lia_confidence,
                "source": "fusion_error_fallback",
            },
        }

    fused = fusion.get("fused") or {}
    decision = str(fused.get("decision") or lia_decision).upper()
    conf = float(fused.get("confidence") or lia_confidence)
    source = str(fused.get("source") or "unknown")

    if decision in ("HOLD", "SKIP"):
        decision = "WAIT"

    gated_size = float(size_usd)
    allow_size = decision in ("BUY", "SELL") and conf >= 0.45

    if not allow_size:
        gated_size = 0.0
        if conf < 0.45:
            decision = "WAIT"

    if source == "lia+external_agree" and gated_size > 0:
        gated_size = min(gated_size * 1.1, size_usd * 1.15 if size_usd > 0 else gated_size)

    if source in ("external_conflict_wait", "social_rumor_block", "conflict_wait"):
        decision = "WAIT"
        gated_size = 0.0

    proof_block: dict[str, Any] | None = None
    if attach_proof and gated_size > 0 and decision in ("BUY", "SELL"):
        try:
            from lia.intent.decision_proof import (
                ACTION_SWAP,
                generate_decision_proof,
                verify_decision_proof,
            )

            atomic = int(gated_size * 1_000_000)
            proof = generate_decision_proof(
                action_type=ACTION_SWAP,
                asset_id=asset_id,
                amount=max(atomic, 1),
                target_price=1_000_000,
                paper=True,
            )
            vr = verify_decision_proof(proof, mark_used=True, allow_live=False)
            proof_block = {"proof": proof.to_dict(), "verification": vr.value}
        except Exception as e:
            proof_block = {"error": str(e)}

    out = {
        "updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "input": {
            "lia_decision": lia_decision,
            "lia_confidence": lia_confidence,
            "size_usd": size_usd,
        },
        "gated": {
            "decision": decision,
            "confidence": round(conf, 4),
            "size_usd": round(gated_size, 4),
            "source": source,
            "allow_size": gated_size > 0,
        },
        "decision_proof": proof_block,
        "fusion_summary": {
            "external_norm": fused.get("external_norm"),
            "external_weight_sum": fused.get("external_weight_sum"),
            "legs": fusion.get("legs"),
        },
        "note": "Pretrade gate — does not replace Guardian/Intent for live",
        "live_trading": False,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, indent=2, default=str), encoding="utf-8")
    return out


def enrich_status(status: dict[str, Any] | None = None) -> dict[str, Any]:
    path = ROOT / "data" / "lia_v6_status.json"
    if status is None:
        if path.is_file():
            try:
                status = json.loads(path.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                status = {}
        else:
            status = {}
    gate = apply_gate(lia_decision="WAIT", lia_confidence=0.5, size_usd=0.0)
    orch = status.setdefault("orchestrator", {})
    orch["signals"] = {
        "fused": gate.get("gated"),
        "updated": gate.get("updated"),
        "gsn_elite": ((gate.get("fusion_summary") or {}).get("legs") or {}).get("gsn"),
        "note": "GSN>=80% + Polymarket + free feeds advisory",
    }
    status["updated"] = gate.get("updated")
    status["timestamp"] = status["updated"]
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(status, indent=2, default=str), encoding="utf-8")
    except OSError:
        pass
    return status


if __name__ == "__main__":
    print(
        json.dumps(
            apply_gate(lia_decision="BUY", lia_confidence=0.6, size_usd=25, attach_proof=True),
            indent=2,
        )[:2500]
    )
