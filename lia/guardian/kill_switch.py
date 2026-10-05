"""
Hard-lock kill-switch + Black Swan (flash-crash) detector.
"""
from __future__ import annotations

import json
import os
import time
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
STATE = ROOT / "data" / "kill_switch.json"
PRICE_HIST = ROOT / "data" / "egld_price_ticks.json"
API = "https://api.multiversx.com"

# Flash crash: drop > threshold within window
FLASH_DROP_PCT = 0.08  # 8%
FLASH_WINDOW_SEC = 15 * 60  # 15 minutes


@dataclass
class KillSwitch:
    locked: bool = False
    reason: str = ""
    at: str = ""
    event_type: str = ""

    @property
    def is_locked(self) -> bool:
        return bool(self.locked)

    def trigger(self, reason: str, *, event_type: str = "CRITICAL_STOP") -> None:
        self.locked = True
        self.reason = reason or "manual"
        self.event_type = event_type
        self.at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        os.environ["LIA_LIVE_TRADING"] = "0"
        self._persist()
        self._log_critical()

    def clear(self, ops_ack: str = "") -> None:
        if not ops_ack:
            raise ValueError("ops_ack required to clear kill-switch")
        self.locked = False
        self.reason = f"cleared:{ops_ack}"
        self.event_type = "CLEAR"
        self.at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        self._persist()

    def _persist(self) -> None:
        STATE.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "locked": self.locked,
            "reason": self.reason,
            "at": self.at,
            "event": self.event_type or ("CRITICAL_STOP" if self.locked else "CLEAR"),
            "ui_flag": "CRITICAL_STOP" if self.locked else "OK",
        }
        STATE.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        for dest in (
            ROOT / "apps" / "frontend" / "public" / "data" / "kill_switch.json",
            ROOT / "docs" / "data" / "kill_switch.json",
        ):
            try:
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_text(json.dumps(payload, indent=2), encoding="utf-8")
            except OSError:
                pass

    def _log_critical(self) -> None:
        log = ROOT / "data" / "system_events.jsonl"
        log.parent.mkdir(parents=True, exist_ok=True)
        with log.open("a", encoding="utf-8") as f:
            f.write(
                json.dumps(
                    {
                        "level": self.event_type or "CRITICAL_STOP",
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
            ks.event_type = str(d.get("event") or "")
        except Exception:
            pass
    _ks = ks
    return ks


def _fetch_egld_usd() -> float | None:
    try:
        req = urllib.request.Request(
            f"{API}/economics", headers={"User-Agent": "xArtists-kill-switch/1.0"}
        )
        with urllib.request.urlopen(req, timeout=12) as r:
            d = json.loads(r.read().decode())
            px = float(d.get("price") or 0)
            return px if px > 0 else None
    except Exception:
        return None


def check_flash_crash(
    *,
    drop_pct: float = FLASH_DROP_PCT,
    window_sec: int = FLASH_WINDOW_SEC,
) -> dict[str, Any]:
    """
    Record price tick; if drop from peak in window exceeds threshold → Black Swan lock.
    """
    now = time.time()
    px = _fetch_egld_usd()
    ticks: list[dict[str, Any]] = []
    if PRICE_HIST.is_file():
        try:
            ticks = json.loads(PRICE_HIST.read_text(encoding="utf-8"))
            if not isinstance(ticks, list):
                ticks = []
        except Exception:
            ticks = []
    if px is not None:
        ticks.append({"t": now, "px": px})
    # keep 2h
    ticks = [x for x in ticks if now - float(x.get("t") or 0) < 7200][-200:]
    PRICE_HIST.parent.mkdir(parents=True, exist_ok=True)
    PRICE_HIST.write_text(json.dumps(ticks), encoding="utf-8")

    window = [x for x in ticks if now - float(x.get("t") or 0) <= window_sec]
    result: dict[str, Any] = {
        "px": px,
        "window_n": len(window),
        "triggered": False,
        "drop_pct": None,
    }
    if len(window) < 2 or px is None:
        return result
    peak = max(float(x["px"]) for x in window)
    if peak <= 0:
        return result
    drop = (peak - px) / peak
    result["drop_pct"] = round(drop, 6)
    result["peak"] = peak
    if drop >= drop_pct:
        ks = get_kill_switch()
        reason = f"black_swan_flash_drop_{drop:.2%}_in_{window_sec}s_peak={peak}_now={px}"
        ks.trigger(reason, event_type="BLACK_SWAN")
        result["triggered"] = True
        result["reason"] = reason
    return result


if __name__ == "__main__":
    print(json.dumps({"kill": get_kill_switch().__dict__, "flash": check_flash_crash()}, indent=2))
