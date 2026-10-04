"""
Publish data/lia_hub_status.json for the public LIA Hub (paper metrics).

Called from production_run / next_run optionally, or standalone:

  PYTHONPATH=. LIA_LIVE_TRADING=0 python -m lia.vellum.publish_lia_hub_status

Never sets live trading. Aggregates local paper artifacts if present.
"""
from __future__ import annotations

import json
import os
import time
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"


def _ts() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def _read_json(name: str) -> dict[str, Any] | None:
    path = DATA / name
    if not path.is_file():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def build_status() -> dict[str, Any]:
    os.environ.setdefault("LIA_LIVE_TRADING", "0")
    last = _read_json("vellum_last_run.json") or {}
    paper = _read_json("lia_paper_legs.json") or {}
    status = _read_json("lia_v6_status.json") or {}

    legs = paper.get("legs") if isinstance(paper, dict) else None
    if not isinstance(legs, list):
        legs = []

    wins = 0
    total = 0
    pnl = 0.0
    for leg in legs:
        if not isinstance(leg, dict):
            continue
        total += 1
        p = leg.get("pnl_usd")
        if p is None:
            p = leg.get("pnl")
        try:
            pv = float(p or 0)
        except (TypeError, ValueError):
            pv = 0.0
        pnl += pv
        if pv > 0:
            wins += 1

    summary = last.get("summary") if isinstance(last.get("summary"), dict) else {}
    orch = status.get("orchestrator") if isinstance(status.get("orchestrator"), dict) else {}

    out: dict[str, Any] = {
        "ts": _ts(),
        "paper": True,
        "LIA_LIVE_TRADING": 0,
        "shadow_pnl_usd": round(pnl, 4),
        "shadow_equity_usd": None,
        "win_rate": round(wins / total, 4) if total else None,
        "fills": total,
        "strategy": summary.get("mode") or orch.get("mode"),
        "confidence": None,
        "vellum_ok": summary.get("ok"),
        "guardian_allow": summary.get("guardian_allow"),
        "note": "Shadow / paper metrics for public hub — not live trading performance",
        "source": {
            "vellum_last_run": bool(last),
            "lia_paper_legs": bool(legs),
        },
    }
    return out


def publish() -> dict[str, Any]:
    payload = build_status()
    raw = json.dumps(payload, indent=2)
    targets = [
        DATA / "lia_hub_status.json",
        ROOT / "docs" / "data" / "lia_hub_status.json",
        ROOT / "apps" / "frontend" / "public" / "data" / "lia_hub_status.json",
    ]
    written: list[str] = []
    for dest in targets:
        try:
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(raw, encoding="utf-8")
            written.append(str(dest))
        except OSError:
            pass
    payload["written"] = written
    return payload


if __name__ == "__main__":
    print(json.dumps(publish(), indent=2))
