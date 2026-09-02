"""
Multi-Horizon Decision Engine — viser l'infaillibilité relative
==============================================================
Court terme (CT)  : minutes → heures   — circuit +1% / SL (STATARB intégré)
Moyen terme (MT)  : jours → semaines   — accumulation / DCA cadence
Long terme (LT)   : mois               — allocation cible + réinvestissement ouvert
"""
from __future__ import annotations

import json
import time
from dataclasses import asdict, dataclass, field
from enum import Enum
from typing import Any, Optional


class Horizon(str, Enum):
    ST = "short"
    MT = "medium"
    LT = "long"


class Intent(str, Enum):
    BUY = "BUY"
    SELL = "SELL"
    ACCUMULATE = "ACCUMULATE"
    HOLD = "HOLD"
    YIELD = "YIELD"
    REBALANCE = "REBALANCE"
    WAIT = "WAIT"
    HALT = "HALT"


@dataclass
class HorizonVote:
    horizon: str
    intent: str
    confidence: float
    reason: str
    size_mult: float = 1.0


@dataclass
class FusedDecision:
    intent: str
    confidence: float
    size_mult: float
    reasons: list[str] = field(default_factory=list)
    votes: list[dict[str, Any]] = field(default_factory=list)
    cadence: dict[str, Any] = field(default_factory=dict)
    reinvest: dict[str, Any] = field(default_factory=dict)
    veto: bool = False

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


LT_TARGETS = {
    "USDC": 0.45,
    "EGLD": 0.30,
    "WBTC": 0.20,
    "YIELD_BUFFER": 0.05,
}

CADENCE = {
    "min_hours_between_st_trades": 0.33,  # ~20 min (align guards)
    "dca_interval_hours": 24,
    "rebalance_interval_hours": 168,
    "max_st_trades_per_day": 6,
    "accumulate_pct_of_deployable": 0.05,
}

# Confidence floors by strategy for ST BUY
_ST_CONF_FLOOR = {
    "STATARB": 0.55,
    "ARB": 0.57,
    "MR": 0.62,
    "MOM": 0.62,
    "EXT": 0.62,
}


def vote_short_term(
    *,
    signal_action: str,
    signal_conf: float,
    signal_strategy: str = "",
    circuit_can_open: bool,
    circuit_reason: str,
    gs_regime: str,
    profit_validated: bool,
    hours_since_swap: float,
) -> HorizonVote:
    if gs_regime == "RISK_OFF":
        return HorizonVote(Horizon.ST.value, Intent.YIELD.value, 0.85, "ST: RISK_OFF → yield only")
    if not circuit_can_open:
        return HorizonVote(Horizon.ST.value, Intent.WAIT.value, 0.7, f"ST: {circuit_reason}")
    if hours_since_swap < CADENCE["min_hours_between_st_trades"]:
        return HorizonVote(Horizon.ST.value, Intent.WAIT.value, 0.75, "ST: cadence floor")

    strat = (signal_strategy or "").upper()
    floor = _ST_CONF_FLOOR.get(strat, 0.62)

    if signal_action == "BUY" and signal_conf >= floor and profit_validated:
        tag = f"ST: {strat or 'edge'} +1% circuit" if strat else "ST: edge +1% circuit"
        # Slight size boost for high-conviction STATARB
        size = 1.0
        if strat == "STATARB" and signal_conf >= 0.80:
            size = 1.1
        return HorizonVote(Horizon.ST.value, Intent.BUY.value, signal_conf, tag, size)

    if signal_action == "SELL":
        return HorizonVote(Horizon.ST.value, Intent.SELL.value, max(signal_conf, 0.7), f"ST: exit {strat or 'signal'}")

    return HorizonVote(Horizon.ST.value, Intent.WAIT.value, 0.5, "ST: no edge")


