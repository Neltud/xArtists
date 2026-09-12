#!/usr/bin/env python3
"""Executor stub — runs ON OPERATOR HOST with PEM.

Does NOT load keys in CI or public demos.
Reads latest unified plan and prints what would be signed.
Wire real signing only when GROK_LIVE_TRADING=1 and PEM path set.
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"


def latest_plan() -> dict | None:
    files = sorted(DATA.glob("unified_*.json"))
    if not files:
        # fallback analysis snapshot
        snap = DATA / "analysis_2026-09-12.json"
        if snap.exists():
            return json.loads(snap.read_text())
        return None
    return json.loads(files[-1].read_text())


def main() -> int:
    live = (os.environ.get("GROK_LIVE_TRADING") or "0") == "1"
    pem = (os.environ.get("GROK_WALLET_PEM_PATH") or "").strip()
    plan_doc = latest_plan()
    if not plan_doc:
        print("No plan found — run unified_orchestrator.py first", file=sys.stderr)
        return 2

    plan = plan_doc.get("plan") or plan_doc
    if isinstance(plan, list):
        step = plan[0] if plan else {}
    else:
        step = plan if isinstance(plan, dict) else {}

    print(json.dumps({
        "agent": "GrokyversX-executor-stub",
        "live_flag": live,
        "pem_configured": bool(pem and Path(pem).expanduser().exists()),
        "step": step,
        "message": (
            "Dry-run only in repo/sandbox. "
            "On operator host: implement sign+send for swap/booster using PEM."
            if not (live and pem)
            else "LIVE armed — implement chain calls here (not in public CI)."
        ),
    }, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
