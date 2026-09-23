"""
Mx8004Sprint — Vellum node
==========================
Chaque sprint / production_run : appelle scripts/register_mx8004_lia.py en DRY_RUN=1.
PEM uniquement via secrets Vellum. Jamais de live register ici.
"""
from __future__ import annotations

from typing import Any

from vellum.workflows import BaseNode

from lia.vellum.mx8004_sprint import run_mx8004_sprint


class Mx8004Sprint(BaseNode):
    dry_run: bool = True

    class Outputs(BaseNode.Outputs):
        ok: bool
        dry_run: bool
        registered: bool
        summary: str
        full: dict[str, Any]

    class Display(BaseNode.Display):
        icon = "vellum:icon:function"
        color = "amber"

    def run(self) -> "Mx8004Sprint.Outputs":
        self._log("INFO", "MX-8004 sprint DRY_RUN (Identity / First 100 path)")
        result = run_mx8004_sprint(dry_run=bool(self.dry_run))
        summary = str(result.get("summary") or "mx8004 sprint")
        self._log("INFO", summary)
        return self.Outputs(
            ok=bool(result.get("ok")),
            dry_run=bool(result.get("dry_run", True)),
            registered=bool(result.get("registered")),
            summary=summary,
            full=result,
        )

    def _log(self, severity: str, message: str) -> None:
        self._context.emit_log_event(severity=severity, message=message)
