"""
Vellum next-run entry — publishes all public data LIA/dApp need.
Does NOT send live trades unless LIA_LIVE_TRADING=1.
"""
from __future__ import annotations

import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def main() -> dict:
    live = os.environ.get("LIA_LIVE_TRADING", "0") == "1"
    report: dict = {"live": live, "steps": []}

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
        from lia.media.storage import storage_status

        report["media"] = storage_status()
    except Exception as e:
        report["media"] = {"error": str(e)}

    if live:
        report["steps"].append(
            {
                "id": "live",
                "ok": False,
                "error": "Live trading gated — enable only after agents SC + signing + blackbox",
            }
        )
    else:
        report["steps"].append({"id": "live", "ok": True, "skipped": True})

    out = ROOT / "data" / "vellum_last_run.json"
    out.write_text(json.dumps(report, indent=2), encoding="utf-8")
    report["wrote"] = str(out)
    return report


if __name__ == "__main__":
    print(json.dumps(main(), indent=2))
