"""
OrchestratorRouter — Vellum Workflows node
==========================================
Fusionne les sorties parallèles des cerveaux IA + Risk + Yield
via lia.orchestration.symbiosis.fuse_votes.

Modes de sortie (alignés docs LIA v6):
  TRADE       → au moins un BUY approuvé
  STRONG_BUY  → BUY haute confiance (avg conf >= seuil) + plusieurs stratégies
  YIELD_ONLY  → pas d'entry, yield / wait
  BLOCKED     → RiskAgent BLOCK ou circuit breaker

Place dans le graphe Vellum:
  BalanceGuard (OK) → [brains //] → OrchestratorRouter → UniversalExecutor(s)
"""
from __future__ import annotations

import sys
from pathlib import Path
from typing import Any, Optional

from vellum.workflows import BaseNode

# Allow import of lia.* when running inside Vellum / repo root
_ROOT = Path(__file__).resolve().parents[1]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

try:
    from lia.orchestration.symbiosis import (
        GLOBAL_ENTRY_BUDGET_CAP,
        fuse_votes,
        votes_from_brain_outputs,
        StrategyVote,
    )
except ImportError:
    # Fallback minimal if package path not mounted — still route safely
    GLOBAL_ENTRY_BUDGET_CAP = 0.85
    fuse_votes = None  # type: ignore
    votes_from_brain_outputs = None  # type: ignore
    StrategyVote = None  # type: ignore


