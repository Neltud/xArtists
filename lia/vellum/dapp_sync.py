"""
Vellum ↔ dApp ↔ GitHub synchronization registry.

Publishes a single source of truth for:
  - which dApp pages LIA/Vellum owns or feeds
  - Guardian gates before strategy / size-up
  - who signs TX (user wallet via TxShell vs LIA ops PEM in Vellum vault only)
  - demo vs paper vs micro-live modes
  - GitHub modules + mirrored JSON for each page

No secrets. Soft-fail. Safe to run on every production_run.
"""
from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"
VERSION = "1.0.0"

DOCTRINE = {
    "paper_first": True,
    "guardian_before_brain": True,
    "fail_closed_gates": True,
    "pem_location": "vellum_vault_only",
    "user_wallet_signs": "TxShell frontend (dApp)",
    "lia_ops_signs": "Vellum host with LIA_WALLET_PEM — never user wallet",
    "demo_mode": "DEMO_MODE frontend + LIA_LIVE_TRADING=0",
    "github": "public modules + data mirrors; no secrets",
}

PAGE_NODES: list[dict[str, Any]] = [
    {"route": "/", "page": "Dashboard", "roles": ["view", "guardian"],
     "vellum_nodes": ["pipeline.status", "guardian_hook", "publish_data_for_frontend"],
     "strategies": [], "sign": "none",
     "data": ["lia_v6_status.json", "lia_board.json", "signal_ticker.json"], "demo": True},
    {"route": "/trading", "page": "Trading", "roles": ["strategy", "guardian", "view"],
     "vellum_nodes": ["pipeline", "guardian_hook", "signals.fusion", "signals.pretrade_gate",
                      "brain.cycle", "executor.paper_with_proof", "grok_mcp_ingest"],
     "strategies": ["MOMENTUM", "YIELD", "DEFENSE", "cross_arb_scan"], "sign": "lia_paper",
     "data": ["lia_brain_cycle.json", "lia_paper_legs.json", "lia_signal_fusion.json",
              "lia_pretrade_gate.json", "cross_score.json", "agent_feedback_summary.json",
              "lia_v6_status.json"], "demo": True},
    {"route": "/market", "page": "MarketPage", "roles": ["view"],
     "vellum_nodes": ["oracles.publish", "board.publish", "signals.social_intel"],
     "strategies": [], "sign": "none",
     "data": ["oracle_prices.json", "lia_board.json", "social_intel.json", "free_signals.json"], "demo": True},
    {"route": "/marketplace", "page": "Marketplace", "roles": ["sign_user", "view"],
     "vellum_nodes": ["publish_data_for_frontend"], "strategies": [], "sign": "user_txshell",
     "data": ["ads_active.json", "config.json"], "demo": True},
    {"route": "/studio", "page": "ArtistStudio", "roles": ["sign_user", "view"],
     "vellum_nodes": ["publish_data_for_frontend"], "strategies": [], "sign": "user_txshell",
     "data": ["config.json"], "demo": True},
    {"route": "/agents", "page": "Agents", "roles": ["strategy", "view", "sign_user"],
     "vellum_nodes": ["pipeline.agent", "circuit.desk_debate", "circuit.trading_modes"],
     "strategies": ["agent_packs", "desk_fuse"], "sign": "user_txshell",
     "data": ["desk_last.json", "lia_v6_status.json"], "demo": True},
    {"route": "/agents/polylia", "page": "AgentsPolyliaPage", "roles": ["strategy", "view"],
     "vellum_nodes": ["pipeline.agent", "signals.fusion"], "strategies": ["polylia"],
     "sign": "user_txshell", "data": ["lia_signal_fusion.json"], "demo": True},
    {"route": "/my-packs", "page": "MyPacks", "roles": ["view", "sign_user"],
     "vellum_nodes": ["publish_data_for_frontend"], "strategies": [], "sign": "user_txshell",
     "data": ["lia_v6_status.json"], "demo": True},
    {"route": "/tours", "page": "ArtToursPage", "roles": ["view", "demo"],
     "vellum_nodes": ["publish_data_for_frontend"], "strategies": [], "sign": "none",
     "data": ["config.json"], "demo": True},
    {"route": "/staking", "page": "StakingPage", "roles": ["strategy", "sign_user", "guardian"],
     "vellum_nodes": ["compounding.step", "guardian_hook"],
     "strategies": ["staking_yield", "compounding_echelons"], "sign": "user_txshell",
     "data": ["compounding_echelons.json", "compounding_annual_sim.json"], "demo": True},
    {"route": "/lp", "page": "LPPoolsPage", "roles": ["strategy", "sign_user"],
     "vellum_nodes": ["compounding.step"], "strategies": ["lp_yield"], "sign": "user_txshell",
     "data": ["compounding_echelons.json"], "demo": True},
    {"route": "/tro", "page": "TroPage", "roles": ["strategy", "sign_user", "view"],
     "vellum_nodes": ["pipeline", "publish_data_for_frontend"],
     "strategies": ["tro_policy", "burn_feed"], "sign": "user_txshell",
     "data": ["lia_tro_policy.json", "tro_burn_feed.json", "tro_pool.json"], "demo": True},
    {"route": "/burnify", "page": "BurnifyPage", "roles": ["strategy", "sign_user", "guardian"],
     "vellum_nodes": ["pipeline", "guardian_hook"], "strategies": ["burnify"], "sign": "user_txshell",
     "data": ["burnify_lia_state.json"], "demo": True},
    {"route": "/hatom", "page": "HatomPage", "roles": ["strategy", "view"],
     "vellum_nodes": ["publish_hatom", "pipeline"], "strategies": ["hatom_boost", "money_market"],
     "sign": "lia_paper", "data": ["hatom_lia.json"], "demo": True},
    {"route": "/portfolio", "page": "Portfolio", "roles": ["view", "guardian"],
     "vellum_nodes": ["pipeline", "security.risk_manager"], "strategies": [], "sign": "none",
     "data": ["lia_portfolio.json", "risk_manager_state.json", "lia_performance.json"], "demo": True},
    {"route": "/wallet", "page": "Wallet", "roles": ["sign_user", "view"],
     "vellum_nodes": [], "strategies": [], "sign": "user_txshell",
     "data": ["treasury_wallets.json"], "demo": True},
    {"route": "/tip", "page": "Tip", "roles": ["sign_user"],
     "vellum_nodes": [], "strategies": [], "sign": "user_txshell", "data": [], "demo": True},
    {"route": "/dao", "page": "DAO", "roles": ["view", "sign_user"],
     "vellum_nodes": ["publish_data_for_frontend"], "strategies": [], "sign": "user_txshell",
     "data": ["lia_v6_status.json"], "demo": True},
    {"route": "/museum", "page": "MuseumPage", "roles": ["view"],
     "vellum_nodes": ["publish_data_for_frontend"], "strategies": [], "sign": "none",
     "data": ["config.json"], "demo": True},
    {"route": "/sale", "page": "SalePage", "roles": ["sign_user", "view"],
     "vellum_nodes": ["publish_data_for_frontend"], "strategies": [], "sign": "user_txshell",
     "data": ["config.json"], "demo": True},
    {"route": "/demo", "page": "DemoTourPage", "roles": ["demo", "view"],
     "vellum_nodes": ["production_run", "pipeline", "paper_with_proof"],
     "strategies": ["paper_demo"], "sign": "none",
     "data": ["vellum_production_run.json", "lia_paper_legs.json", "lia_v6_status.json"], "demo": True},
    {"route": "/go-live", "page": "GoLivePage", "roles": ["guardian", "view"],
     "vellum_nodes": ["security.go_live_gates", "guardian_hook", "security.risk_manager"],
     "strategies": [], "sign": "none",
     "data": ["lia_decision_gates.json", "go_live_gates.json", "risk_manager_state.json"], "demo": False},
    {"route": "/sim", "page": "SimulationLab", "roles": ["strategy", "demo", "view"],
     "vellum_nodes": ["compounding.step", "executor.paper_with_proof"],
     "strategies": ["sim_echelons"], "sign": "none",
     "data": ["compounding_annual_sim.json", "lia_paper_legs.json"], "demo": True},
    {"route": "/entity", "page": "EntityMap", "roles": ["view"],
     "vellum_nodes": ["publish_data_for_frontend"], "strategies": [], "sign": "none",
     "data": ["xartists_onchain.json", "contracts.json"], "demo": True},
]

