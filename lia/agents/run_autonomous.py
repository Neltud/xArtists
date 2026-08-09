"""
CLI / Vellum entry — autonomous swarm + legacy open-loop cycle.

  PYTHONPATH=. LIA_LIVE_TRADING=0 python -m lia.agents.run_autonomous
  PYTHONPATH=. python -m lia.agents.run_autonomous --mode swarm
  PYTHONPATH=. python -m lia.agents.run_autonomous --mode legacy
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


def _load_json(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}


def run_swarm() -> dict:
    from lia.agents.autonomous_swarm import run_swarm_cycle

    status = _load_json(ROOT / "data" / "lia_v6_status.json")
    port = status.get("portfolio") or {}
    market = {
        "token": "WEGLD-bd4d79",
        "price": float((status.get("market") or {}).get("egld_price") or port.get("egld_price") or 0),
        "rsi_14": float((status.get("market") or {}).get("rsi_14") or 50),
        "trend_7d_pct": float((status.get("market") or {}).get("trend_7d_pct") or 0),
        "fear_greed": float((status.get("market") or {}).get("fear_greed") or 50),
        "gs_bias": str((status.get("market") or {}).get("gs_bias") or "NEUTRAL"),
        "gs_regime": str((status.get("market") or {}).get("guard_status") or "NEUTRAL"),
        "liquidity_usd": 150000,
    }
    gs = _load_json(ROOT / "data" / "greensmoke_forecasts.json")
    agg = (gs.get("aggregated_signals") or {}) if isinstance(gs, dict) else {}
    if agg.get("bias"):
        market["gs_bias"] = str(agg.get("bias"))
    book = {
        "equity_usd": float(port.get("total_usd") or 100),
        "deployable_usd": float(port.get("deployable_usd") or port.get("total_usd") or 40) * 0.4,
        "drawdown": float(port.get("drawdown") or 0),
    }
    return run_swarm_cycle(market=market, book=book, persist=True, settle=True)


def run_legacy() -> dict:
    from lia.circuit.autonomous_loop import run_autonomous_cycle

    status = _load_json(ROOT / "data" / "lia_v6_status.json")
    port = status.get("portfolio") or {}
    return run_autonomous_cycle(
        market={
            "trend_7d_pct": float((status.get("market") or {}).get("trend_7d_pct") or 0),
            "rsi_14": float((status.get("market") or {}).get("rsi_14") or 50),
            "token": "WEGLD-bd4d79",
            "price": float((status.get("market") or {}).get("egld_price") or 0),
        },
        portfolio={
            "deployable_usd": float(port.get("total_usd") or 40) * 0.4,
            "total_usd": float(port.get("total_usd") or 50),
        },
        fetch_memory=False,
        profit_validated=True,
    )


def main() -> int:
    if os.getenv("LIA_LIVE_TRADING", "0") == "1":
        print(
            json.dumps(
                {
                    "error": "LIA_LIVE_TRADING=1 — autonomous CLI refuses until micro-proof",
                    "hint": "export LIA_LIVE_TRADING=0",
                }
            )
        )
        return 2
    p = argparse.ArgumentParser(description="LIA autonomous agents")
    p.add_argument("--mode", choices=("swarm", "legacy", "both"), default="swarm")
    args = p.parse_args()
    out: dict = {"mode": args.mode}
    if args.mode in ("swarm", "both"):
        out["swarm"] = run_swarm()
    if args.mode in ("legacy", "both"):
        out["legacy"] = run_legacy()
    print(json.dumps(out, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
