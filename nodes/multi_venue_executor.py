"""
MultiVenueExecutor — Vellum node
Routes LIA actions to MultiversX / Jupiter / Hyperliquid.
Paper by default; live gated by env flags per venue.
"""
from __future__ import annotations

from typing import Any

from vellum.workflows import BaseNode

from lia.executor.multi_venue import MultiVenueExecutor


class MultiVenueExecutorNode(BaseNode):
    force_mode: str = "paper"  # paper | live | auto
    actions: list[dict[str, Any]] = []
    default_venue: str = "auto"

    class Outputs(BaseNode.Outputs):
        executed: list[dict[str, Any]]
        failed: list[dict[str, Any]]
        success_count: int
        fail_count: int
        venues_used: list[str]
        health: dict[str, Any]
        summary: str

    class Display(BaseNode.Display):
        icon = "vellum:icon:function"
        color = "purple"

    def run(self) -> "MultiVenueExecutorNode.Outputs":
        self._log("INFO", f"🌐 MultiVenueExecutor mode={self.force_mode} actions={len(self.actions)}")
        ex = MultiVenueExecutor()
        paper = self.force_mode == "paper" or (
            self.force_mode == "auto" and True  # auto stays paper unless explicitly live
        )
        if self.force_mode == "live":
            paper = False

        results = []
        for a in self.actions:
            act = dict(a)
            if self.default_venue != "auto" and not act.get("venue"):
                act["venue"] = self.default_venue
            results.append(ex.execute(act, force_paper=paper))

        executed = [r for r in results if r.get("ok")]
        failed = [r for r in results if not r.get("ok")]
        venues = sorted({str(r.get("venue") or "?") for r in results})

        summary = f"ok={len(executed)} fail={len(failed)} venues={venues} mode={'paper' if paper else 'live'}"
        self._log("INFO", f"🌐 {summary}")

        return self.Outputs(
            executed=executed,
            failed=failed,
            success_count=len(executed),
            fail_count=len(failed),
            venues_used=venues,
            health=ex.health(),
            summary=summary,
        )

    def _log(self, severity: str, message: str) -> None:
        self._context.emit_log_event(severity=severity, message=message)
