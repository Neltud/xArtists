"""
AutonomousLia — Vellum node
===========================
Cycle complet autonome: signal → symbiose → guards → multi-venue → compound → report.
Objectif: profit (compounding + yields).
PEM uniquement via secrets Vellum (LIA_WALLET_PEM_PATH).
"""
from __future__ import annotations

from typing import Any

from vellum.workflows import BaseNode

from lia.vellum.autonomous_lia import run_autonomous_lia


class AutonomousLia(BaseNode):
    force_mode: str = "paper"  # paper | live
    enable_jupiter_arb: bool = True
    jupiter_arb_amount: int = 10_000_000

    market: dict[str, Any] = {}
    portfolio: dict[str, Any] = {}
    pairs_market: list[dict[str, Any]] = []
    brain_outputs: list[dict[str, Any]] = []
    gs_regime: str = "NEUTRAL"
    gs_bias: str = "NEUTRAL"

    class Outputs(BaseNode.Outputs):
        event: str
        mode: str
        signal: dict[str, Any]
        approved_actions: list[dict[str, Any]]
        executor: dict[str, Any]
        ticket: dict[str, Any]
        compound_health: dict[str, Any]
        error_bus: dict[str, Any]
        jupiter_arb: dict[str, Any]
        summary: str
        full: dict[str, Any]

    class Display(BaseNode.Display):
        icon = "vellum:icon:function"
        color = "teal"

    def run(self) -> "AutonomousLia.Outputs":
        self._log("INFO", f"🤖 AutonomousLia mode={self.force_mode} jup_arb={self.enable_jupiter_arb}")
        result = run_autonomous_lia(
            market=dict(self.market or {}),
            portfolio=dict(self.portfolio or {}),
            pairs_market=list(self.pairs_market or []),
            brain_outputs=list(self.brain_outputs or []),
            gs={"regime": self.gs_regime, "bias": self.gs_bias},
            force_mode=self.force_mode,
            enable_jupiter_arb=bool(self.enable_jupiter_arb),
            jupiter_arb_amount=int(self.jupiter_arb_amount),
        )
        event = str(result.get("event") or "IDLE")
        sym = result.get("symbiosis") or {}
        summary = (
            f"event={event} signal={((result.get('signal') or {}).get('strategy'))} "
            f"mode={sym.get('mode')} compound={((result.get('compound_health') or {}).get('phase'))}"
        )
        self._log("INFO", f"🤖 {summary}")
        return self.Outputs(
            event=event,
            mode=str(result.get("mode") or self.force_mode),
            signal=result.get("signal") or {},
            approved_actions=list(sym.get("approved_actions") or []),
            executor=result.get("executor") or {},
            ticket=result.get("ticket") or {},
            compound_health=result.get("compound_health") or {},
            error_bus=result.get("error_bus") or {},
            jupiter_arb=result.get("jupiter_arb") or {},
            summary=summary,
            full=result,
        )

    def _log(self, severity: str, message: str) -> None:
        self._context.emit_log_event(severity=severity, message=message)