class OrchestratorRouter(BaseNode):
    """Route capital after multi-strategy fusion."""

    # --- Aggregated brain payloads (wire from parallel brain nodes) ---
    # Each item: {strategy|agent, decision, confidence, best_token?, actions?, ...}
    brain_outputs: list[dict[str, Any]] = []
    """Outputs from LIABrain, TP1, TP3, TP5, Contrarian (list of dicts)."""

    risk_output: dict[str, Any] | None = None
    """RiskAgent / RiskBrain output dict."""

    yield_output: dict[str, Any] | None = None
    """YieldAgent / YieldBrain output dict."""

    # --- Optional individual slots (if not using brain_outputs list) ---
    lia_brain: dict[str, Any] | None = None
    tp1: dict[str, Any] | None = None
    tp3: dict[str, Any] | None = None
    tp5: dict[str, Any] | None = None
    contrarian: dict[str, Any] | None = None
    circuit: dict[str, Any] | None = None

    # --- Portfolio / regime ---
    deployable_usd: float = 0.0
    total_portfolio_usd: float = 0.0
    gs_regime: str = "NEUTRAL"  # RISK_ON | RISK_OFF | NEUTRAL
    balance_guard_status: str = "OK"  # OK | WARNING | BLOCKED
    circuit_breaker_active: bool = False
    hatom_health_factor: float = 999.0

    # --- Tunables ---
    max_entry_budget_pct: float = 0.85
    strong_buy_min_conf: float = 0.75
    strong_buy_min_strategies: int = 2

    class Outputs(BaseNode.Outputs):
        route: str
        """TRADE | STRONG_BUY | YIELD_ONLY | BLOCKED"""
        mode: str
        """Symbiosis mode (TRADE|YIELD_ONLY|BLOCKED|MIXED)"""
        approved_actions: list[dict[str, Any]]
        rejected: list[dict[str, Any]]
        budget_map: dict[str, float]
        total_budget_pct: float
        conflicts_resolved: list[str]
        risk_status: str
        notes: list[str]
        executor_actions: list[dict[str, Any]]
        """Flattened actions ready for UniversalExecutor.actions"""
        buy_count: int
        sell_count: int
        summary: str

    class Display(BaseNode.Display):
        icon = "vellum:icon:function"
        color = "blue"

    def run(self) -> "OrchestratorRouter.Outputs":
        self._log("INFO", "🧭 OrchestratorRouter — fusion multi-stratégies...")

        # --- Hard guards upstream of symbiosis ---
        if str(self.balance_guard_status).upper() == "BLOCKED":
            return self._blocked("BalanceGuard BLOCKED")
        if bool(self.circuit_breaker_active):
            return self._blocked("circuit_breaker_active")
        if float(self.hatom_health_factor or 999) < 1.5:
            return self._blocked(f"HF critical={self.hatom_health_factor}")

        outputs = self._collect_outputs()
        deployable = float(self.deployable_usd or 0)
        if deployable <= 0 and self.total_portfolio_usd:
            deployable = float(self.total_portfolio_usd) * 0.5

        if fuse_votes is None or votes_from_brain_outputs is None:
            self._log("ERROR", "symbiosis module unavailable — YIELD_ONLY safe fallback")
            return self._yield_only("symbiosis_import_failed")

        votes = votes_from_brain_outputs(outputs)
        # Ensure Risk is present even if only passed via risk_output
        if self.risk_output and not any(v.strategy == "RiskAgent" for v in votes):
            votes.extend(votes_from_brain_outputs([dict(self.risk_output, agent="RiskAgent")]))

        result = fuse_votes(
            votes,
            deployable_usd=max(deployable, 0.0),
            gs_regime=str(self.gs_regime or "NEUTRAL"),
            max_entry_budget_pct=float(self.max_entry_budget_pct or GLOBAL_ENTRY_BUDGET_CAP),
        )

        route = self._map_route(result)
        executor_actions = self._to_executor_actions(result.approved_actions)
        buys = [a for a in result.approved_actions if str(a.get("type", "")).upper() == "BUY"]
        sells = [a for a in result.approved_actions if str(a.get("type", "")).upper() == "SELL"]

        summary = (
            f"route={route} mode={result.mode} buys={len(buys)} sells={len(sells)} "
            f"budget={result.total_budget_pct:.0%} rejected={len(result.rejected)} "
            f"risk={result.risk_status}"
        )
        self._log("INFO", f"🧭 {summary}")

        return self.Outputs(
            route=route,
            mode=result.mode,
            approved_actions=result.approved_actions,
            rejected=result.rejected,
            budget_map=result.budget_map,
            total_budget_pct=result.total_budget_pct,
            conflicts_resolved=result.conflicts_resolved,
            risk_status=result.risk_status,
            notes=result.notes,
            executor_actions=executor_actions,
            buy_count=len(buys),
            sell_count=len(sells),
            summary=summary,
        )

    # ------------------------------------------------------------------
    def _collect_outputs(self) -> list[dict[str, Any]]:
        out: list[dict[str, Any]] = []
        if self.brain_outputs:
            out.extend(list(self.brain_outputs))

        named = [
            ("LIABrain", self.lia_brain),
            ("TP1", self.tp1),
            ("TP3", self.tp3),
            ("TP5", self.tp5),
            ("Contrarian", self.contrarian),
            ("CIRCUIT_1PCT", self.circuit),
            ("RiskAgent", self.risk_output),
            ("YieldAgent", self.yield_output),
        ]
        for label, payload in named:
            if not payload:
                continue
            d = dict(payload)
            d.setdefault("strategy", d.get("strategy") or d.get("agent") or label)
            d.setdefault("agent", label)
            # Avoid duplicates if already in brain_outputs with same strategy label
            out.append(d)

        # Merge exit_actions into SELL-style if present on brain dicts
        enriched: list[dict[str, Any]] = []
        for d in out:
            d = dict(d)
            exits = list(d.get("exit_actions") or [])
            if exits and str(d.get("decision", "")).upper() not in ("SELL", "BLOCK"):
                # Keep original + synthetic sell vote if exits pending
                enriched.append(d)
                for ex in exits:
                    enriched.append(
                        {
                            "strategy": d.get("strategy") or d.get("agent") or "EXIT",
                            "decision": "SELL",
                            "confidence": d.get("confidence", 80),
                            "token": ex.get("token") or ex.get("token_id") or "",
                            "amount_usd": ex.get("amount_usd", 0),
                            "actions": [ex],
                            "reasoning": ex.get("reason", "exit_action"),
                        }
                    )
            else:
                # Flatten exit_actions into actions for sell decisions
                if exits and str(d.get("decision", "")).upper() == "SELL":
                    acts = list(d.get("actions") or [])
                    acts.extend(exits)
                    d["actions"] = acts
                enriched.append(d)
        return enriched

    def _map_route(self, result: Any) -> str:
        mode = str(getattr(result, "mode", "YIELD_ONLY")).upper()
        if mode == "BLOCKED" or str(getattr(result, "risk_status", "")) == "BLOCK":
            return "BLOCKED"

        buys = [
            a
            for a in (getattr(result, "approved_actions", None) or [])
            if str(a.get("type", "")).upper() == "BUY"
        ]
        if not buys:
            return "YIELD_ONLY"

        confs = [float(a.get("confidence") or 0) for a in buys]
        avg_conf = sum(confs) / len(confs) if confs else 0.0
        # confidence may already be 0-1
        if avg_conf > 1.0:
            avg_conf = avg_conf / 100.0

        strategies = {str(a.get("strategy")) for a in buys}
        if (
            avg_conf >= float(self.strong_buy_min_conf)
            and len(strategies) >= int(self.strong_buy_min_strategies)
        ):
            return "STRONG_BUY"
        return "TRADE"

    def _to_executor_actions(self, approved: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Normalize to UniversalExecutor action shape."""
        out: list[dict[str, Any]] = []
        for a in approved:
            t = str(a.get("type", "")).upper()
            if t == "BUY":
                out.append(
                    {
                        "type": f"BUY_{str(a.get('token') or 'TOKEN').upper().split('-')[0]}",
                        "token_id": a.get("token") or a.get("token_id") or "",
                        "amount_usd": float(a.get("amount_usd") or 0),
                        "strategy": a.get("strategy"),
                        "reason": a.get("reason"),
                        "sl_pct": a.get("sl_pct"),
                        "tp_pct": a.get("tp_pct"),
                    }
                )
            elif t == "SELL":
                out.append(
                    {
                        "type": f"SELL_{str(a.get('token') or 'TOKEN').upper().split('-')[0]}",
                        "token_id": a.get("token") or "",
                        "amount_usd": float(a.get("amount_usd") or 0),
                        "strategy": a.get("strategy"),
                        "reason": a.get("reason"),
                    }
                )
            elif t in ("HATOM_SUPPLY", "YIELD", "PARK_STABLE"):
                out.append(
                    {
                        "type": "stake" if t == "HATOM_SUPPLY" else t,
                        "amount_usd": float(a.get("amount_usd") or 0),
                        "strategy": a.get("strategy"),
                        "reason": a.get("reason"),
                    }
                )
            elif t in ("DELEVERAGE", "HALT"):
                out.append(dict(a))
            else:
                out.append(dict(a))
        return out

    def _blocked(self, reason: str) -> "OrchestratorRouter.Outputs":
        self._log("WARN", f"🧭 BLOCKED — {reason}")
        return self.Outputs(
            route="BLOCKED",
            mode="BLOCKED",
            approved_actions=[{"type": "HALT", "reason": reason}],
            rejected=[],
            budget_map={},
            total_budget_pct=0.0,
            conflicts_resolved=[],
            risk_status="BLOCK",
            notes=[reason],
            executor_actions=[],
            buy_count=0,
            sell_count=0,
            summary=f"route=BLOCKED reason={reason}",
        )

    def _yield_only(self, reason: str) -> "OrchestratorRouter.Outputs":
        return self.Outputs(
            route="YIELD_ONLY",
            mode="YIELD_ONLY",
            approved_actions=[],
            rejected=[],
            budget_map={},
            total_budget_pct=0.0,
            conflicts_resolved=[],
            risk_status="OK",
            notes=[reason],
            executor_actions=[],
            buy_count=0,
            sell_count=0,
            summary=f"route=YIELD_ONLY reason={reason}",
        )

    def _log(self, severity: str, message: str) -> None:
        try:
            self._context.emit_log_event(severity=severity, message=message)
        except Exception:
            print(f"[{severity}] {message}")
