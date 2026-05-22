"""
UniversalBrainUnified — Classe de base commune pour TP1, TP3, TP5.
Contient toute la logique d'analyse ESDT partagée.
"""
from typing import Any

from vellum.workflows import BaseNode


class UniversalBrainUnified(BaseNode):
    # Paramètres de stratégie (surchargés par les sous-classes)
    strategy_name: str = "UNIVERSAL_BRAIN"
    budget_allocation_pct: float = 0.32
    min_score_entry: int = 65
    max_rsi_entry: float = 50.0
    min_score_moderate: int = 55
    max_rsi_moderate: float = 58.0
    tp_default_pct: float = 5.0
    sl_default_pct: float = 2.5
    max_tokens_to_buy: int = 3
    min_liquidity_usd: float = 1000.0
    min_trade_usd: float = 0.05
    target_net_profit_pct: float = 0.01
    dex_fee_per_hop: float = 0.003
    gas_cost_usd: float = 0.05
    max_slippage_pct: float = 0.03

    class Outputs(BaseNode.Outputs):
        strategy: str
        decision: str
        confidence: int
        reasoning: str
        actions: list[dict[str, Any]]
        exit_actions: list[dict[str, Any]]
        available_budget_usd: float
        allocated_budget_usd: float
        selected_tokens: list[dict[str, Any]]
        tokens_analyzed: int
        best_token: str
        best_score: int
        rsi_avg: float
        risk_level: str
        profit_validated: bool
        required_gross_pct: float
        estimated_fees_pct: float
        profit_validation_detail: str
        tp_sl_alerts: list[dict[str, Any]]
        million_progress_pct: float

    class Display(BaseNode.Display):
        icon = "vellum:icon:function"
        color = "purple"

    def run(self) -> "UniversalBrainUnified.Outputs":
        self._log("INFO", f"🧠 [{self.strategy_name}] Analyse ESDT...")

        egld_balance = float(getattr(self, "egld_balance", 0) or 0)
        usdc_balance = float(getattr(self, "usdc_balance", 0) or 0)
        total_portfolio_usd = float(getattr(self, "total_portfolio_usd", 0) or 0)
        hatom_health_factor = float(getattr(self, "hatom_health_factor", 999) or 999)
        egld_price = float(getattr(self, "egld_price", 4.5) or 4.5)
        circuit_breaker_active = bool(getattr(self, "circuit_breaker_active", False))
        top_opportunities = list(getattr(self, "top_opportunities", []) or [])
        wallet_holdings = list(getattr(self, "wallet_holdings", []) or [])

        if circuit_breaker_active or hatom_health_factor < 1.5:
            return self._wait_output("CIRCUIT_BREAKER_OR_HF_CRITIQUE", total_portfolio_usd)

        usdc_avail = max(0, usdc_balance - 0.1)
        egld_tradable = max(0, egld_balance - 0.05) * egld_price
        available_budget = round(usdc_avail + egld_tradable * 0.5, 2)
        allocated_budget = round(available_budget * self.budget_allocation_pct, 2)

        btc_rsi = float(getattr(self, "btc_rsi_14", 50) or 50)
        egld_rsi = float(getattr(self, "egld_rsi_14", 50) or 50)
        wtao_rsi = float(getattr(self, "wtao_rsi_14", 50) or 50)
        rsi_avg = round((btc_rsi + egld_rsi + wtao_rsi) / 3, 1)

        leverage_risk = str(getattr(self, "leverage_risk", "LOW") or "LOW")
        if hatom_health_factor < 1.5 or leverage_risk == "EXTREME":
            risk_level = "EXTREME"
        elif hatom_health_factor < 2.0 or leverage_risk == "HIGH":
            risk_level = "HIGH"
        elif hatom_health_factor < 2.5:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        selected_tokens = []
        tp_sl_alerts = []

        for token in wallet_holdings:
            ticker = token.get("ticker", "").upper().split("-")[0]
            current_price = float(token.get("price_usd", 0) or 0)
            avg_entry_prices = getattr(self, "aeu_prices_by_ticker", {}) or {}
            entry_price = float(avg_entry_prices.get(ticker, 0) or 0)
            if entry_price > 0 and current_price > 0:
                roi = (current_price - entry_price) / entry_price * 100
                if roi >= self.tp_default_pct:
                    tp_sl_alerts.append({"token": ticker, "type": "TAKE_PROFIT", "roi_pct": round(roi, 2), "tp_pct": self.tp_default_pct})
                elif roi <= -self.sl_default_pct:
                    tp_sl_alerts.append({"token": ticker, "type": "STOP_LOSS", "roi_pct": round(roi, 2), "sl_pct": self.sl_default_pct})

        for token in top_opportunities[:self.max_tokens_to_buy]:
            score = int(token.get("composite_score", 0) or 0)
            rsi = float(token.get("rsi_14", 50) or 50)
            liquidity = float(token.get("liquidity_usd", 0) or 0)
            if score >= self.min_score_entry and rsi <= self.max_rsi_entry and liquidity >= self.min_liquidity_usd:
                selected_tokens.append(token)
            elif score >= self.min_score_moderate and rsi <= self.max_rsi_moderate and liquidity >= self.min_liquidity_usd:
                selected_tokens.append(token)

        fees_dex = self.dex_fee_per_hop * 2
        gas_pct = self.gas_cost_usd / max(allocated_budget, 0.01)
        est_fees = fees_dex + gas_pct + self.max_slippage_pct * 0.5
        req_gross = self.target_net_profit_pct + est_fees
        min_tp = self.tp_default_pct / 100
        profit_validated = min_tp >= req_gross and allocated_budget >= self.min_trade_usd
        profit_detail = f"Fees={fees_dex*100:.2f}%+Gas={gas_pct*100:.2f}%={est_fees*100:.2f}% | TP={min_tp*100:.1f}% | {'✅' if profit_validated else '❌'}"

        million_pct = min(100.0, total_portfolio_usd / 1000000 * 100)

        if tp_sl_alerts:
            decision, confidence, reasoning = "SELL", 85, f"TP/SL déclenché: {len(tp_sl_alerts)} alertes"
        elif selected_tokens and profit_validated and risk_level in ("LOW", "MEDIUM"):
            decision = "BUY"
            confidence = min(90, int(selected_tokens[0].get("composite_score", 65)))
            reasoning = f"{len(selected_tokens)} token(s) | RSI={rsi_avg:.1f} | Risk={risk_level}"
        elif allocated_budget < self.min_trade_usd:
            decision, confidence, reasoning = "WAIT", 70, f"Budget ${allocated_budget:.2f} insuffisant"
        else:
            decision, confidence, reasoning = "WAIT", 60, f"Conditions défavorables | RSI={rsi_avg:.1f}"

        actions, exit_actions = [], []
        if decision == "BUY" and profit_validated:
            budget_per_token = allocated_budget / max(len(selected_tokens), 1)
            for token in selected_tokens:
                if budget_per_token >= self.min_trade_usd:
                    actions.append({"type": f"BUY_{token.get('ticker', '?').upper()}", "token_id": token.get("token_id", ""), "amount_usd": round(budget_per_token, 2), "pair_address": token.get("pair_address", ""), "reason": f"Score={token.get('composite_score', 0)}"})
        if decision == "SELL":
            for alert in tp_sl_alerts:
                token_data = next((t for t in wallet_holdings if t.get("ticker", "").upper().split("-")[0] == alert["token"]), {})
                value_usd = float(token_data.get("value_usd", 0) or 0)
                sell_pct = 0.5 if alert["type"] == "TAKE_PROFIT" else 1.0
                if value_usd * sell_pct >= self.min_trade_usd:
                    exit_actions.append({"type": f"SELL_{alert['token']}_{alert['type'][:2]}", "amount_usd": round(value_usd * sell_pct, 2), "reason": f"{alert['type']} ROI={alert['roi_pct']:+.1f}%"})

        best_token = selected_tokens[0].get("ticker", "") if selected_tokens else ""
        best_score = int(selected_tokens[0].get("composite_score", 0)) if selected_tokens else 0
        self._log("INFO", f"🧠 [{self.strategy_name}] {decision} ({confidence}%) | Budget=${allocated_budget:.2f} | Tokens={len(selected_tokens)}")

        return self.Outputs(
            strategy=self.strategy_name, decision=decision, confidence=confidence, reasoning=reasoning,
            actions=actions, exit_actions=exit_actions, available_budget_usd=available_budget,
            allocated_budget_usd=allocated_budget, selected_tokens=selected_tokens,
            tokens_analyzed=len(top_opportunities), best_token=best_token, best_score=best_score,
            rsi_avg=rsi_avg, risk_level=risk_level, profit_validated=profit_validated,
            required_gross_pct=round(req_gross * 100, 4), estimated_fees_pct=round(est_fees * 100, 4),
            profit_validation_detail=profit_detail, tp_sl_alerts=tp_sl_alerts,
            million_progress_pct=round(million_pct, 8),
        )

    def _wait_output(self, reason: str, portfolio_usd: float) -> "UniversalBrainUnified.Outputs":
        million_pct = min(100.0, portfolio_usd / 1000000 * 100)
        self._log("INFO", f"⏸️ [{self.strategy_name}] WAIT — {reason}")
        return self.Outputs(
            strategy=self.strategy_name, decision="WAIT", confidence=50, reasoning=reason,
            actions=[], exit_actions=[], available_budget_usd=0.0, allocated_budget_usd=0.0,
            selected_tokens=[], tokens_analyzed=0, best_token="", best_score=0, rsi_avg=50.0,
            risk_level="HIGH", profit_validated=True, required_gross_pct=0.0, estimated_fees_pct=0.0,
            profit_validation_detail="N/A — WAIT", tp_sl_alerts=[], million_progress_pct=round(million_pct, 8),
        )

    def _log(self, severity: str, message: str) -> None:
        self._context.emit_log_event(severity=severity, message=message)
