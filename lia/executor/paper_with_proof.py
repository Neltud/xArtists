"""
Paper leg: pretrade gate → optional EV filter → DecisionProof attachment.
Never signs chain txs. Live still needs go_live_gates + PEM elsewhere.
"""
from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "data" / "lia_paper_legs.json"


def execute_paper_leg(
    *,
    decision: str = "BUY",
    confidence: float = 0.6,
    size_usd: float = 25.0,
    asset_id: str = "USDC-c76f1f",
    require_ev: bool = True,
) -> dict[str, Any]:
    from lia.signals.pretrade_gate import apply_gate

    gate = apply_gate(
        lia_decision=decision,
        lia_confidence=confidence,
        size_usd=size_usd,
    )
    gated = gate.get("gated") or {}
    if not gated.get("allow_size"):
        return {
            "ok": False,
            "reason": "pretrade_blocked",
            "gate": gated,
            "paper": True,
        }

    if require_ev:
        try:
            from lia.brain.probabilistic import LIAProbabilisticEngine

            ev = LIAProbabilisticEngine(0.65, seed=None).simulate_trade_outcome(
                amount=float(gated.get("size_usd") or size_usd),
                price_diff=0.008,
                bridge_delay_range=(1.0, 6.0),
                volatility=0.012,
                iterations=400,
            )
            if not ev.is_viable:
                return {
                    "ok": False,
                    "reason": "ev_not_viable",
                    "ev": ev.to_dict(),
                    "gate": gated,
                    "paper": True,
                }
            ev_dict = ev.to_dict()
        except Exception as e:
            ev_dict = {"error": str(e)}
    else:
        ev_dict = None

    from lia.intent.decision_proof import ACTION_SWAP, generate_decision_proof, verify_decision_proof

    atomic = int(float(gated.get("size_usd") or size_usd) * 1_000_000)
    proof = generate_decision_proof(
        action_type=ACTION_SWAP,
        asset_id=asset_id,
        amount=max(atomic, 1),
        target_price=1_000_000,
        paper=True,
    )
    vr = verify_decision_proof(proof, mark_used=True, allow_live=False)

    leg = {
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "ok": True,
        "paper": True,
        "gate": gated,
        "ev": ev_dict,
        "decision_proof": proof.to_dict(),
        "verification": vr.value,
        "note": "Paper leg recorded — no chain signature",
    }

    # append log
    try:
        prev: list = []
        if OUT.is_file():
            raw = json.loads(OUT.read_text(encoding="utf-8"))
            prev = list(raw.get("legs") or [])
        prev.append(leg)
        OUT.write_text(
            json.dumps({"legs": prev[-100:], "updated": leg["ts"]}, indent=2, default=str),
            encoding="utf-8",
        )
    except OSError:
        pass
    return leg


if __name__ == "__main__":
    print(json.dumps(execute_paper_leg(), indent=2, default=str))
