"""
Soul Protocol routes for LIA — experimental / signals-first.

Soul (docs.soul.io) is a cross-chain liquidity layer on top of lending
markets (Aave, Morpho, Compound, …), not a simple single-chain money market.

In xArtists:
  - MultiversX remains base layer for execution when/if native routes exist
  - Soul stays EXPERIMENTAL: no user funds, paper intents only
  - Aligns with existing soul-zk-verifier isolation on the dApp

Actions mirrored conceptually: supply, collateral, borrow, repay, withdraw,
cross-chain lend (flagged high risk).
"""
from __future__ import annotations

import json
import time
from dataclasses import asdict, dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Optional

from lia.defi.yield_risk import YieldRiskConfig, assess_position_risk

_ROOT = Path(__file__).resolve().parents[2]


class SoulAction(str, Enum):
    SUPPLY = "soul_supply"
    ADD_COLLATERAL = "soul_add_collateral"
    BORROW = "soul_borrow"
    REPAY = "soul_repay"
    WITHDRAW = "soul_withdraw"
    CROSS_CHAIN_LEND = "soul_cross_chain_lend"
    SKIP = "skip"


@dataclass
class SoulPlan:
    action: str
    chain: str
    token: str
    amount_usd: float
    ok: bool
    reason: str
    experimental: bool = True
    risk: dict[str, Any] = field(default_factory=dict)
    steps: list[dict[str, Any]] = field(default_factory=list)
    paper: bool = True
    protocol: str = "soul"
    notes: str = ""

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


class SoulRouter:
    def __init__(self, cfg: Optional[YieldRiskConfig] = None):
        self.cfg = cfg or YieldRiskConfig()
        # Stricter than Hatom for experimental venue
        self.cfg.min_hf_open = max(self.cfg.min_hf_open, 2.0)
        self.cfg.max_leverage_loops = 0  # no leverage on Soul in v1

    def plan(
        self,
        action: SoulAction | str,
        *,
        token: str = "USDC",
        amount_usd: float = 0.0,
        chain: str = "multiversx",
        hatom_hf: float = 999.0,  # reuse HF proxy if position shared
        defense_active: bool = False,
        health_factor: float = 999.0,
    ) -> SoulPlan:
        act = SoulAction(action) if not isinstance(action, SoulAction) else action
        hf = min(hatom_hf, health_factor)

        if act == SoulAction.CROSS_CHAIN_LEND:
            return SoulPlan(
                act.value,
                chain,
                token,
                amount_usd,
                False,
                "cross-chain lend blocked in v1 (experimental + bridge risk)",
                experimental=True,
                notes="Enable only after dedicated bridge redesign + audit",
            )

        if defense_active:
            return SoulPlan(
                SoulAction.SKIP.value,
                chain,
                token,
                amount_usd,
                False,
                "defense_active",
                experimental=True,
            )

        kind = "lend" if act in (SoulAction.SUPPLY, SoulAction.ADD_COLLATERAL, SoulAction.WITHDRAW) else "borrow"
        risk = assess_position_risk(
            kind=kind,
            hatom_hf=hf,
            defense_active=defense_active,
            sleeve_usd=amount_usd,
            cfg=self.cfg,
        )
        if act == SoulAction.BORROW and not risk["ok"]:
            return SoulPlan(SoulAction.SKIP.value, chain, token, amount_usd, False, ";".join(risk["blockers"]), risk=risk)

        if amount_usd < 5 and act != SoulAction.SKIP:
            return SoulPlan(SoulAction.SKIP.value, chain, token, amount_usd, False, "amount too small")

        steps = [{"op": act.value, "token": token, "amount_usd": amount_usd, "chain": chain}]
        return SoulPlan(
            act.value,
            chain,
            token,
            amount_usd,
            True,
            "paper soul intent",
            risk=risk,
            steps=steps,
            paper=True,
            experimental=True,
            notes="Soul = cross-chain liquidity layer; no user funds until audited integration",
        )

    def auto_route(
        self,
        *,
        amount_usd: float,
        defense_active: bool = False,
        health_factor: float = 999.0,
    ) -> SoulPlan:
        if defense_active or amount_usd < 5:
            return self.plan(SoulAction.SKIP, amount_usd=amount_usd, defense_active=defense_active)
        # Default: supply only, never borrow on experimental path
        return self.plan(
            SoulAction.SUPPLY,
            amount_usd=amount_usd * 0.5,  # half of what Hatom might take
            health_factor=health_factor,
        )


if __name__ == "__main__":
    s = SoulRouter()
    print(json.dumps(s.auto_route(amount_usd=30).to_dict(), indent=2))
    print(json.dumps(s.plan(SoulAction.CROSS_CHAIN_LEND, amount_usd=10).to_dict(), indent=2))
