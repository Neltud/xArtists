"""
Hatom protocol routes for LIA (MultiversX lending).

Actions (paper by default):
  stake_htm      — stake HTM governance/utility token if held
  claim_rewards  — claim lending/staking rewards
  supply_lend    — supply asset as lend (earn interest)
  add_collateral — enable/use as collateral
  borrow         — borrow against collateral (HF gated)
  leverage_loop  — limited supply→borrow→supply cycles
  repay          — reduce debt
  withdraw       — withdraw supply (HF gated)

Live execution requires LIA_LIVE_TRADING=1 + micro proof + explicit ABI/SC addresses
in data/contracts.json. This module only builds intent plans.
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


class HatomAction(str, Enum):
    STAKE_HTM = "stake_htm"
    CLAIM_REWARDS = "claim_rewards"
    SUPPLY = "supply_lend"
    ADD_COLLATERAL = "add_collateral"
    BORROW = "borrow"
    LEVERAGE_LOOP = "leverage_loop"
    REPAY = "repay"
    WITHDRAW = "withdraw"
    SKIP = "skip"


@dataclass
class HatomPlan:
    action: str
    token: str
    amount_usd: float
    amount_token: float
    ok: bool
    reason: str
    risk: dict[str, Any] = field(default_factory=dict)
    steps: list[dict[str, Any]] = field(default_factory=list)
    paper: bool = True
    protocol: str = "hatom"
    notes: str = ""

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


class HatomRouter:
    """
    Builds ordered step plans. SC addresses / endpoints filled when known
    in contracts.json under key 'hatom' (optional).
    """

    def __init__(self, contracts: Optional[dict[str, Any]] = None, cfg: Optional[YieldRiskConfig] = None):
        self.cfg = cfg or YieldRiskConfig()
        self.contracts = contracts or self._load_contracts()

    def _load_contracts(self) -> dict[str, Any]:
        path = _ROOT / "data" / "contracts.json"
        try:
            raw = json.loads(path.read_text(encoding="utf-8"))
            return raw.get("hatom") or raw.get("protocols", {}).get("hatom") or {}
        except Exception:
            return {}

    def plan(
        self,
        action: HatomAction | str,
        *,
        token: str = "WEGLD",
        amount_usd: float = 0.0,
        amount_token: float = 0.0,
        hatom_hf: float = 999.0,
        defense_active: bool = False,
        ltv_max: float = 0.75,
        loops: int = 1,
        htm_balance: float = 0.0,
    ) -> HatomPlan:
        act = HatomAction(action) if not isinstance(action, HatomAction) else action

        if act == HatomAction.STAKE_HTM:
            if htm_balance <= 0 and amount_token <= 0:
                return HatomPlan(act.value, "HTM", 0, 0, False, "no HTM balance", paper=True)
            return HatomPlan(
                act.value,
                "HTM",
                amount_usd,
                amount_token or htm_balance,
                True,
                "stake HTM (paper intent)",
                steps=[{"op": "stake_htm", "token": "HTM", "amount": amount_token or htm_balance}],
                notes="Requires Hatom staking SC address in contracts.json",
            )

        if act == HatomAction.CLAIM_REWARDS:
            return HatomPlan(
                act.value,
                token,
                0,
                0,
                True,
                "claim rewards intent",
                steps=[{"op": "claim_rewards", "markets": "all_user"}],
                notes="Gas-only; claim before redeploy",
            )

        kind = {
            HatomAction.SUPPLY: "lend",
            HatomAction.ADD_COLLATERAL: "lend",
            HatomAction.BORROW: "borrow",
            HatomAction.LEVERAGE_LOOP: "leverage_loop",
            HatomAction.REPAY: "borrow",
            HatomAction.WITHDRAW: "lend",
        }.get(act, "lend")

        risk = assess_position_risk(
            kind=kind,
            hatom_hf=hatom_hf,
            defense_active=defense_active,
            sleeve_usd=amount_usd,
            ltv_max=ltv_max,
            loops=loops if act == HatomAction.LEVERAGE_LOOP else 0,
            cfg=self.cfg,
        )

        if not risk["ok"]:
            return HatomPlan(
                HatomAction.SKIP.value,
                token,
                amount_usd,
                amount_token,
                False,
                ";".join(risk["blockers"]),
                risk=risk,
            )

        steps: list[dict[str, Any]] = []
        if act == HatomAction.SUPPLY:
            steps = [{"op": "supply", "token": token, "amount_usd": amount_usd}]
        elif act == HatomAction.ADD_COLLATERAL:
            steps = [
                {"op": "supply", "token": token, "amount_usd": amount_usd},
                {"op": "enter_market", "token": token},
            ]
        elif act == HatomAction.BORROW:
            max_borrow = amount_usd * min(ltv_max, self.cfg.max_ltv_used_pct)
            steps = [{"op": "borrow", "token": token, "amount_usd": max_borrow}]
            amount_usd = max_borrow
        elif act == HatomAction.LEVERAGE_LOOP:
            loop = risk["loop"]
            steps = []
            remaining = amount_usd
            for i in range(int(loop["loops"])):
                steps.append({"op": "supply", "token": token, "amount_usd": remaining, "loop": i})
                steps.append({"op": "enter_market", "token": token, "loop": i})
                borrow_amt = remaining * min(ltv_max, self.cfg.max_ltv_used_pct)
                steps.append({"op": "borrow", "token": token, "amount_usd": borrow_amt, "loop": i})
                remaining = borrow_amt
            amount_usd = loop["gross_exposure_usd"]
        elif act == HatomAction.REPAY:
            steps = [{"op": "repay", "token": token, "amount_usd": amount_usd}]
        elif act == HatomAction.WITHDRAW:
            steps = [{"op": "withdraw", "token": token, "amount_usd": amount_usd}]
        else:
            return HatomPlan(HatomAction.SKIP.value, token, 0, 0, False, "unknown action")

        return HatomPlan(
            act.value,
            token,
            amount_usd,
            amount_token,
            True,
            "paper plan ok",
            risk=risk,
            steps=steps,
            paper=True,
            notes="Broadcast only after SC ABI + LIA_LIVE_TRADING micro proof",
        )

    def auto_route(
        self,
        *,
        yield_sleeve_usd: float,
        hatom_hf: float = 999.0,
        defense_active: bool = False,
        prefer_loop: bool = False,
        token: str = "WEGLD",
    ) -> HatomPlan:
        """Choose safe default: claim if any, else supply, never loop under defense."""
        if defense_active:
            return self.plan(
                HatomAction.SKIP,
                token=token,
                amount_usd=yield_sleeve_usd,
                hatom_hf=hatom_hf,
                defense_active=True,
            )
        if yield_sleeve_usd < 5:
            return HatomPlan(HatomAction.SKIP.value, token, yield_sleeve_usd, 0, False, "sleeve too small")
        if prefer_loop and hatom_hf >= self.cfg.min_hf_leverage_loop:
            return self.plan(
                HatomAction.LEVERAGE_LOOP,
                token=token,
                amount_usd=yield_sleeve_usd,
                hatom_hf=hatom_hf,
                loops=1,
            )
        return self.plan(
            HatomAction.SUPPLY,
            token=token,
            amount_usd=yield_sleeve_usd * 0.8,
            hatom_hf=hatom_hf,
        )


if __name__ == "__main__":
    r = HatomRouter()
    print(json.dumps(r.auto_route(yield_sleeve_usd=25, hatom_hf=3.0).to_dict(), indent=2))
    print(json.dumps(r.plan(HatomAction.LEVERAGE_LOOP, amount_usd=20, hatom_hf=2.5, loops=2).to_dict(), indent=2))
