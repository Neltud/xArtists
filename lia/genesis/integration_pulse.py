"""
Phase 11 integrated pulse: RWA reassess → performance → yield → reconciliation.

  PYTHONPATH=. python -m lia.genesis.integration_pulse
"""
from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"


def run() -> dict[str, Any]:
    out: dict[str, Any] = {
        "schema": "integration_pulse/v1",
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    try:
        from lia.brain.rwa_evaluator import reassess_all

        out["rwa"] = reassess_all()
    except Exception as e:
        out["rwa"] = {"error": str(e)}

    try:
        from lia.brain.performance_tracker import track_all

        out["performance"] = {
            "packs": len((track_all().get("packs") or [])),
            "protocol_trading_pnl_usd": track_all().get("protocol_trading_pnl_usd"),
        }
    except Exception as e:
        out["performance"] = {"error": str(e)}

    try:
        from lia.guardian.yield_distributor import run_cycle

        yc = run_cycle()
        out["yield"] = {"compliance": (yc.get("compliance") or {}).get("ok")}
    except Exception as e:
        out["yield"] = {"error": str(e)}

    try:
        from lia.utils.reconciliation_audit import run as recon

        out["reconciliation"] = recon(halt_on_fail=False)
    except Exception as e:
        out["reconciliation"] = {"error": str(e)}

    DATA.mkdir(parents=True, exist_ok=True)
    path = DATA / "integration_pulse.json"
    path.write_text(json.dumps(out, indent=2), encoding="utf-8")
    for dest in (
        ROOT / "apps" / "frontend" / "public" / "data" / "integration_pulse.json",
        ROOT / "docs" / "data" / "integration_pulse.json",
    ):
        try:
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(json.dumps(out, indent=2), encoding="utf-8")
        except OSError:
            pass
    return out


def main() -> None:
    print(json.dumps(run(), indent=2))


if __name__ == "__main__":
    main()
