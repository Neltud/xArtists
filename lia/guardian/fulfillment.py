"""
Settlement: SOLD+SHIPPED → 1 TRO burn batch (paper/HITL).

  PYTHONPATH=. python -m lia.guardian.fulfillment --sell rwa_001 --buyer erd1... --ship
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
    }
    DATA.mkdir(parents=True, exist_ok=True)
    with (DATA / "rwa_shipments.jsonl").open("a", encoding="utf-8") as f:
        f.write(json.dumps(row) + "\n")
    return row


def on_sell_executed(
    *,
    work_id: str,
    buyer: str,
    tx_hash: str | None = None,
    mark_shipped: bool = False,
) -> dict[str, Any]:
    from lia.brain.rwa_evaluator import load_catalog, save_catalog

    ship = request_shipment(work_id, buyer)
    items = load_catalog()
    for it in items:
        if it.get("id") == work_id:
            it["status"] = "sold"
            it["shipment_status"] = "shipped" if mark_shipped else "shipment_requested"
            it["listed"] = False
            it["last_sale_tx"] = tx_hash
            it["buyer"] = buyer
    save_catalog(items)

    burn = None
    if mark_shipped:
        from lia.utils.economic_validator import record_burn

        burn = record_burn(work_id=work_id, reason="sold_and_shipped")

    try:
        from lia.utils.audit_log import audit

        audit(
            "rwa_settlement",
            work_id=work_id,
            buyer=buyer,
            shipped=mark_shipped,
            burn_tro=1.0 if mark_shipped else 0.0,
            tx_hash=tx_hash,
        )
    except Exception:
        pass

    return {
        "ok": True,
        "shipment": ship,
        "burn": burn,
        "tx_hash": tx_hash,
        "note": "NFT transfer is separate on-chain; TRO burn is ledger until Burnify TX",
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--sell", type=str, required=True)
    ap.add_argument("--buyer", type=str, default="erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu")
    ap.add_argument("--tx", type=str, default="")
    ap.add_argument("--ship", action="store_true", help="Mark shipped → burn 1 TRO")
    args = ap.parse_args()
    print(
        json.dumps(
            on_sell_executed(
                work_id=args.sell,
                buyer=args.buyer,
                tx_hash=args.tx or None,
                mark_shipped=args.ship,
            ),
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
