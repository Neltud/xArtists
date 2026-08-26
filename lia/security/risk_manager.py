"""
Off-chain Risk Manager — mirrors contracts/risk-manager emergency lockdown.

Drawdown > max_allowed → system LOCKED → LIA agents must cease size-up.
Does not send chain TX; persists state for Commander / production_run.
"""
from __future__ import annotations

import json
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Optional

ROOT = Path(__file__).resolve().parents[2]
STATE_PATH = ROOT / "data" / "risk_manager_state.json"

# Default 15% drawdown of peak equity (product example)
DEFAULT_MAX_DRAWDOWN = 0.15


def _ts() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


@dataclass
class SafetyVerdict:
    ok: bool
    locked: bool
    event: Optional[str]
    current_drawdown: float
    max_allowed: float
    reason: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "ok": self.ok,
            "locked": self.locked,
            "event": self.event,
            "current_drawdown": self.current_drawdown,
            "max_allowed": self.max_allowed,
            "reason": self.reason,
        }


class RiskManager:
    """In-memory + optional disk lock (fail-closed once locked until ops reset)."""

    def __init__(
        self,
        max_drawdown: float = DEFAULT_MAX_DRAWDOWN,
        *,
        persist: bool = True,
        state_path: Path | None = None,
    ):
        self.max_drawdown = float(max_drawdown)
        self.persist = persist
        self.state_path = state_path or STATE_PATH
        self._locked = False
        self._last_event: str | None = None
        if persist:
            self._load()

    def _load(self) -> None:
        if not self.state_path.is_file():
            return
        try:
            data = json.loads(self.state_path.read_text(encoding="utf-8"))
            self._locked = bool(data.get("locked"))
            self._last_event = data.get("last_event")
            if data.get("max_drawdown") is not None:
                self.max_drawdown = float(data["max_drawdown"])
        except Exception:
            pass

    def _save(self, extra: dict[str, Any] | None = None) -> None:
        if not self.persist:
            return
        payload = {
            "updated": _ts(),
            "locked": self._locked,
            "max_drawdown": self.max_drawdown,
            "last_event": self._last_event,
            "module": "lia.security.risk_manager",
            "paper_note": "Off-chain until Risk_Manager.wasm deployed",
        }
        if extra:
            payload.update(extra)
        try:
            self.state_path.parent.mkdir(parents=True, exist_ok=True)
            self.state_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
            for dest in (
                ROOT / "apps" / "frontend" / "public" / "data" / "risk_manager_state.json",
                ROOT / "docs" / "data" / "risk_manager_state.json",
            ):
                try:
                    dest.parent.mkdir(parents=True, exist_ok=True)
                    dest.write_text(json.dumps(payload, indent=2), encoding="utf-8")
                except OSError:
                    pass
        except OSError:
            pass

    @property
    def locked(self) -> bool:
        return self._locked

    def trigger_emergency_lock(self, reason: str = "drawdown") -> None:
        self._locked = True
        self._last_event = "SYSTEM_LOCKDOWN: All agents commanded to cease operations."
        self._save({"lock_reason": reason, "event": "EMERGENCY_LOCKDOWN"})

    def check_safety_status(self, current_drawdown: float) -> SafetyVerdict:
        """Primary API — mirrors SC check_safety_status."""
        dd = float(current_drawdown)
        if self._locked:
            return SafetyVerdict(
                ok=False,
                locked=True,
                event=self._last_event or "ALREADY_LOCKED",
                current_drawdown=dd,
                max_allowed=self.max_drawdown,
                reason="system_locked",
            )
        if dd > self.max_drawdown:
            self.trigger_emergency_lock(reason=f"drawdown={dd:.4f}>{self.max_drawdown}")
            return SafetyVerdict(
                ok=False,
                locked=True,
                event="CRITICAL_FAILURE: Drawdown limit exceeded. Locking treasury.",
                current_drawdown=dd,
                max_allowed=self.max_drawdown,
                reason="drawdown_exceeded",
            )
        v = SafetyVerdict(
            ok=True,
            locked=False,
            event=None,
            current_drawdown=dd,
            max_allowed=self.max_drawdown,
            reason="ok",
        )
        self._save({"current_drawdown": dd})
        return v

    def check_safety(self, current_drawdown: float, max_limit: float | None = None) -> bool:
        """Compact form — returns True if still safe."""
        limit = self.max_drawdown if max_limit is None else float(max_limit)
        prev = self.max_drawdown
        self.max_drawdown = limit
        v = self.check_safety_status(current_drawdown)
        self.max_drawdown = prev
        return v.ok

    def ops_reset_unlock(self, confirm: str = "") -> dict[str, Any]:
        """Manual ops only — never auto."""
        if confirm != "UNLOCK_RISK_MANAGER":
            return {"ok": False, "error": "require confirm=UNLOCK_RISK_MANAGER"}
        self._locked = False
        self._last_event = "OPS_MANUAL_UNLOCK"
        self._save({"event": "OPS_MANUAL_UNLOCK"})
        return {"ok": True, "locked": False}


def check_drawdown(current_drawdown: float, max_drawdown: float = DEFAULT_MAX_DRAWDOWN) -> dict[str, Any]:
    """Stateless convenience for pipeline."""
    rm = RiskManager(max_drawdown=max_drawdown, persist=True)
    return rm.check_safety_status(current_drawdown).to_dict()


if __name__ == "__main__":
    print(json.dumps(check_drawdown(0.10), indent=2))
    print(json.dumps(check_drawdown(0.20), indent=2))
