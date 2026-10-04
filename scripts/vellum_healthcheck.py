#!/usr/bin/env python3
"""
Vellum healthcheck — soft-import map of pipeline modules.
Never enables live trading. Safe to run in CI / Vellum bootstrap.

  PYTHONPATH=. python -m scripts.vellum_healthcheck
"""
from __future__ import annotations

import importlib
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

# Ensure paper default
os.environ.setdefault("LIA_LIVE_TRADING", "0")
os.environ.setdefault("CHAIN", "1")

REQUIRED = [
    "lia.vellum.pipeline",
    "lia.vellum.next_run",
    "lia.vellum.production_run",
    "lia.vellum.publish_data_for_frontend",
]

SOFT = [
    "lia.oracles.publish",
    "lia.gas.publish",
    "lia.board.publish",
    "lia.signals.social_intel",
    "lia.agents.mvx_agent",
    "lia.circuit.desk_debate",
    "lia.circuit.trading_modes",
    "lia.vellum.guardian_hook",
    "lia.circuit.trading_stack",
    "lia.vellum.live_cycle",
    "lia.venues.hatom",
    "lia.executor.universal",
    "lia.guardian",
    "lia.claude_agent",
    "lia.security.go_live_gates",
]


def _try(mod: str) -> dict:
    try:
        importlib.import_module(mod)
        return {"module": mod, "ok": True, "error": None}
    except Exception as e:
        return {"module": mod, "ok": False, "error": f"{type(e).__name__}: {e}"}


def main() -> dict:
    req = [_try(m) for m in REQUIRED]
    soft = [_try(m) for m in SOFT]
    report = {
        "ts": __import__("time").strftime("%Y-%m-%dT%H:%M:%SZ", __import__("time").gmtime()),
        "cwd": str(Path.cwd()),
        "root": str(ROOT),
        "LIA_LIVE_TRADING": os.environ.get("LIA_LIVE_TRADING", "0"),
        "CHAIN": os.environ.get("CHAIN", "1"),
        "required": req,
        "soft": soft,
        "required_ok": all(r["ok"] for r in req),
        "soft_ok_count": sum(1 for s in soft if s["ok"]),
        "soft_total": len(soft),
        "hint": "Missing soft modules → pipeline steps soft-fail; fix imports or stub before relying on that step",
    }
    out = ROOT / "data" / "vellum_healthcheck.json"
    try:
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(report, indent=2), encoding="utf-8")
    except OSError:
        pass
    print(json.dumps(report, indent=2))
    # exit 0 even if soft fails — only hard-fail if required missing
    if not report["required_ok"]:
        sys.exit(2)
    return report


if __name__ == "__main__":
    main()
