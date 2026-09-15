#!/usr/bin/env python3
"""Print LIA executor mode + optional paper health (no PEM required for paper)."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from lia.executor.mode import mode_report  # noqa: E402


def main() -> int:
    report = {
        "mode": mode_report("auto"),
        "live_report": mode_report("live"),
        "paper_report": mode_report("paper"),
    }
    try:
        from lia.executor.universal import UniversalExecutor

        ex = UniversalExecutor()
        report["universal_health"] = ex.health()
    except Exception as e:
        report["universal_health"] = {"error": str(e)}
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
