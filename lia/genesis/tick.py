"""
Genesis unified tick — one command, full system pulse.
Does NOT set LIA_LIVE_TRADING=1. Does NOT broadcast TX.

  PYTHONPATH=. python -m lia.genesis.tick
"""
from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"


def run_tick() -> dict[str, Any]:
    out: dict[str, Any] = {
        "schema": "genesis_tick/v1",
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "LIA_LIVE_TRADING": 0,
        "broadcast": False,
    }

    # 1) RWA reassess
    try:
        from lia.brain.rwa_evaluator import reassess_all, load_catalog

        out["rwa"] = reassess_all()
        items = load_catalog()
        scores = [float((i.get("valuation") or {}).get("score") or 0) for i in items]
        out["rwa_avg_score"] = round(sum(scores) / len(scores), 2) if scores else None
        out["rwa_momentum_hint"] = (
            "up" if (out["rwa_avg_score"] or 0) >= 75 else "flat" if (out["rwa_avg_score"] or 0) >= 55 else "down"
        )
    except Exception as e:
        out["rwa"] = {"error": str(e)}

    # 2) Economic integrity
    try:
        from lia.utils.economic_validator import validate

        out["economy"] = validate()
    except Exception as e:
        out["economy"] = {"error": str(e)}

    # 3) Kill-switch / flash
    try:
        from lia.guardian.kill_switch import check_flash_crash, get_kill_switch

        out["flash"] = check_flash_crash()
        ks = get_kill_switch()
        out["kill_switch"] = {"locked": ks.is_locked, "reason": ks.reason}
    except Exception as e:
        out["kill_switch"] = {"error": str(e)}

    # 4) On-chain snapshot (display)
    try:
        from lia.guardian.onchain_monitor import build_status, publish

        st = build_status()
        publish(st)
        out["onchain"] = {
            "deployer_egld": (st.get("deployer") or {}).get("egld"),
            "equity_proxy_usd": st.get("equity_proxy_usd"),
        }
    except Exception as e:
        out["onchain"] = {"error": str(e)}

    # 5) Orchestrator tick with RWA bias on ART_MOMENTUM weight note
    try:
        from lia.brain.orchestrator import orchestrate

        avg = float(out.get("rwa_avg_score") or 50)
        # map score 0-100 → mild sentiment bias for strategy select
        sent = max(-1.0, min(1.0, (avg - 50) / 50))
        orch = orchestrate(
            sentiment=sent,
            volatility=0.35,
            trend="SIDEWAYS" if abs(sent) < 0.3 else ("UP" if sent > 0 else "DOWN"),
            confidence=0.55,
            asset_state="Liquid",
        )
        out["orchestrator"] = orch
    except Exception as e:
        out["orchestrator"] = {"error": str(e)}

    # 6) NFT constraint self-check
    try:
        from lia.brain.agent_constraints import assert_tradable_asset

        out["nft_guard_token"] = assert_tradable_asset(target_asset_type="TOKEN")
        out["nft_guard_nft"] = assert_tradable_asset(target_asset_type="NFT")
    except Exception as e:
        out["nft_guard"] = {"error": str(e)}

    DATA.mkdir(parents=True, exist_ok=True)
    path = DATA / "genesis_tick.json"
    path.write_text(json.dumps(out, indent=2), encoding="utf-8")
    for dest in (
        ROOT / "apps" / "frontend" / "public" / "data" / "genesis_tick.json",
        ROOT / "docs" / "data" / "genesis_tick.json",
    ):
        try:
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(json.dumps(out, indent=2), encoding="utf-8")
        except OSError:
            pass

    try:
        from lia.utils.audit_log import audit

        audit("genesis_tick", rwa_avg=out.get("rwa_avg_score"), economy_ok=(out.get("economy") or {}).get("ok"))
    except Exception:
        pass

    return out


def main() -> None:
    print(json.dumps(run_tick(), indent=2))


if __name__ == "__main__":
    main()
