"""
TCA session scheduler — slots + access check (no capital side-effects).

  PYTHONPATH=. python -m lia.tca.scheduler --status
  PYTHONPATH=. python -m lia.tca.scheduler --publish-today
"""
from __future__ import annotations

import argparse
import json
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data" / "tca"
PARIS = ZoneInfo("Europe/Paris")

# Default dual daily windows (local Paris)
SLOTS = [
    {"id": "slot_a", "start_h": 18, "end_h": 20, "label": "Evening Masterclass A"},
    {"id": "slot_b", "start_h": 20, "end_h": 22, "label": "Evening Masterclass B"},
]


def _now_paris() -> datetime:
    return datetime.now(tz=PARIS)


def current_slot(now: datetime | None = None) -> dict[str, Any] | None:
    n = now or _now_paris()
    for s in SLOTS:
        if s["start_h"] <= n.hour < s["end_h"]:
            return {**s, "active": True, "local_time": n.isoformat()}
    return None


def next_slot(now: datetime | None = None) -> dict[str, Any]:
    n = now or _now_paris()
    for s in SLOTS:
        if n.hour < s["start_h"]:
            return {**s, "active": False, "starts_today": True}
    # tomorrow slot_a
    return {**SLOTS[0], "active": False, "starts_today": False}


def check_access(
    *,
    mode: str = "public",
    has_pack: bool = False,
    allowlisted: bool = False,
) -> dict[str, Any]:
    """Class entry gate — does not modify balances."""
    if mode == "public":
        return {"ok": True, "level": "lobby_or_open"}
    if mode == "pack_holder":
        return {"ok": bool(has_pack), "level": "pack" if has_pack else "denied"}
    if mode == "allowlist":
        return {"ok": bool(allowlisted), "level": "allowlist" if allowlisted else "denied"}
    return {"ok": False, "level": "denied", "reason": "unknown_mode"}


def publish_today(*, professor_id: str = "leonardo", lesson_id: str = "leo_w1_sfumato") -> dict[str, Any]:
    n = _now_paris()
    active = current_slot(n)
    payload = {
        "schema": "tca_sessions_today/v1",
        "date": n.strftime("%Y-%m-%d"),
        "timezone": "Europe/Paris",
        "slots": SLOTS,
        "active_slot": active,
        "next_slot": next_slot(n),
        "default_professor": professor_id,
        "default_lesson": lesson_id,
        "access_default": "public",  # tighten to pack_holder when packs live
        "updated": datetime.now(tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "event": "CLASS_STANDBY" if not active else "CLASS_LIVE",
    }
    DATA.mkdir(parents=True, exist_ok=True)
    path = DATA / "sessions_today.json"
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    for dest in (
        ROOT / "apps" / "frontend" / "public" / "data" / "tca" / "sessions_today.json",
        ROOT / "docs" / "data" / "tca" / "sessions_today.json",
    ):
        try:
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        except OSError:
            pass
    return payload


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--status", action="store_true")
    ap.add_argument("--publish-today", action="store_true")
    args = ap.parse_args()
    if args.publish_today:
        print(json.dumps(publish_today(), indent=2))
    else:
        n = _now_paris()
        print(
            json.dumps(
                {
                    "now_paris": n.isoformat(),
                    "active": current_slot(n),
                    "next": next_slot(n),
                    "access_demo": check_access(mode="public"),
                },
                indent=2,
            )
        )


if __name__ == "__main__":
    main()
