"""
LIA Yield strategy — park surplus / idle capital on MultiversX venues.

Paper-first. Integrates:
  - yield_risk (IL / HF / leverage caps)
  - HatomRouter (supply, claim, collateral, borrow, limited loop)
  - SoulRouter (experimental supply only)

Surplus split aligned with CompoundCircuit: 70% compound / 30% yield sleeve.
"""
from __future__ import annotations

import json
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Optional

from lia.defi.hatom_routes import HatomAction, HatomRouter
from lia.defi.soul_routes import SoulAction, SoulRouter
from lia.defi.yield_risk import YieldRiskConfig, assess_position_risk, impermanent_loss_approx

_ROOT = Path(__file__).resolve().parents[2]

MIN_HF_SUPPLY = 1.8
MIN_HF_HOLD = 1.5


@dataclass
class YieldVenue:
    id: str
    name: str
    kind: str  # lend | stake | stable_idle | lp | experimental
    estimated_apy: float
    risk: str
    chain: str = "multiversx"
    notes: str = ""


DEFAULT_VENUES: list[YieldVenue] = [
    YieldVenue("hatom_lend", "Hatom lend", "lend", 0.04, "medium", notes="supply EGLD/USDC if HF ok"),
    YieldVenue("hatom_htm_stake", "Hatom HTM stake", "stake", 0.0, "medium", notes="stake HTM rewards"),
    YieldVenue("liquid_stake", "Liquid stake hint", "stake", 0.06, "medium", notes="protocol stake APY varies"),
    YieldVenue("xex_lp", "xExchange LP", "lp", 0.08, "high", notes="IL risk — gated"),
    YieldVenue("soul_supply", "Soul supply", "experimental", 0.03, "high", notes="experimental cross-chain layer"),
    YieldVenue("stable_idle", "Stable idle", "stable_idle", 0.0, "low", notes="hold USDC/WEGLD"),
]


@dataclass
class YieldSignal:
    action: str
    venue_id: str
    amount_usd: float
    confidence: float
    reason: str
    risk: str
    meta: dict[str, Any] = field(default_factory=dict)
    hatom_plan: Optional[dict[str, Any]] = None
    soul_plan: Optional[dict[str, Any]] = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def estimate_venues(overrides: Optional[dict[str, float]] = None) -> list[YieldVenue]:
    out: list[YieldVenue] = []
    for v in DEFAULT_VENUES:
        apy = float((overrides or {}).get(v.id, v.estimated_apy))
        out.append(YieldVenue(v.id, v.name, v.kind, apy, v.risk, v.chain, v.notes))
    return out


def surplus_split(
    pnl_usd: float,
    *,
    compound_frac: float = 0.70,
    surplus_frac: float = 0.30,
) -> dict[str, float]:
    if pnl_usd <= 0:
        return {"to_compound": pnl_usd, "to_yield": 0.0}
    return {
        "to_compound": round(pnl_usd * compound_frac, 6),
        "to_yield": round(pnl_usd * surplus_frac, 6),
    }


def yield_decision(
    *,
    yield_sleeve_usd: float,
    deployable_idle_usd: float = 0.0,
    hatom_hf: float = 999.0,
    defense_active: bool = False,
    mode_id: str = "YIELD",
    apy_overrides: Optional[dict[str, float]] = None,
    min_deploy_usd: float = 5.0,
    prefer_leverage: bool = False,
    allow_soul: bool = False,
    allow_lp: bool = False,
    expected_lp_move_pct: float = 0.0,
    htm_balance: float = 0.0,
    claim_first: bool = False,
) -> YieldSignal:
    venues = estimate_venues(apy_overrides)
    pool = max(0.0, yield_sleeve_usd) + max(0.0, deployable_idle_usd)
    hatom = HatomRouter()
    soul = SoulRouter()

    if claim_first:
        plan = hatom.plan(HatomAction.CLAIM_REWARDS, hatom_hf=hatom_hf)
        return YieldSignal(
            "YIELD_CLAIM",
            "hatom_lend",
            0.0,
            0.75,
            "claim rewards first",
            "low",
            hatom_plan=plan.to_dict(),
        )

    if hatom_hf < MIN_HF_HOLD:
        plan = hatom.plan(HatomAction.REPAY, amount_usd=pool * 0.5, hatom_hf=hatom_hf)
        return YieldSignal(
            "YIELD_WITHDRAW",
            "hatom_lend",
            pool * 0.5,
            0.85,
            f"HF {hatom_hf:.2f} < {MIN_HF_HOLD}",
            "high",
            {"hatom_hf": hatom_hf},
            hatom_plan=plan.to_dict(),
        )

    if pool < min_deploy_usd:
        return YieldSignal("SKIP", "stable_idle", 0.0, 0.5, f"pool ${pool:.2f} < min", "low")

    if defense_active or mode_id == "DEFENSE":
        return YieldSignal(
            "YIELD_HOLD",
            "stable_idle",
            pool,
            0.7,
            "defense: stable idle only",
            "low",
            {"pool_usd": pool},
        )

    # Optional LP with IL gate
    if allow_lp:
        il_risk = assess_position_risk(
            kind="lp",
            price_move_expected_pct=expected_lp_move_pct,
            sleeve_usd=pool * 0.3,
        )
        if il_risk["ok"]:
            return YieldSignal(
                "YIELD_DEPLOY",
                "xex_lp",
                round(pool * 0.3, 4),
                0.55,
                f"LP gated IL≈{il_risk['il_pct']:.2%}",
                "high",
                {"risk": il_risk, "il_formula": "2*sqrt(k)/(1+k)-1"},
            )

    # HTM stake if balance
    if htm_balance > 0:
        plan = hatom.plan(HatomAction.STAKE_HTM, htm_balance=htm_balance, hatom_hf=hatom_hf)
        if plan.ok:
            return YieldSignal(
                "YIELD_STAKE_HTM",
                "hatom_htm_stake",
                0.0,
                0.65,
                "stake HTM",
                "medium",
                hatom_plan=plan.to_dict(),
            )

    # Primary: Hatom supply (or limited loop)
    h_plan = hatom.auto_route(
        yield_sleeve_usd=pool,
        hatom_hf=hatom_hf,
        defense_active=False,
        prefer_loop=prefer_leverage,
    )
    if h_plan.ok:
        return YieldSignal(
            "YIELD_DEPLOY",
            "hatom_lend",
            h_plan.amount_usd,
            0.7,
            h_plan.reason,
            "medium",
            {"paper": True},
            hatom_plan=h_plan.to_dict(),
        )

    # Optional Soul (experimental, reduced size)
    if allow_soul:
        s_plan = soul.auto_route(amount_usd=pool, defense_active=False, health_factor=hatom_hf)
        if s_plan.ok:
            return YieldSignal(
                "YIELD_DEPLOY_EXPERIMENTAL",
                "soul_supply",
                s_plan.amount_usd,
                0.4,
                "soul experimental supply",
                "high",
                soul_plan=s_plan.to_dict(),
            )

    return YieldSignal("YIELD_HOLD", "stable_idle", pool, 0.55, "fallback idle", "low")


if __name__ == "__main__":
    print(json.dumps(yield_decision(yield_sleeve_usd=20, hatom_hf=3.0).to_dict(), indent=2))
    print(json.dumps(yield_decision(yield_sleeve_usd=20, prefer_leverage=True, hatom_hf=2.5).to_dict(), indent=2))
    print("IL 50% move", impermanent_loss_approx(1.5))
