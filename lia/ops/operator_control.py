"""
Human Ultimate Safeguard — Pause / Resume LIA hot-wallet execution.

Architecture rule: LIA executes; the Human holds master control.
Any executor (Vellum, mvx_agent, access minter live) MUST call
`assert_execution_allowed()` before signing a TX.

Usage:
  python -m lia.ops.operator_control status
  python -m lia.ops.operator_control pause --reason "manual review"
  python -m lia.ops.operator_control resume
"""
from __future__ import annotations

import argparse
import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
CONTROL_PATH = ROOT / "data" / "operator_control.json"


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load_control() -> dict[str, Any]:
    if not CONTROL_PATH.exists():
        return {
            "version": 1,
            "paused": False,
            "reason": "",
            "resume_requires": "human_operator",
        }
    return json.loads(CONTROL_PATH.read_text(encoding="utf-8"))


def save_control(data: dict[str, Any]) -> None:
    data["updated"] = _now()
    CONTROL_PATH.parent.mkdir(parents=True, exist_ok=True)
    CONTROL_PATH.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def is_paused() -> bool:
    return bool(load_control().get("paused"))


def assert_execution_allowed(*, context: str = "") -> None:
    """Raise RuntimeError if human paused or env force-pause."""
    if os.environ.get("LIA_OPERATOR_PAUSE", "").strip() in ("1", "true", "TRUE"):
        raise RuntimeError(f"OPERATOR_PAUSE env set — blocked ({context})")
    c = load_control()
    if c.get("paused"):
        raise RuntimeError(
            f"OPERATOR_PAUSED: {c.get('reason') or 'no reason'} — blocked ({context})"
        )


def pause(reason: str = "human_manual", by: str = "operator") -> dict[str, Any]:
    c = load_control()
    c["paused"] = True
    c["reason"] = reason
    c["paused_by"] = by
    c["paused_at"] = _now()
    save_control(c)
    return c


def resume(by: str = "operator") -> dict[str, Any]:
    c = load_control()
    c["paused"] = False
    c["reason"] = ""
    c["resumed_by"] = by
    c["resumed_at"] = _now()
    c["paused_by"] = None
    c["paused_at"] = None
    save_control(c)
    return c


def status() -> dict[str, Any]:
    c = load_control()
    live = os.environ.get("LIA_LIVE_TRADING", "0")
    return {
        **c,
        "execution_allowed": not bool(c.get("paused")),
        "LIA_LIVE_TRADING": live,
        "env_operator_pause": os.environ.get("LIA_OPERATOR_PAUSE", "0"),
    }


def main() -> int:
    ap = argparse.ArgumentParser(description="Human Ultimate Safeguard")
    ap.add_argument("cmd", choices=["status", "pause", "resume"])
    ap.add_argument("--reason", default="human_manual")
    ap.add_argument("--by", default="operator")
    args = ap.parse_args()
    if args.cmd == "status":
        print(json.dumps(status(), indent=2))
    elif args.cmd == "pause":
        print(json.dumps(pause(args.reason, args.by), indent=2))
    else:
        print(json.dumps(resume(args.by), indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
