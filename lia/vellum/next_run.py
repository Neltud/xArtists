"""
Vellum next-run entry — publishes public data. Forces paper unless explicitly live.
"""
from __future__ import annotations

import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def main() -> dict:
    # Default safe: paper
    if "LIA_LIVE_TRADING" not in os.environ:
        os.environ["LIA_LIVE_TRADING"] = "0"
    live = os.environ.get("LIA_LIVE_TRADING", "0") == "1"
    report: dict = {"live": live, "steps": [], "policy": "paper until signature+micro-trades OK"}

    try:
        from lia.gas.publish import publish as gas_pub

        p = gas_pub()
        report["steps"].append({"id": "gas", "ok": True, "path": str(p)})
    except Exception as e:
        report["steps"].append({"id": "gas", "ok": False, "error": str(e)})

    try:
        from lia.board.publish import publish as board_pub

        p = board_pub()
        report["steps"].append({"id": "board", "ok": True, "path": str(p)})
    except Exception as e:
        report["steps"].append({"id": "board", "ok": False, "error": str(e)})

    try:
        from lia.venues.hatom import publish_hatom

        p = publish_hatom()
        report["steps"].append({"id": "hatom", "ok": True, "path": str(p)})
    except Exception as e:
        report["steps"].append({"id": "hatom", "ok": False, "error": str(e)})

    try:
        from lia.executor.universal import health_report

        report["executor"] = health_report()
    except Exception as e:
        report["executor"] = {"error": str(e)}

    if live:
        report["steps"].append(
            {
                "id": "live",
                "ok": False,
                "error": "LIVE requested — confirm blackbox+signature before size-up",
            }
        )
    else:
        report["steps"].append({"id": "live", "ok": True, "skipped": True, "LIA_LIVE_TRADING": 0})

    out = ROOT / "data" / "vellum_last_run.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, indent=2), encoding="utf-8")
    report["wrote"] = str(out)
    return report


if __name__ == "__main__":
    print(json.dumps(main(), indent=2))
