"""LIA intelligence products — autonomous agents can purchase data/analyses.

Off-chain catalog + quote. Settlement on-chain later (USDC/TRO) gated by SC.
Agents buy signals/reports from LIA; does not move user pack capital.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "data" / "lia_intel_catalog.json"

PRODUCTS: list[dict[str, Any]] = [
    {
        "id": "lia.signal.board.v1",
        "name": "Board signals pack (paper)",
        "kind": "signal_stream",
        "price_usdc": 5.0,
        "period": "24h",
        "includes": ["lia_trades snapshot", "trailing state", "guard status"],
        "live_settlement": False,
    },
    {
        "id": "lia.oracle.mids.v1",
        "name": "Oracle mid prices",
        "kind": "oracle",
        "price_usdc": 2.0,
        "period": "1h",
        "includes": ["oracle_prices.json", "dex mids"],
        "live_settlement": False,
    },
    {
        "id": "lia.compounding.echelons.v2",
        "name": "10-column compounding state",
        "kind": "analytics",
        "price_usdc": 3.0,
        "period": "cycle",
        "includes": ["compounding_echelons", "annual_sim summary"],
        "live_settlement": False,
    },
    {
        "id": "lia.analysis.desk.v1",
        "name": "Desk debate + risk memo",
        "kind": "report",
        "price_usdc": 15.0,
        "period": "daily",
        "includes": ["desk_last", "guardian preflight excerpt"],
        "live_settlement": False,
    },
    {
        "id": "lia.memory.onchain.v1",
        "name": "On-chain memory digest",
        "kind": "memory",
        "price_usdc": 8.0,
        "period": "daily",
        "includes": ["recent tx memory hashes", "intent receipts index"],
        "live_settlement": False,
    },
]


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def quote(product_id: str, buyer_agent_id: str) -> dict[str, Any]:
    prod = next((p for p in PRODUCTS if p["id"] == product_id), None)
    if not prod:
        return {"ok": False, "error": "unknown_product"}
    return {
        "ok": True,
        "buyer_agent_id": buyer_agent_id,
        "product": prod,
        "quote_usdc": prod["price_usdc"],
        "settlement": "paper_iou" if not prod["live_settlement"] else "onchain_usdc",
        "ts": _now(),
        "note": "Pay path live only after marketplace SC + policy approve",
    }


def publish_catalog() -> dict[str, Any]:
    payload = {
        "schema": "xartists.lia.intel_catalog.v1",
        "updated": _now(),
        "seller": "LIA",
        "currency": "USDC",
        "buyers": "autonomous_agents_and_pack_holders",
        "products": PRODUCTS,
        "settlement_status": "catalog_only",
        "docs": "docs/LIA_INTEL_MARKETPLACE.md",
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return payload


if __name__ == "__main__":
    c = publish_catalog()
    print("products", len(c["products"]))
    print(quote("lia.signal.board.v1", "agent_demo_1"))