WORKFLOW_NODES: list[dict[str, Any]] = [
    {"id": "gates", "module": "lia.security.go_live_gates", "purpose": "Allow/deny live trading — fail closed", "sign": False, "guardian": True},
    {"id": "risk_manager", "module": "lia.security.risk_manager", "purpose": "Hard drawdown lock", "sign": False, "guardian": True},
    {"id": "pipeline", "module": "lia.vellum.pipeline", "purpose": "Oracles → desk → mode → Guardian → stack", "sign": False, "guardian": True},
    {"id": "guardian", "module": "lia.vellum.guardian_hook", "purpose": "Spiral/Kelly gate before size-up", "sign": False, "guardian": True},
    {"id": "signals", "module": "lia.signals.fusion", "purpose": "Cross signal fusion", "sign": False, "guardian": False},
    {"id": "pretrade", "module": "lia.signals.pretrade_gate", "purpose": "Pre-trade allow", "sign": False, "guardian": True},
    {"id": "brain", "module": "lia.brain.cycle", "purpose": "EV + DecisionProof", "sign": False, "guardian": False},
    {"id": "paper_leg", "module": "lia.executor.paper_with_proof", "purpose": "Paper execution + proof", "sign": False, "guardian": False},
    {"id": "compounding", "module": "lia.compounding.step", "purpose": "Yield echelons", "sign": False, "guardian": False},
    {"id": "grok_mcp", "module": "lia.vellum.grok_mcp_ingest", "purpose": "CrossScore Grok↔LIA", "sign": False, "guardian": False},
    {"id": "mx8004", "module": "lia.vellum.mx8004_sprint", "purpose": "Agent identity registration (dry-run default)", "sign": "optional_pem", "guardian": False},
    {"id": "deploy_scs", "module": "lia.vellum.deploy_scs_node", "purpose": "Rare SC deploy — PEM required", "sign": "lia_pem", "guardian": True},
    {"id": "mirror", "module": "lia.vellum.publish_data_for_frontend", "purpose": "Mirror data/ → public + docs for dApp", "sign": False, "guardian": False},
]


