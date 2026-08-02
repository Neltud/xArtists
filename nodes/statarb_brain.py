"""
StatArbBrain — Vellum node for Statistical Arbitrage signals.
=============================================================
Lit / met à jour le PairBook, génère des signaux z-score et
les expose au reste du workflow LIA (fuse → CompoundCircuit).
"""
from __future__ import annotations

from typing import Any

from vellum.workflows import BaseNode

from lia.circuit.statistical_arbitrage import (
    PairBook,
    StatArbConfig,
    statistical_arbitrage,
)
from lia.circuit.strategies import Signal, fuse_signals


class StatArbBrain(BaseNode):
    strategy_name: str = "STATARB_BRAIN"
    pairs_path: str = "data/lia_statarb_pairs.json"
    entry_z: float = 2.0
    soft_entry_z: float = 1.7
    max_half_life_h: float = 36.0
    min_liquidity_usd: float = 40_000.0
    min_cointegration: float = 0.55
    budget_allocation_pct: float = 0.25
    target_net_profit_pct: float = 0.01

    # Inputs (fed by upstream Vellum nodes / GreenSmoke / price feeds)
    total_portfolio_usd: float = 0.0
    available_budget_usd: float = 0.0
    circuit_breaker_active: bool = False
    hatom_health_factor: float = 999.0
    gs_regime: str = "NEUTRAL"
    # List of pair snapshots:
    # [{token_a, token_b, price_a, price_b, liquidity_a, liquidity_b,
    #   half_life_h?, cointegration_score?, hedge_ratio?}]
    pairs_market: list[dict[str, Any]] = []

    class Outputs(BaseNode.Outputs):
        strategy: str
        decision: str
        confidence: int
        reasoning: str
        actions: list[dict[str, Any]]
        best_signal: dict[str, Any]
        signals: list[dict[str, Any]]
        pairs_updated: int
        allocated_budget_usd: float
        risk_level: str

    class Display(BaseNode.Display):
        icon = "vellum:icon:function"
        color = "teal"

    def run(self) -> "StatArbBrain.Outputs":
        self._log("INFO", f"📊 [{self.strategy_name}] StatArb scan...")

        if self.circuit_breaker_active or float(self.hatom_health_factor or 999) < 1.5:
            return self._wait("CIRCUIT_BREAKER_OR_HF_CRITIQUE")

        if str(self.gs_regime or "").upper() == "RISK_OFF":
            return self._wait("RISK_OFF — StatArb paused")

        cfg = StatArbConfig(
            entry_z=self.entry_z,
            soft_entry_z=self.soft_entry_z,
            max_half_life_h=self.max_half_life_h,
            min_liquidity_usd=self.min_liquidity_usd,
            min_cointegration=self.min_cointegration,
            pairs_path=self.pairs_path,
        )
        book = PairBook(path=self.pairs_path)

        signals: list[Signal] = []
        updated = 0

        for snap in list(self.pairs_market or []):
            token_a = str(snap.get("token_a", ""))
            token_b = str(snap.get("token_b", ""))
            price_a = float(snap.get("price_a", 0) or 0)
            price_b = float(snap.get("price_b", 0) or 0)
            if not token_a or not token_b or price_a <= 0 or price_b <= 0:
                continue

            st = book.update(
                token_a=token_a,
                token_b=token_b,
                price_a=price_a,
                price_b=price_b,
                liquidity_a=float(snap.get("liquidity_a", 0) or 0),
                liquidity_b=float(snap.get("liquidity_b", 0) or 0),
                hedge_ratio=float(snap.get("hedge_ratio", 1.0) or 1.0),
                half_life_h=float(snap["half_life_h"]) if snap.get("half_life_h") is not None else None,
                cointegration_score=(
                    float(snap["cointegration_score"])
                    if snap.get("cointegration_score") is not None
                    else None
                ),
            )
            updated += 1

            sig = statistical_arbitrage(
                token_a=st.token_a,
                token_b=st.token_b,
                price_a=st.price_a,
                price_b=st.price_b,
                spread_mean=st.spread_mean,
                spread_std=st.spread_std,
                z_score=st.last_z,
                half_life_h=st.half_life_h,
                liquidity_a=st.liquidity_a,
                liquidity_b=st.liquidity_b,
                cointegration_score=st.cointegration_score,
                hedge_ratio=st.hedge_ratio,
                cfg=cfg,
            )
            signals.append(sig)

        # Also emit signals for already-tracked pairs not in this batch
        for key, st in book.pairs.items():
            if any(s.token == st.token_a for s in signals):
                continue
            signals.append(book.signal_for(st.token_a, st.token_b, cfg))

        fused = fuse_signals(signals) if signals else Signal("WAIT", "", 0.3, "STATARB", "no pairs")

        budget = float(self.available_budget_usd or 0)
        if budget <= 0:
            budget = float(self.total_portfolio_usd or 0) * 0.2
        allocated = round(budget * self.budget_allocation_pct, 2)

        actions: list[dict[str, Any]] = []
        decision = fused.action
        confidence = int(round(fused.confidence * 100))
        reasoning = fused.reason

        if decision == "BUY" and allocated >= 1.0:
            actions.append(
                {
                    "type": f"BUY_{fused.token}",
                    "token_id": fused.token,
                    "amount_usd": allocated,
                    "strategy": "STATARB",
                    "reason": fused.reason,
                    "meta": fused.meta or {},
                    "entry_hint": fused.entry_hint,
                }
            )
        elif decision == "SELL":
            actions.append(
                {
                    "type": f"SELL_{fused.token}",
                    "token_id": fused.token,
                    "strategy": "STATARB",
                    "reason": fused.reason,
                    "meta": fused.meta or {},
                }
            )
        else:
            decision = "WAIT"

        risk = "LOW"
        if float(self.hatom_health_factor or 999) < 2.0:
            risk = "HIGH"
        elif float(self.hatom_health_factor or 999) < 2.5:
            risk = "MEDIUM"

        best = {
            "action": fused.action,
            "token": fused.token,
            "confidence": fused.confidence,
            "strategy": fused.strategy,
            "reason": fused.reason,
            "meta": fused.meta or {},
        }

        sig_dicts = [
            {
                "action": s.action,
                "token": s.token,
                "confidence": s.confidence,
                "strategy": s.strategy,
                "reason": s.reason,
                "meta": s.meta or {},
            }
            for s in signals
        ]

        self._log(
            "INFO",
            f"📊 [{self.strategy_name}] {decision} ({confidence}%) | "
            f"pairs_updated={updated} | signals={len(signals)}",
        )

        return self.Outputs(
            strategy=self.strategy_name,
            decision=decision,
            confidence=confidence,
            reasoning=reasoning,
            actions=actions,
            best_signal=best,
            signals=sig_dicts,
            pairs_updated=updated,
            allocated_budget_usd=allocated,
            risk_level=risk,
        )

    def _wait(self, reason: str) -> "StatArbBrain.Outputs":
        self._log("INFO", f"⏸️ [{self.strategy_name}] WAIT — {reason}")
        return self.Outputs(
            strategy=self.strategy_name,
            decision="WAIT",
            confidence=50,
            reasoning=reason,
            actions=[],
            best_signal={},
            signals=[],
            pairs_updated=0,
            allocated_budget_usd=0.0,
            risk_level="HIGH",
        )

    def _log(self, severity: str, message: str) -> None:
        self._context.emit_log_event(severity=severity, message=message)
