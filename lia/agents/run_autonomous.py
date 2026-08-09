"""
CLI / Vellum entry — swarm / legacy / integrated (oracle-backed market).

  PYTHONPATH=. LIA_LIVE_TRADING=0 python -m lia.agents.run_autonomous
  PYTHONPATH=. python -m lia.agents.run_autonomous --mode integrated
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
    from lia.oracles.market_from_oracle import build_book_from_status, build_market_from_oracle

    status = _load_json(ROOT / "data" / "lia_v6_status.json")
    market = build_market_from_oracle(refresh=True, status=status)
    gs = _load_json(ROOT / "data" / "greensmoke_forecasts.json")
    agg = (gs.get("aggregated_signals") or {}) if isinstance(gs, dict) else {}
    if agg.get("bias"):
        market["gs_bias"] = str(agg.get("bias"))
    book = build_book_from_status(status)
    return run_swarm_cycle(market=market, book=book, persist=True, settle=True)


def run_integrated() -> dict:
    from lia.agents.swarm_compound_bridge import run_integrated_cycle
    from lia.oracles.market_from_oracle import build_book_from_status, build_market_from_oracle

    status = _load_json(ROOT / "data" / "lia_v6_status.json")
    market = build_market_from_oracle(refresh=True, status=status)
    book = build_book_from_status(status)
    return run_integrated_cycle(market=market, book=book, simulate_fill=True)


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
    p.add_argument(
        "--mode", choices=("swarm", "legacy", "both", "integrated"), default="swarm"
    )
    args = p.parse_args()
    out: dict = {"mode": args.mode}
    if args.mode in ("swarm", "both"):
        out["swarm"] = run_swarm()
    if args.mode in ("legacy", "both"):
        out["legacy"] = run_legacy()
    if args.mode == "integrated":
        out["integrated"] = run_integrated()
    print(json.dumps(out, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