def vote_medium_term(
    *,
    trend_7d_pct: float,
    rsi_14: float,
    gs_bias: str,
    hours_since_dca: float,
    deployable_usd: float,
) -> HorizonVote:
    if hours_since_dca < CADENCE["dca_interval_hours"]:
        return HorizonVote(Horizon.MT.value, Intent.HOLD.value, 0.6, "MT: DCA interval not elapsed")
    if deployable_usd < 5:
        return HorizonVote(Horizon.MT.value, Intent.HOLD.value, 0.55, "MT: low deployable")
    if trend_7d_pct <= 0 and trend_7d_pct > -15 and rsi_14 < 55 and gs_bias != "BEARISH":
        return HorizonVote(
            Horizon.MT.value,
            Intent.ACCUMULATE.value,
            0.68,
            f"MT: DCA dip trend_7d={trend_7d_pct:.1f}%",
            CADENCE["accumulate_pct_of_deployable"] / 0.25,
        )
    if trend_7d_pct > 8 and rsi_14 > 65:
        return HorizonVote(Horizon.MT.value, Intent.HOLD.value, 0.65, "MT: extended — no DCA")
    if gs_bias == "BEARISH" and trend_7d_pct < -5:
        return HorizonVote(Horizon.MT.value, Intent.YIELD.value, 0.7, "MT: bearish → stables")
    return HorizonVote(Horizon.MT.value, Intent.HOLD.value, 0.5, "MT: neutral hold")


def vote_long_term(
    *,
    weights: dict[str, float],
    hours_since_rebalance: float,
    total_usd: float,
) -> HorizonVote:
    if total_usd < 20:
        return HorizonVote(Horizon.LT.value, Intent.HOLD.value, 0.5, "LT: capital too small")
    if hours_since_rebalance < CADENCE["rebalance_interval_hours"]:
        return HorizonVote(Horizon.LT.value, Intent.HOLD.value, 0.55, "LT: weekly cadence")

    drifts = []
    for asset, target in LT_TARGETS.items():
        if asset == "YIELD_BUFFER":
            continue
        current = float(weights.get(asset, 0) or 0)
        drifts.append((asset, current - target, abs(current - target)))
    drifts.sort(key=lambda x: -x[2])
    if not drifts or drifts[0][2] < 0.08:
        return HorizonVote(Horizon.LT.value, Intent.HOLD.value, 0.6, "LT: allocation within band")

    asset, signed_drift, mag = drifts[0]
    if signed_drift > 0:
        return HorizonVote(
            Horizon.LT.value,
            Intent.REBALANCE.value,
            min(0.85, 0.55 + mag),
            f"LT: overweight {asset} drift={signed_drift:+.1%} → trim",
            0.5,
        )
    return HorizonVote(
        Horizon.LT.value,
        Intent.ACCUMULATE.value,
        min(0.85, 0.55 + mag),
        f"LT: underweight {asset} drift={signed_drift:+.1%} → add",
        0.4,
    )


def fuse_horizons(
    st: HorizonVote,
    mt: HorizonVote,
    lt: HorizonVote,
) -> FusedDecision:
    votes = [st, mt, lt]
    reasons = [v.reason for v in votes]

    if st.intent == Intent.SELL.value:
        return FusedDecision(Intent.SELL.value, st.confidence, 1.0, reasons, [asdict(v) for v in votes])

    if st.intent == Intent.HALT.value:
        return FusedDecision(Intent.HALT.value, 1.0, 0.0, reasons, [asdict(v) for v in votes], veto=True)

    yield_n = sum(1 for v in votes if v.intent == Intent.YIELD.value)
    if yield_n >= 2:
        return FusedDecision(Intent.YIELD.value, 0.8, 0.0, reasons, [asdict(v) for v in votes])

    if st.intent == Intent.BUY.value:
        if mt.intent == Intent.YIELD.value or (lt.intent == Intent.YIELD.value and mt.confidence > 0.65):
            return FusedDecision(
                Intent.WAIT.value,
                0.75,
                0.0,
                reasons + ["veto: ST buy blocked by higher-horizon YIELD"],
                [asdict(v) for v in votes],
                veto=True,
            )
        return FusedDecision(Intent.BUY.value, st.confidence, st.size_mult, reasons, [asdict(v) for v in votes])

    if mt.intent == Intent.ACCUMULATE.value or lt.intent == Intent.ACCUMULATE.value:
        best = mt if mt.intent == Intent.ACCUMULATE.value else lt
        return FusedDecision(
            Intent.ACCUMULATE.value,
            best.confidence,
            min(best.size_mult, 0.5),
            reasons,
            [asdict(v) for v in votes],
        )

    if lt.intent == Intent.REBALANCE.value:
        return FusedDecision(Intent.REBALANCE.value, lt.confidence, lt.size_mult, reasons, [asdict(v) for v in votes])

    if st.intent == Intent.YIELD.value:
        return FusedDecision(Intent.YIELD.value, st.confidence, 0.0, reasons, [asdict(v) for v in votes])

    return FusedDecision(Intent.HOLD.value, 0.55, 0.0, reasons, [asdict(v) for v in votes])


