"""
Hard-lock kill-switch for Guardian.
Persists a simple state file so ops / drawdown can freeze live path.
"""
from __future__ import annotations

import json
import os
import time
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
STATE = ROOT / "data" / "kill_switch.json"


@dataclass
class KillSwitch:
    locked: bool = False
    reason: str = ""
    at: str = ""

    @property
    def is_locked(self) -> bool:
        return bool(self.locked)

    def trigger(self, reason: str) -> None:
        self.locked = True
        self.reason = reason or "manual"
        self.at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        # Force env offline for this process
        os.environ["LIA_LIVE_TRADING"] = "0"
        self._persist()
        self._log_critical()

    def clear(self, ops_ack: str = "") -> None:
        """Only ops should clear — requires non-empty ack string."""
        if not ops_ack:
            raise ValueError("ops_ack required to clear kill-switch")
        self.locked = False
        self.reason = f"cleared:{ops_ack}"
        self.at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        self._persist()

    def _persist(self) -> None:
        STATE.parent.mkdir(parents=True, exist_ok=True)
        STATE.write_text(
            json.dumps(
                {
                    "locked": self.locked,
                    "reason": self.reason,
                    "at": self.at,
                    "event": "CRITICAL_STOP" if self.locked else "CLEAR",
                },
                indent=2,
            ),
            encoding="utf-8",
        )

    def _log_critical(self) -> None:
        log = ROOT / "data" / "system_events.jsonl"
        log.parent.mkdir(parents=True, exist_ok=True)
        with log.open("a", encoding="utf-8") as f:
            f.write(
                json.dumps(
                    {
                        "level": "CRITICAL_STOP",
                        "reason": self.reason,
                        "at": self.at,
                        "LIA_LIVE_TRADING": 0,
                    }
                )
                + "\n"
            )


_ks: KillSwitch | None = None


def get_kill_switch() -> KillSwitch:
    global _ks
    if _ks is not None:
        return _ks
    ks = KillSwitch()
    if STATE.is_file():
        try:
            d = json.loads(STATE.read_text(encoding="utf-8"))
            ks.locked = bool(d.get("locked"))
            ks.reason = str(d.get("reason") or "")
            ks.at = str(d.get("at") or "")
        except Exception:
            pass
    _ks = ks
    return ks
