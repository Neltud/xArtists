"""xOrus production_run — paper operator entry (replaces lia.vellum.production_run).

Phases (paper only):
  1. safety seal
  2. swarm / decision board
  3. optional dual external briefs (Grok + ChatGPT) when provided by caller/CI
  4. mirror note for frontend public/data (caller commits; this module does not git push)

Never sets LIA_LIVE_TRADING, never signs, never mints.
"""
from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from xorus.safety import SAFETY, seal
from xorus.swarm import run_xorus

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
PUBLIC = ROOT / "apps" / "frontend" / "public" / "data"


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _write(path: Path, doc: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def run(*, publish: bool = True) -> dict[str, Any]:
    # Refuse any accidental live env from legacy LIA tooling.
    if os.environ.get("LIA_LIVE_TRADING", "0").strip() in ("1", "true", "TRUE", "yes"):
        raise RuntimeError("LIA_LIVE_TRADING must not be set; xOrus is paper-only")

    board = run_xorus()
    report = seal(
        {
            "schema": "xorus_production_run/v1",
            "generated_at": _now(),
            "safety": dict(SAFETY),
            "board": board,
            "publish": bool(publish),
            "lia_path": "retired",
            "replacement": "xorus.production_run",
        }
    )

    if publish:
        DATA.mkdir(parents=True, exist_ok=True)
        _write(DATA / "xorus_last_run.json", report)
        _write(DATA / "xorus_board.json", board)
        # Mirror for GitHub Pages static dApp when tree is present.
        if PUBLIC.exists():
            _write(PUBLIC / "xorus_last_run.json", report)
            _write(PUBLIC / "xorus_board.json", board)

    return report


def main() -> None:
    doc = run(publish=True)
    print(json.dumps({"ok": True, "generated_at": doc["generated_at"], "decision": doc["board"].get("decision")}, indent=2))


if __name__ == "__main__":
    main()