def open_loop_reinvest_plan(
    *,
    decision: FusedDecision,
    pnl_usd: float = 0.0,
    deployable_usd: float = 0.0,
) -> dict[str, Any]:
    plan: dict[str, Any] = {
        "mode": "open_loop",
        "actions": [],
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    if decision.intent == Intent.BUY.value:
        plan["actions"].append({"type": "ST_TRADE", "size_mult": decision.size_mult})
    elif decision.intent == Intent.ACCUMULATE.value:
        usd = round(deployable_usd * CADENCE["accumulate_pct_of_deployable"], 4)
        plan["actions"].append({"type": "DCA_BUY", "amount_usd": usd, "assets": ["EGLD", "WBTC"]})
    elif decision.intent == Intent.YIELD.value:
        plan["actions"].append({"type": "PARK_STABLE", "asset": "USDC-c76f1f", "pct": 1.0})
    elif decision.intent == Intent.REBALANCE.value:
        plan["actions"].append({"type": "REBALANCE", "targets": LT_TARGETS})
    elif decision.intent == Intent.SELL.value:
        plan["actions"].append({"type": "EXIT", "size_mult": 1.0})

    if pnl_usd > 0:
        plan["actions"].append(
            {
                "type": "SURPLUS_SPLIT",
                "compound_pct": 0.75,
                "yield_pct": 0.25,
                "pnl_usd": pnl_usd,
            }
        )
    return plan


def decide(
    *,
    signal_action: str = "WAIT",
    signal_conf: float = 0.5,
    signal_strategy: str = "",
    circuit_can_open: bool = True,
    circuit_reason: str = "OK",
    gs_regime: str = "NEUTRAL",
    gs_bias: str = "NEUTRAL",
    profit_validated: bool = False,
    hours_since_swap: float = 999.0,
    hours_since_dca: float = 999.0,
    hours_since_rebalance: float = 999.0,
    trend_7d_pct: float = 0.0,
    rsi_14: float = 50.0,
    deployable_usd: float = 0.0,
    total_usd: float = 0.0,
    weights: Optional[dict[str, float]] = None,
) -> FusedDecision:
    st = vote_short_term(
        signal_action=signal_action,
        signal_conf=signal_conf,
        signal_strategy=signal_strategy,
        circuit_can_open=circuit_can_open,
        circuit_reason=circuit_reason,
        gs_regime=gs_regime,
        profit_validated=profit_validated,
        hours_since_swap=hours_since_swap,
    )
    mt = vote_medium_term(
        trend_7d_pct=trend_7d_pct,
        rsi_14=rsi_14,
        gs_bias=gs_bias,
        hours_since_dca=hours_since_dca,
        deployable_usd=deployable_usd,
    )
    lt = vote_long_term(
        weights=weights or {},
        hours_since_rebalance=hours_since_rebalance,
        total_usd=total_usd,
    )
    fused = fuse_horizons(st, mt, lt)
    fused.cadence = CADENCE
    fused.reinvest = open_loop_reinvest_plan(
        decision=fused, deployable_usd=deployable_usd
    )
    return fused


if __name__ == "__main__":
    d = decide(
        signal_action="BUY",
        signal_conf=0.72,
        signal_strategy="STATARB",
        profit_validated=True,
        hours_since_swap=2.0,
        trend_7d_pct=-3.0,
        rsi_14=42,
        deployable_usd=40,
        total_usd=50,
        weights={"USDC": 0.6, "EGLD": 0.25, "WBTC": 0.1},
        gs_regime="NEUTRAL",
        gs_bias="NEUTRAL",
    )
    print(json.dumps(d.to_dict(), indent=2))
