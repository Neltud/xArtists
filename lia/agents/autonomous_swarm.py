"""
Autonomous trading agent swarm — LIA v6 (thin orchestrator)
===========================================================
Roles: lia.agents.swarm_roles · Coord: lia.agents.swarm_coord

  PYTHONPATH=. LIA_LIVE_TRADING=0 python -m lia.agents.run_autonomous
"""
from __future__ import annotations

import json
import os
import time
from pathlib import Path
from typing import Any, Optional

from lia.agents.swarm_coord import SwarmDecision, coordinate, paper_fill
from lia.agents.swarm_roles import (
    BookSnapshot,
    MarketSnapshot,
    collect_proposals,
)

ROOT = Path(__file__).resolve().parents[2]
STATE_PATH = ROOT / "data" / "lia_swarm_state.json"
LIVE = os.getenv("LIA_LIVE_TRADING", "0") == "1"

__all__ = [
    "BookSnapshot",
    "MarketSnapshot",
    "SwarmDecision",
    "collect_proposals",
    "coordinate",
    "paper_fill",
    "run_swarm_cycle",
]


def __getattr__(name: str):
    if name.startswith("agent_"):
        import lia.agents.swarm_roles as roles
        return getattr(roles, name)
    raise AttributeError(name)


def run_swarm_cycle(
    *,
    market: Optional[dict[str, Any]] = None,
    book: Optional[dict[str, Any]] = None,
    persist: bool = True,
    settle: bool = True,
) -> dict[str, Any]:
    market = market or {}
    book = book or {}
    m = MarketSnapshot(
        token=str(market.get("token") or "WEGLD-bd4d79"),
        price=float(market.get("price") or 0),
        vwap_24h=float(market.get("vwap_24h") or market.get("price") or 0),
        rsi_14=float(market.get("rsi_14") or 50),
        trend_7d_pct=float(market.get("trend_7d_pct") or 0),
        price_change_1h=float(market.get("price_change_1h") or 0),
        price_change_24h=float(market.get("price_change_24h") or 0),
        liquidity_usd=float(market.get("liquidity_usd") or 100_000),
        volume_spike=float(market.get("volume_spike") or 1.0),
        dex_a=float(market.get("dex_a") or market.get("price_dex_a") or 0),
        dex_b=float(market.get("dex_b") or market.get("price_dex_b") or 0),
        fear_greed=float(market.get("fear_greed") or 50),
        gs_regime=str(market.get("gs_regime") or "NEUTRAL"),
        gs_bias=str(market.get("gs_bias") or "NEUTRAL"),
    )
    b = BookSnapshot(
        equity_usd=float(book.get("equity_usd") or book.get("total_usd") or 100),
        deployable_usd=float(book.get("deployable_usd") or 40),
        drawdown=float(book.get("drawdown") or 0),
        consecutive_wins=int(book.get("consecutive_wins") or 0),
        consecutive_losses=int(book.get("consecutive_losses") or 0),
        realized_vol=float(book.get("realized_vol") or 0.02),
        compound_intensity=float(book.get("compound_intensity") or 0.4),
    )

    proposals = collect_proposals(m, b)
    decision = coordinate(proposals, m, b)
    fill = paper_fill(decision)

    settlement: dict[str, Any] = {}
    if settle and fill.get("filled") and fill.get("pnl_usd"):
        try:
            from lia.circuit.path_executor_hooks import after_trade_close
            settlement = after_trade_close(
                net_pnl_usd=float(fill["pnl_usd"]),
                equity_usd=b.equity_usd,
                persist_ledger=persist,
                publish_path=False,
            )
        except Exception as e:
            settlement = {"error": str(e)}

    out: dict[str, Any] = {
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "live_flag": LIVE,
        "decision": decision.to_dict(),
        "fill": fill,
        "settlement": settlement,
        "note": "paper autonomous swarm — LIA_LIVE_TRADING=0 required",
    }

    if persist:
        try:
            prev: dict[str, Any] = {"cycles": []}
            if STATE_PATH.exists():
                prev = json.loads(STATE_PATH.read_text(encoding="utf-8"))
            cycles = list(prev.get("cycles") or [])
            cycles.append({
                "ts": out["ts"],
                "action": decision.action,
                "agent": decision.lead_agent,
                "size": decision.size_usd,
                "pnl": fill.get("pnl_usd"),
                "phase": decision.phase,
            })
            prev["cycles"] = cycles[-100:]
            prev["updated"] = out["ts"]
            prev["last"] = {
                "ts": out["ts"],
                "decision": decision.to_dict(),
                "fill": fill,
            }
            STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
            STATE_PATH.write_text(json.dumps(prev, indent=2), encoding="utf-8")
            pub = ROOT / "apps" / "frontend" / "public" / "data" / "lia_swarm_state.json"
            if pub.parent.exists():
                pub.write_text(json.dumps(prev, indent=2), encoding="utf-8")
            out["state_path"] = str(STATE_PATH)
        except Exception as e:
            out["persist_error"] = str(e)

    return out


if __name__ == "__main__":
    demo = run_swarm_cycle(
        market={
            "price": 9.5, "vwap_24h": 9.8, "rsi_14": 28, "trend_7d_pct": 3.5,
            "price_change_1h": 0.4, "liquidity_usd": 200000, "dex_a": 9.48, "dex_b": 9.62,
            "fear_greed": 48, "gs_bias": "BULL",
        },
        book={"equity_usd": 200, "deployable_usd": 80},
        persist=False,
    )
    print(json.dumps(demo, indent=2))
