"""
LIA Yield strategy — park surplus / idle capital on MultiversX venues.

Paper-first: emits placement signals only. No PEM / no TX broadcast.
Venues (signals): Hatom lending, liquid staking hints, stable idle.

Surplus split aligned with CompoundCircuit:
  base_compound_fraction 70% stays in trading equity
  surplus_fraction 30% can feed yield_sleeve
"""
from __future__ import annotations

import json
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Optional

_ROOT = Path(__file__).resolve().parents[2]

# Min HF to allow extra supply (aligned guards G12)
MIN_HF_SUPPLY = 1.8
MIN_HF_HOLD = 1.5


@dataclass
class YieldVenue:
    id: str
    name: str
    kind: str  # lend | stake | stable_idle
    estimated_apy: float  # 0.05 = 5%
    risk: str  # low | medium | high
    chain: str = "multiversx"
    notes: str = ""


DEFAULT_VENUES: list[YieldVenue] = [
    YieldVenue("hatom_lend", "Hatom lend", "lend", 0.04, "medium", notes="supply EGLD/USDC if HF ok"),
    YieldVenue("liquid_stake", "Liquid stake hint", "stake", 0.06, "medium", notes="protocol stake APY varies"),
    YieldVenue("stable_idle", "Stable idle", "stable_idle", 0.0, "low", notes="hold USDC/WEGLD no deploy"),
]


@dataclass
class YieldSignal:
    action: str  # YIELD_DEPLOY | YIELD_HOLD | YIELD_WITHDRAW | SKIP
    venue_id: str
    amount_usd: float
    confidence: float
    reason: str
    risk: str
    meta: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def estimate_venues(overrides: Optional[dict[str, float]] = None) -> list[YieldVenue]:
    """Optional APY overrides from DataHub / Vellum."""
    out: list[YieldVenue] = []
    for v in DEFAULT_VENUES:
        apy = float((overrides or {}).get(v.id, v.estimated_apy))
        out.append(
            YieldVenue(v.id, v.name, v.kind, apy, v.risk, v.chain, v.notes)
        )
    return out


def pick_best_venue(
    venues: list[YieldVenue],
    *,
    hatom_hf: float = 999.0,
    prefer_low_risk: bool = False,
) -> Optional[YieldVenue]:
    candidates = [v for v in venues if v.kind != "stable_idle"]
    if hatom_hf < MIN_HF_SUPPLY:
        # no extra lend if HF tight
        candidates = [v for v in candidates if v.kind != "lend"]
    if not candidates:
        idle = next((v for v in venues if v.kind == "stable_idle"), None)
        return idle
    if prefer_low_risk:
        candidates = sorted(candidates, key=lambda x: (x.risk != "low", -x.estimated_apy))
    else:
        candidates = sorted(candidates, key=lambda x: -x.estimated_apy)
    return candidates[0]


def yield_decision(
    *,
    yield_sleeve_usd: float,
    deployable_idle_usd: float = 0.0,
    hatom_hf: float = 999.0,
    defense_active: bool = False,
    mode_id: str = "YIELD",
    apy_overrides: Optional[dict[str, float]] = None,
    min_deploy_usd: float = 5.0,
) -> YieldSignal:
    """
    Decide what to do with surplus / idle capital.
    defense_active → prefer stable_idle or withdraw risk.
    """
    venues = estimate_venues(apy_overrides)
    pool = max(0.0, yield_sleeve_usd) + max(0.0, deployable_idle_usd)

    if hatom_hf < MIN_HF_HOLD:
        return YieldSignal(
            "YIELD_WITHDRAW",
            "hatom_lend",
            0.0,
            0.85,
            f"HF {hatom_hf:.2f} < {MIN_HF_HOLD} — reduce lend risk",
            "high",
            {"hatom_hf": hatom_hf},
        )

    if pool < min_deploy_usd:
        return YieldSignal(
            "SKIP",
            "stable_idle",
            0.0,
            0.5,
            f"pool ${pool:.2f} < min ${min_deploy_usd}",
            "low",
        )

    if defense_active or mode_id == "DEFENSE":
        idle = next(v for v in venues if v.kind == "stable_idle")
        return YieldSignal(
            "YIELD_HOLD",
            idle.id,
            pool,
            0.7,
            "defense: keep surplus in stable idle",
            "low",
            {"pool_usd": pool},
        )

    best = pick_best_venue(venues, hatom_hf=hatom_hf)
    if not best or best.kind == "stable_idle":
        return YieldSignal(
            "YIELD_HOLD",
            "stable_idle",
            pool,
            0.55,
            "no safe yield venue",
            "low",
        )

    # deploy up to 80% of sleeve; keep buffer
    amount = round(pool * 0.8, 4)
    return YieldSignal(
        "YIELD_DEPLOY",
        best.id,
        amount,
        min(0.8, 0.5 + best.estimated_apy),
        f"deploy to {best.name} est APY {best.estimated_apy:.1%}",
        best.risk,
        {"venue": asdict(best), "pool_usd": pool, "paper": True},
    )


def surplus_split(
    pnl_usd: float,
    *,
    compound_frac: float = 0.70,
    surplus_frac: float = 0.30,
) -> dict[str, float]:
    """Same economics as CompoundCircuit close."""
    if pnl_usd <= 0:
        return {"to_compound": pnl_usd, "to_yield": 0.0}
    return {
        "to_compound": round(pnl_usd * compound_frac, 6),
        "to_yield": round(pnl_usd * surplus_frac, 6),
    }


if __name__ == "__main__":
    print(json.dumps(yield_decision(yield_sleeve_usd=20, hatom_hf=3.0).to_dict(), indent=2))
    print(json.dumps(yield_decision(yield_sleeve_usd=20, defense_active=True).to_dict(), indent=2))
