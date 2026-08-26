"""
After every Vellum cycle: mirror critical JSON so the dApp sees fresh data.
"""
from __future__ import annotations

import json
import shutil
import time
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"
MIRRORS = [
    ROOT / "docs" / "data",
    ROOT / "apps" / "frontend" / "public" / "data",
]

CRITICAL = [
    "lia_v6_status.json",
    "lia_trades.json",
    "lia_trailing_state.json",
    "lia_portfolio.json",
    "lia_board.json",
    "hatom_lia.json",
    "battle_of_nodes.json",
    "xartists_onchain.json",
    "tro_pool.json",
    "config.json",
    "greensmoke_top.json",
    "greensmoke_forecasts.json",
    "gsn_leaderboard_score.json",
    "lia_tro_policy.json",
    "contracts.json",
    "rwa_escrow_intents.json",
    "vellum_last_run.json",
    "vellum_production_run.json",
    "egld_price.json",
    "oracle_prices.json",
    "oracle_config.json",
    "ads_active.json",
    "treasury_wallets.json",
    "desk_last.json",
    "tro_burn_feed.json",
    "lia_performance.json",
    "lia_guards_state.json",
    "lia_decision_gates.json",
    "pre_mainnet_modules.json",
    "guardian_kill_log.json",
    "bridge_outbox.json",
    "burnify_lia_state.json",
    "compounding_echelons.json",
    "compounding_annual_sim.json",
    "lia_signal_fusion.json",
    "lia_pretrade_gate.json",
    "signal_ticker.json",
    "polymarket_signals.json",
    "free_signals.json",
    "social_intel.json",
    "lia_intel_catalog.json",
    "lia_brain_cycle.json",
    "lia_last_decision_proof.json",
    "decision_proofs_used.json",
    "lia_paper_legs.json",
    "risk_manager_state.json",
]


def _touch_status() -> None:
    path = DATA / "lia_v6_status.json"
    if not path.exists():
        return
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return
    data["timestamp"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    data["updated"] = data["timestamp"]
    data["status"] = data.get("status") or "monitoring"
    data.setdefault("LIA_LIVE_TRADING", 0)
    orch = data.setdefault("orchestrator", {})
    g = orch.setdefault("guardian", {})
    g.setdefault("kill_state", "ARMED" if g.get("allow", True) else "TRIPPED")
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")


def mirror_files(names: Iterable[str] | None = None) -> dict:
    names = list(names or CRITICAL)
    _touch_status()
    copied: list[str] = []
    missing: list[str] = []
    for name in names:
        src = DATA / name
        if not src.is_file():
            missing.append(name)
            continue
        for dest_root in MIRRORS:
            dest_root.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dest_root / name)
        copied.append(name)
    return {
        "ok": True,
        "copied": copied,
        "missing": missing,
        "mirrors": [str(m) for m in MIRRORS],
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }


def publish() -> dict:
    return mirror_files()


if __name__ == "__main__":
    print(json.dumps(publish(), indent=2))
