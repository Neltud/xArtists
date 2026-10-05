"""
Phase 8 golden-thread integration test (shadow only).

  PYTHONPATH=. python -m lia.genesis.integration_test
"""
from __future__ import annotations

import json
import os
import time
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"


def run() -> dict[str, Any]:
    os.environ.setdefault("LIA_LIVE_TRADING", "0")
    results: dict[str, Any] = {
        "schema": "integration_test/v1",
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }

    from lia.brain.rwa_evaluator import reassess_all, load_catalog

    results["rwa_reassess"] = reassess_all()
    scores = [float((i.get("valuation") or {}).get("score") or 0) for i in load_catalog()]
    results["rwa_avg"] = round(sum(scores) / len(scores), 2) if scores else 0

    from lia.brain.orchestrator import orchestrate

    sent = max(-1.0, min(1.0, (results["rwa_avg"] - 50) / 50))
    orch = orchestrate(
        sentiment=sent,
        confidence=0.6,
        asset_state="Liquid",
        trend="UP" if sent > 0.2 else "SIDEWAYS",
    )
    results["orchestrator"] = {"active": orch.get("active"), "reason": orch.get("reason")}

    from lia.genesis.decision_chain import run_stress

    stress = run_stress(cycles=1)
    p = (stress.get("proposals") or [{}])[0]
    results["proposal"] = {
        "status": p.get("status"),
        "broadcast": p.get("broadcast"),
        "chain": p.get("chain"),
    }

    from lia.brain.agent_constraints import assert_tradable_asset

    results["nft_block"] = assert_tradable_asset(target_asset_type="NFT")
    results["token_allow"] = assert_tradable_asset(target_asset_type="TOKEN")
    results["live_env"] = os.environ.get("LIA_LIVE_TRADING", "0")

    from lia.brain.performance_tracker import track_all
    from lia.guardian.yield_distributor import run_cycle

    perf = track_all()
    yc = run_cycle()
    results["performance_packs"] = len(perf.get("packs") or [])
    results["compliance"] = (yc.get("compliance") or {}).get("ok")
    results["total_equity"] = sum(float(x.get("equity_usd") or 0) for x in (perf.get("packs") or []))

    from lia.utils.economic_validator import record_mint, validate
    from lia.guardian.fulfillment import on_sell_executed

    record_mint(work_id="integration_mint", artist="p8")
    ship = on_sell_executed(work_id="rwa_001", buyer="erd1integration", mark_shipped=True)
    econ = validate()
    results["burn_loop"] = {
        "ship_ok": ship.get("ok"),
        "minted": econ.get("total_minted"),
        "burned": econ.get("total_burned"),
        "integrity_ok": econ.get("ok"),
    }

    from lia.guardian.kill_switch import get_kill_switch

    results["kill_switch_locked"] = get_kill_switch().is_locked

    thread_ok = (
        results["rwa_reassess"].get("reassessed", 0) >= 1
        and results["proposal"].get("status") in ("ready_to_sign", "skipped", "blocked")
        and results["proposal"].get("broadcast") is False
        and results["nft_block"].get("ok") is False
        and results["token_allow"].get("ok") is True
        and str(results["live_env"]) in ("0", "false", "False", "")
        and results["compliance"] is True
        and results["burn_loop"]["integrity_ok"] is True
    )
    results["GOLDEN_THREAD"] = "PASS" if thread_ok else "FAIL"

    DATA.mkdir(parents=True, exist_ok=True)
    path = DATA / "integration_test_last.json"
    path.write_text(json.dumps(results, indent=2), encoding="utf-8")
    for dest in (
        ROOT / "apps" / "frontend" / "public" / "data" / "integration_test_last.json",
        ROOT / "docs" / "data" / "integration_test_last.json",
    ):
        try:
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(json.dumps(results, indent=2), encoding="utf-8")
        except OSError:
            pass
    return results


def main() -> None:
    print(json.dumps(run(), indent=2))


if __name__ == "__main__":
    main()