def _ts() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def _existing_data_files(names: list[str]) -> dict[str, bool]:
    return {n: (DATA / n).is_file() for n in names}


def build_registry() -> dict[str, Any]:
    all_data: list[str] = []
    for p in PAGE_NODES:
        all_data.extend(p.get("data") or [])
    unique_data = sorted(set(all_data))
    return {
        "ts": _ts(),
        "version": VERSION,
        "module": "lia.vellum.dapp_sync",
        "doctrine": DOCTRINE,
        "github": {
            "repo": "Neltud/xArtists",
            "branch": "main",
            "pull_before_cycle": True,
            "command": "git pull origin main && PYTHONPATH=. CHAIN=1 LIA_LIVE_TRADING=0 python -m lia.vellum.production_run",
        },
        "signing": {
            "user_txshell_routes": [p["route"] for p in PAGE_NODES if p.get("sign") == "user_txshell"],
            "lia_paper_routes": [p["route"] for p in PAGE_NODES if p.get("sign") == "lia_paper"],
            "lia_pem_nodes": [n["id"] for n in WORKFLOW_NODES if n.get("sign") in ("lia_pem", "optional_pem")],
            "note": "User TxShell never holds LIA ops PEM. Guardian ARMED required before any live LIA size-up.",
        },
        "workflows": {
            "A_paper_brain": {
                "cadence": "every few minutes",
                "live": False,
                "entry": "lia.vellum.production_run",
                "nodes": [n["id"] for n in WORKFLOW_NODES if n["id"] != "deploy_scs"],
            },
            "B_decision_proof_demo": {
                "cadence": "on demand / demo tour",
                "live": False,
                "entry": "lia.executor.paper_with_proof",
            },
            "C_deploy_scs": {
                "cadence": "rare manual",
                "live": True,
                "requires": ["VELLUM_DEPLOY_SCS=1", "LIA_WALLET_PEM"],
                "entry": "lia.vellum.deploy_scs_node",
            },
            "D_micro_live": {
                "cadence": "later",
                "live": True,
                "requires": ["go_live_gates.allow_live_trading", "Guardian ARMED", "micro-proofs", "LIA_WALLET_PEM"],
            },
        },
        "pages": PAGE_NODES,
        "workflow_nodes": WORKFLOW_NODES,
        "data_coverage": _existing_data_files(unique_data),
        "summary": {
            "n_pages": len(PAGE_NODES),
            "n_workflow_nodes": len(WORKFLOW_NODES),
            "n_user_sign_routes": sum(1 for p in PAGE_NODES if p.get("sign") == "user_txshell"),
            "n_guardian_pages": sum(1 for p in PAGE_NODES if "guardian" in (p.get("roles") or [])),
            "n_strategy_pages": sum(1 for p in PAGE_NODES if "strategy" in (p.get("roles") or [])),
        },
    }


def _mirror(name: str, payload: dict[str, Any]) -> None:
    raw = json.dumps(payload, indent=2, ensure_ascii=False, default=str) + "\n"
    for dest in (
        DATA / name,
        ROOT / "docs" / "data" / name,
        ROOT / "apps" / "frontend" / "public" / "data" / name,
    ):
        try:
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(raw, encoding="utf-8")
        except OSError:
            pass


def run(publish: bool = True) -> dict[str, Any]:
    reg = build_registry()
    if publish:
        _mirror("vellum_dapp_map.json", reg)
        status_patch = {
            "ts": reg["ts"],
            "dapp_sync": {
                "version": VERSION,
                "pages": reg["summary"]["n_pages"],
                "guardian_pages": reg["summary"]["n_guardian_pages"],
                "strategy_pages": reg["summary"]["n_strategy_pages"],
                "user_sign_routes": reg["signing"]["user_txshell_routes"],
            },
        }
        _mirror("vellum_dapp_sync_status.json", status_patch)
    return {
        "ok": True,
        "soft": True,
        "module": "dapp_sync",
        "version": VERSION,
        "summary": reg["summary"],
        "published": publish,
    }


if __name__ == "__main__":
    print(json.dumps(run(), indent=2, default=str))
