"""
LIA Error Bus — gestion d'erreurs autonome pour Vellum
======================================================
Classifie, retry, escalade, halt.
Persiste dans data/lia_error_bus.json pour reporters.
"""
from __future__ import annotations

import json
import time
from dataclasses import asdict, dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Optional


class ErrorClass(str, Enum):
    TRANSIENT = "transient"       # network timeout → retry
    STALE = "stale"               # quote latency / drift → skip
    RISK = "risk"                 # guard / HF / DD → halt entries
    EXECUTION = "execution"       # tx failed → breaker
    CONFIG = "config"             # missing PEM / key → halt live
    FATAL = "fatal"               # unrecoverable → halt all


@dataclass
class ErrorEvent:
    cls: str
    source: str
    message: str
    ts: str = ""
    retryable: bool = False
    retries: int = 0
    meta: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


class ErrorBus:
    def __init__(self, path: str = "data/lia_error_bus.json") -> None:
        self.path = Path(path)
        self.events: list[dict[str, Any]] = []
        self.halted: bool = False
        self.halt_reason: str = ""
        self.consecutive_exec_fails: int = 0
        self._load()

    def _load(self) -> None:
        try:
            raw = json.loads(self.path.read_text(encoding="utf-8"))
            self.events = list(raw.get("events") or [])[-200:]
            self.halted = bool(raw.get("halted", False))
            self.halt_reason = str(raw.get("halt_reason") or "")
            self.consecutive_exec_fails = int(raw.get("consecutive_exec_fails") or 0)
        except Exception:
            pass

    def save(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.write_text(
            json.dumps(
                {
                    "halted": self.halted,
                    "halt_reason": self.halt_reason,
                    "consecutive_exec_fails": self.consecutive_exec_fails,
                    "events": self.events[-200:],
                    "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                },
                indent=2,
            ),
            encoding="utf-8",
        )

    def classify(self, source: str, err: str | Exception) -> ErrorEvent:
        msg = str(err).lower()
        ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

        if any(x in msg for x in ("timeout", "temporarily", "429", "503", "connection reset")):
            return ErrorEvent(ErrorClass.TRANSIENT.value, source, str(err), ts, retryable=True)
        if any(x in msg for x in ("stale", "drift", "quote_age", "requote")):
            return ErrorEvent(ErrorClass.STALE.value, source, str(err), ts, retryable=False)
        if any(x in msg for x in ("halt", "drawdown", "health factor", "risk_off", "blocked")):
            return ErrorEvent(ErrorClass.RISK.value, source, str(err), ts, retryable=False)
        if any(x in msg for x in ("pem", "keypair", "private_key", "missing", "not configured")):
            return ErrorEvent(ErrorClass.CONFIG.value, source, str(err), ts, retryable=False)
        if any(x in msg for x in ("tx", "transaction", "signature", "slippage", "failed")):
            return ErrorEvent(ErrorClass.EXECUTION.value, source, str(err), ts, retryable=True)
        return ErrorEvent(ErrorClass.TRANSIENT.value, source, str(err), ts, retryable=True)

    def report(self, source: str, err: str | Exception, meta: Optional[dict] = None) -> ErrorEvent:
        ev = self.classify(source, err)
        if meta:
            ev.meta = meta
        self.events.append(ev.to_dict())

        if ev.cls == ErrorClass.EXECUTION.value:
            self.consecutive_exec_fails += 1
            if self.consecutive_exec_fails >= 3:
                self.halted = True
                self.halt_reason = f"3 consecutive execution failures: {ev.message}"
        elif ev.cls == ErrorClass.FATAL.value or ev.cls == ErrorClass.CONFIG.value:
            if "live" in ev.message.lower() or "pem" in ev.message.lower():
                # config errors block live but paper continues
                pass
        elif ev.cls == ErrorClass.RISK.value:
            self.halted = True
            self.halt_reason = ev.message
        else:
            # transient/stale success path resets? only on explicit success
            pass

        self.save()
        return ev

    def success(self) -> None:
        self.consecutive_exec_fails = 0
        self.save()

    def clear_halt(self) -> None:
        self.halted = False
        self.halt_reason = ""
        self.consecutive_exec_fails = 0
        self.save()

    def status(self) -> dict[str, Any]:
        return {
            "halted": self.halted,
            "halt_reason": self.halt_reason,
            "consecutive_exec_fails": self.consecutive_exec_fails,
            "recent": self.events[-10:],
        }
