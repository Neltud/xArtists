"""
Physical-digital fulfillment after RWA sell (simulated logistics + audit).

  PYTHONPATH=. python -m lia.guardian.fulfillment --sell rwa_001 --buyer erd1...
"""
from __future__ import annotations

import argparse
import json
import time
import uuid
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"


def request_shipment(work_id: str, buyer: str) -> dict[str, Any]:
    ship_id = f"ship_{uuid.uuid4().hex[:10]}"
    row = {
        "shipment_id": ship_id,
        "work_id": work_id,
        "buyer": buyer,
        "status": "requested",
        "carrier": "SIMULATED_LOGISTICS",
        "created": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "note": "Paper logistics — replace with real 3PL API later",
    }
    DATA.mkdir(parents=True, exist_ok=True)
    path = DATA / "rwa_shipments.jsonl"
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(row) + "\n")
    return row


def on_sell_executed(
    *,
    work_id: str,
    buyer: str,
    tx_hash: str | None = None,
) -> dict[str, Any]:
    """Sell path: shipment request + catalog update + audit."""
    from lia.brain.rwa_evaluator import load_catalog, save_catalog

    ship = request_shipment(work_id, buyer)
    items = load_catalog()
    for it in items:
        if it.get("id") == work_id:
            it["shipment_status"] = "shipment_requested"
            it["listed"] = False
            it["last_sale_tx"] = tx_hash
            it["buyer"] = buyer
    save_catalog(items)
    try:
        from lia.utils.audit_log import audit

        audit(
            "rwa_physical_transfer",
            work_id=work_id,
            buyer=buyer,
            shipment_id=ship["shipment_id"],
            tx_hash=tx_hash,
        )
    except Exception:
        pass
    return {
        "ok": True,
        "shipment": ship,
        "nft_transfer": "pending_or_done_on_chain",
        "tx_hash": tx_hash,
        "note": "NFT transfer is separate on-chain TX; this logs physical sync",
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--sell", type=str, required=True)
    ap.add_argument("--buyer", type=str, default="erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu")
    ap.add_argument("--tx", type=str, default="")
    args = ap.parse_args()
    print(json.dumps(on_sell_executed(work_id=args.sell, buyer=args.buyer, tx_hash=args.tx or None), indent=2))


if __name__ == "__main__":
    main()
