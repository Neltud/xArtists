"""
LIA Burnify decision agent.

Priority: DEFENSE → STAKE BFY → CLAIM EGLD after X batches → TRO BATCH → IDLE.
Claim is mandatory once batch threshold is hit (LIA treasury realization).
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Optional

from .config import BurnifyConfig, DEFAULT_CONFIG, BATCH_EGLD_HALF, TRO_DECIMALS, BFY_DECIMALS
from .state import BurnifyState, load_state, save_state
from .tx_builder import build_claim_rewards_egld, build_stake_bfy, build_tro_batch_intent


@dataclass
class WalletSnapshot:
    egld: float = 0.0
    bfy_free: float = 0.0
    bfy_staked_hint: float = 0.0
    tro: float = 0.0


@dataclass
class BurnifyDecision:
    action: str
    reason: str
    risk: str
    paper: bool
    intents: list[Any] = field(default_factory=list)
    state_preview: dict[str, Any] = field(default_factory=dict)
    reasoning: list[str] = field(default_factory=list)


class BurnifyAgent:
    def __init__(self, config: Optional[BurnifyConfig] = None):
        self.cfg = config or DEFAULT_CONFIG

    def is_live_allowed(self) -> bool:
        if not self.cfg.require_live_flag:
            return os.getenv("LIA_LIVE_TRADING", "0") == "1"
        return (
            os.getenv("LIA_LIVE_TRADING", "0") == "1"
            and os.getenv(self.cfg.env_live_key, "0") == "1"
        )

    def decide(self, wallet: WalletSnapshot, state: Optional[BurnifyState] = None) -> BurnifyDecision:
        st = state or load_state()
        reasoning: list[str] = []
        paper = not self.is_live_allowed()
        reasoning.append(
            f"mode={'LIVE' if not paper else 'PAPER'} (LIA_LIVE_TRADING + {self.cfg.env_live_key})"
        )
        reasoning.append(
            f"wallet EGLD={wallet.egld:.4f} TRO={wallet.tro:.2f} "
            f"BFY_free={wallet.bfy_free:.4f} batches_since_claim={st.batches_since_claim}"
        )

        if wallet.egld < self.cfg.egld_gas_reserve:
            return BurnifyDecision(
                action="blocked",
                reason=f"EGLD below gas reserve {self.cfg.egld_gas_reserve}",
                risk="high",
                paper=paper,
                reasoning=reasoning + ["DEFENSE: preserve gas"],
            )

        free_egld = wallet.egld - self.cfg.egld_gas_reserve

        if wallet.bfy_free >= self.cfg.min_bfy_staked:
            atomic = int(wallet.bfy_free * (10**BFY_DECIMALS))
            intent = build_stake_bfy(atomic, staking_sc=self.cfg.staking_sc)
            reasoning.append("STAKE: free BFY → deposit (earn 90% protocol EGLD share)")
            return BurnifyDecision(
                action="stake_bfy",
                reason=f"Stake ~{wallet.bfy_free:.4f} BFY",
                risk="low",
                paper=paper,
                intents=[intent.as_dict()],
                reasoning=reasoning,
            )

        claim_ready = st.batches_since_claim >= self.cfg.claim_after_batches
        time_ready = False
        if st.last_claim_at or st.last_batch_at:
            try:
                ref = st.last_claim_at or st.last_batch_at
                dt = datetime.strptime(ref, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
                hours = (datetime.now(timezone.utc) - dt).total_seconds() / 3600.0
                time_ready = hours >= self.cfg.claim_min_hours and st.batches_since_claim >= 1
            except Exception:
                time_ready = False

        if claim_ready or time_ready:
            intent = build_claim_rewards_egld(staking_sc=self.cfg.staking_sc)
            why = (
                f"CLAIM: batches_since_claim={st.batches_since_claim} >= {self.cfg.claim_after_batches}"
                if claim_ready
                else f"CLAIM: time gate {self.cfg.claim_min_hours}h"
            )
            reasoning.append(why)
            reasoning.append("Claim mandatory at threshold — EGLD to LIA ops; keep BFY staked")
            return BurnifyDecision(
                action="claim_egld",
                reason=why,
                risk="low",
                paper=paper,
                intents=[intent.as_dict()],
                reasoning=reasoning,
                state_preview={"batches_since_claim_will_reset": True},
            )

        if not self.cfg.tro_listed:
            return BurnifyDecision(
                action="idle",
                reason="TRO not listed on Burnify",
                risk="low",
                paper=paper,
                reasoning=reasoning + ["batch path disabled"],
            )

        if wallet.tro >= self.cfg.min_tro_for_batch and free_egld >= self.cfg.min_egld_for_batch:
            n = min(
                self.cfg.max_batches_per_cycle,
                max(1, int(free_egld // (BATCH_EGLD_HALF + 0.001))),
            )
            tro_atomic = int(self.cfg.min_tro_for_batch * (10**TRO_DECIMALS))
            egld_atomic = int(n * BATCH_EGLD_HALF * 1e18)
            intent = build_tro_batch_intent(
                n_batches=n, tro_atomic=tro_atomic, egld_atomic=egld_atomic, tro_token=self.cfg.tro_token
            )
            reasoning.append(f"BATCH: {n} TRO batch(es); after {self.cfg.claim_after_batches} → claim EGLD")
            return BurnifyDecision(
                action="tro_batch",
                reason=f"Submit {n} TRO batch(es)",
                risk="medium",
                paper=paper,
                intents=[intent],
                reasoning=reasoning,
                state_preview={
                    "batches_since_claim_after": st.batches_since_claim + n,
                    "claim_after": self.cfg.claim_after_batches,
                },
            )

        return BurnifyDecision(
            action="idle",
            reason="No actionable Burnify step",
            risk="low",
            paper=paper,
            reasoning=reasoning + ["wait capital / threshold"],
        )


def run_burnify_cycle(
    wallet: Optional[WalletSnapshot] = None,
    *,
    apply_paper_state: bool = True,
    config: Optional[BurnifyConfig] = None,
) -> dict[str, Any]:
    agent = BurnifyAgent(config)
    st = load_state()
    w = wallet or WalletSnapshot()
    decision = agent.decide(w, st)
    st.last_decision = decision.action
    st.last_reason = decision.reason
    st.mode = "paper" if decision.paper else "live"

    if apply_paper_state and decision.paper:
        if decision.action == "stake_bfy":
            st.record_stake(0, paper=True)
        elif decision.action == "claim_egld":
            st.record_claim(paper=True)
        elif decision.action == "tro_batch":
            n = 1
            if decision.intents and isinstance(decision.intents[0], dict):
                n = int(decision.intents[0].get("n_batches") or 1)
            for _ in range(n):
                st.record_batch(0, paper=True)

    path = save_state(st)
    return {
        "ok": True,
        "action": decision.action,
        "reason": decision.reason,
        "risk": decision.risk,
        "paper": decision.paper,
        "reasoning": decision.reasoning,
        "intents": decision.intents,
        "state_path": str(path),
        "batches_since_claim": st.batches_since_claim,
        "claim_after_batches": agent.cfg.claim_after_batches,
    }


if __name__ == "__main__":
    import json

    out = run_burnify_cycle(WalletSnapshot(egld=0.5, bfy_free=10.0, tro=100.0))
    print(json.dumps(out, indent=2))
