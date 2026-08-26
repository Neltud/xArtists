"""
One paper brain cycle: EV → optional DecisionProof → meta/portfolio snapshot.
Does not execute live trades.
"""
from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any

from lia.brain.conquest import LIAConquestBrain
from lia.brain.meta_lia import MetaLIA
from lia.brain.portfolio import LIAPortfolioManager
from lia.brain.probabilistic import LIAProbabilisticEngine
from lia.intent.decision_proof import ACTION_SWAP, generate_decision_proof, verify_decision_proof

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "data" / "lia_brain_cycle.json"


def run_brain_cycle(
    *,
    amount: float = 1000.0,
    price_diff: float = 0.01,
    volatility: float = 0.01,
    seed: int = 42,
) -> dict[str, Any]:
    eng = LIAProbabilisticEngine(confidence_threshold=0.70, seed=seed)
    ev = eng.simulate_trade_outcome(
        amount=amount,
        price_diff=price_diff,
        bridge_delay_range=(2.0, 10.0),
        volatility=volatility,
        iterations=500,
    )
    meta = MetaLIA(seed=seed).orchestrate()
    port = LIAPortfolioManager()
    port.update_portfolio_state("USDC", amount * 0.6)
    port.update_portfolio_state("EGLD", amount * 0.4)
    rebal = port.plan_rebalance(0.5)

    conquest = LIAConquestBrain().evaluate_conquest_opportunity(
        amount, "MultiversX", "Ethereum", price_diff
    )

    proof_block: dict[str, Any] | None = None
    if ev.is_viable:
        # atomic amount sketch: USDC 6 decimals
        atomic = int(amount * 1_000_000)
        proof = generate_decision_proof(
            action_type=ACTION_SWAP,
            asset_id="USDC-c76f1f",
            amount=atomic,
            target_price=int((1 + price_diff) * 1_000_000),
            paper=True,
        )
        vr = verify_decision_proof(proof, mark_used=True, allow_live=False)
        proof_block = {"proof": proof.to_dict(), "verification": vr.value}

    out = {
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "module": "lia.brain.cycle",
        "paper": True,
        "ev": ev.to_dict(),
        "meta": meta,
        "portfolio": rebal,
        "conquest": conquest,
        "decision_proof": proof_block,
        "note": "No live execution — DecisionProof is paper commitment only",
    }
    try:
        OUT.parent.mkdir(parents=True, exist_ok=True)
        OUT.write_text(json.dumps(out, indent=2, default=str), encoding="utf-8")
    except OSError:
        pass
    return out


if __name__ == "__main__":
    print(json.dumps(run_brain_cycle(), indent=2))
