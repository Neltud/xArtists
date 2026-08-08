"""
Vellum next-run — full dApp data pipeline (paper-first).

Order:
  1. gas publish
  2. board publish
  3. hatom publish
  4. orchestrator (Guardian + agent, no live sends)
  5. mirror data → docs/data + public/data
  6. policy gates snapshot

LIA_LIVE_TRADING defaults to 0.
"""
from __future__ import annotations

import json
import os
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def main() -> dict:
    if "LIA_LIVE_TRADING" not in os.environ:
        os.environ["LIA_LIVE_TRADING"] = "0"
    if "CHAIN" not in os.environ:
        os.environ["CHAIN"] = "1"
    live = os.environ.get("LIA_LIVE_TRADING", "0") == "1"
    report: dict = {
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "live": live,
        "steps": [],
        "policy": "paper until signature+micro-trades OK",
    }

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
        from lia.vellum.orchestrator import run_orchestrator

        orch = run_orchestrator(publish=False, compound_demo=False)
        report["steps"].append(
            {
                "id": "orchestrator",
                "ok": "error" not in orch,
                "guardian": orch.get("guardian"),
                "agent_action": (orch.get("agent") or {}).get("action"),
            }
        )
    except Exception as e:
        report["steps"].append({"id": "orchestrator", "ok": False, "error": str(e)})

    try:
        from lia.vellum.publish_data_for_frontend import publish as mirror

        m = mirror()
        report["steps"].append({"id": "mirror", "ok": m.get("ok", True), **{k: m.get(k) for k in ("copied", "missing")}})
    except Exception as e:
        report["steps"].append({"id": "mirror", "ok": False, "error": str(e)})

    try:
        from lia.executor.universal import health_report

        report["executor"] = health_report()
    except Exception as e:
        report["executor"] = {"error": str(e)}

    try:
        from lia.decisions.policy import evaluate_run_gates

        report["gates"] = evaluate_run_gates(
            agents_sc=False,
            bid_codehash=False,
            fulfillment=False,
            signature=False,
            micro_trades=False,
            pinata=bool(os.environ.get("PINATA_JWT")),
            rwa_sc=False,
        )
    except Exception as e:
        report["gates"] = {"error": str(e)}

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

    # mirror last run too
    try:
        for dest in (
            ROOT / "docs" / "data",
            ROOT / "apps" / "frontend" / "public" / "data",
        ):
            dest.mkdir(parents=True, exist_ok=True)
            (dest / "vellum_last_run.json").write_text(
                json.dumps(report, indent=2), encoding="utf-8"
            )
    except Exception:
        pass

    return report


if __name__ == "__main__":
    print(json.dumps(main(), indent=2))
