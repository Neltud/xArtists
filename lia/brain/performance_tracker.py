"""
Agent Pack performance — realized trading PnL + RWA appreciation.
Not points. Values are ledger-backed (shadow until on-chain attribution).

  PYTHONPATH=. python -m lia.brain.performance_tracker
  PYTHONPATH=. python -m lia.brain.performance_tracker --pack pack_alpha
"""
from __future__ import annotations

import argparse
import json
import time
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"
PACKS = DATA / "agent_packs.json"
PERF = DATA / "pack_performance.json"


def default_packs() -> list[dict[str, Any]]:
    return [
        {
            "id": "pack_alpha",
            "name": "Alpha Managed",
            "owner": "protocol",
            "strategy_bias": "STRAT_YIELD_OPTIMIZER",
            "rwa_ids": ["rwa_001"],
            "inception_equity_usd": 100.0,
            "status": "active",
        },
        {
            "id": "pack_lia",
            "name": "LIA Core",
            "owner": "protocol",
            "strategy_bias": "STRAT_ART_MOMENTUM",
            "rwa_ids": ["rwa_002", "rwa_003"],
            "inception_equity_usd": 100.0,
            "status": "active",
        },
    ]


def load_packs() -> list[dict[str, Any]]:
    if PACKS.is_file():
        try:
            d = json.loads(PACKS.read_text(encoding="utf-8"))
            items = d.get("packs") if isinstance(d, dict) else d
            if isinstance(items, list) and items:
                return items
        except Exception:
            pass
    packs = default_packs()
    DATA.mkdir(parents=True, exist_ok=True)
    PACKS.write_text(json.dumps({"schema": "agent_packs/v1", "packs": packs}, indent=2), encoding="utf-8")
    return packs


def _shadow_trading_pnl() -> float:
    """From decision shadow / sprint if present."""
    for name in ("decision_shadow_portfolio.json", "lia_shadow_export.json", "lia_shadow_sprint.json"):
        path = DATA / name
        if not path.is_file():
            continue
        try:
            d = json.loads(path.read_text(encoding="utf-8"))
            if "equity_usd" in d and name.startswith("decision"):
                # delta vs start 50
                return float(d.get("equity_usd") or 50) - 50.0
            if d.get("shadow_pnl_usd") is not None:
                return float(d["shadow_pnl_usd"])
            if d.get("equity_now_usd") is not None and d.get("equity_start_usd") is not None:
                return float(d["equity_now_usd"]) - float(d["equity_start_usd"])
        except Exception:
            continue
    return 0.0


def _rwa_appreciation(rwa_ids: list[str]) -> tuple[float, dict[str, float]]:
    path = DATA / "rwa_catalog.json"
    deltas: dict[str, float] = {}
    total = 0.0
    if not path.is_file():
        return 0.0, deltas
    try:
        d = json.loads(path.read_text(encoding="utf-8"))
        items = d.get("items") or []
        by_id = {str(i.get("id")): i for i in items}
        for rid in rwa_ids:
            it = by_id.get(rid)
            if not it:
                continue
            val = it.get("valuation") or {}
            # baseline proxy: score/50 * 500 was seed; use price_proxy vs 500
            px = float(val.get("price_proxy_usd") or 500)
            base = 500.0
            delta = px - base
            deltas[rid] = round(delta, 2)
            total += delta
    except Exception:
        pass
    return round(total, 2), deltas


def track_pack(pack: dict[str, Any], *, trading_pnl_share: float) -> dict[str, Any]:
    rwa_ids = list(pack.get("rwa_ids") or [])
    rwa_appr, rwa_detail = _rwa_appreciation(rwa_ids)
    # Pack gets a share of protocol trading pnl (equal split among active packs for paper)
    realized = round(trading_pnl_share, 4)
    inception = float(pack.get("inception_equity_usd") or 100)
    equity = round(inception + realized + rwa_appr * 0.1, 4)  # 10% of RWA $ delta attributed
    return {
        "pack_id": pack.get("id"),
        "name": pack.get("name"),
        "strategy_bias": pack.get("strategy_bias"),
        "realized_trading_usd": realized,
        "rwa_appreciation_usd": round(rwa_appr * 0.1, 4),
        "rwa_detail": rwa_detail,
        "fees_usd": 0.0,
        "net_profit_usd": round(realized + rwa_appr * 0.1, 4),
        "equity_usd": equity,
        "inception_equity_usd": inception,
        "source": "shadow_ledger",
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "disclaimer": "Attributed performance from shadow/RWA proxies until on-chain sub-accounts",
    }


def track_all() -> dict[str, Any]:
    packs = load_packs()
    active = [p for p in packs if p.get("status") == "active"]
    gross = _shadow_trading_pnl()
    n = max(1, len(active))
    share = gross / n
    rows = [track_pack(p, trading_pnl_share=share) for p in active]
    out = {
        "schema": "pack_performance/v1",
        "updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "protocol_trading_pnl_usd": round(gross, 4),
        "packs": rows,
        "note": "No points — equity & profit only. Shadow until chain attribution.",
    }
    DATA.mkdir(parents=True, exist_ok=True)
    PERF.write_text(json.dumps(out, indent=2), encoding="utf-8")
    for dest in (
        ROOT / "apps" / "frontend" / "public" / "data" / "pack_performance.json",
        ROOT / "docs" / "data" / "pack_performance.json",
    ):
        try:
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(json.dumps(out, indent=2), encoding="utf-8")
        except OSError:
            pass
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--pack", type=str, default="")
    args = ap.parse_args()
    allp = track_all()
    if args.pack:
        row = next((p for p in allp["packs"] if p["pack_id"] == args.pack), None)
        print(json.dumps(row or {"error": "not_found"}, indent=2))
    else:
        print(json.dumps(allp, indent=2))


if __name__ == "__main__":
    main()
