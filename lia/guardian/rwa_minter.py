"""
RWA mint planner + Mint→1 TRO revenue event (paper/HITL).

  PYTHONPATH=. python -m lia.guardian.rwa_minter --work rwa_001
  PYTHONPATH=. python -m lia.guardian.rwa_minter --work rwa_001 --confirm-mint
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import time
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"


def plan_mint(
    work_id: str,
    *,
    collection_creation_cost: float = 0.0,
    nft_creation_cost: float = 0.0,
    confirm: bool = False,
) -> dict[str, Any]:
    from lia.brain.rwa_evaluator import load_catalog

    items = load_catalog()
    work = next((x for x in items if x.get("id") == work_id), None)
    if not work:
        return {"ok": False, "reason": "work_not_found"}

    val = work.get("valuation") or {}
    cert = work.get("certificate_hash") or hashlib.sha256(work_id.encode()).hexdigest()
    total_cost = float(collection_creation_cost) + float(nft_creation_cost)
    live = os.environ.get("LIA_LIVE_TRADING", "0").strip() in ("1", "true", "TRUE")

    proposal = {
        "schema": "rwa_mint_proposal/v1",
        "status": "pending_human" if not confirm else "confirmed_paper",
        "work_id": work_id,
        "token_name": f"XARWA-{work_id[-3:].upper()}",
        "attributes": {
            "artist": work.get("artist"),
            "title": work.get("title"),
            "rwa": True,
            "certificate_sha256": cert,
            "ai_value_score": val.get("score"),
        },
        "economics": {
            "collection_creation_cost": collection_creation_cost,
            "nft_creation_cost": nft_creation_cost,
            "total_cost_usd": total_cost,
            "tro_reward_to_user": 1.0,
            "note": "On confirm: ledger +1 TRO (paper until ESDT transfer wired)",
        },
        "valuation_report": {
            "score": val.get("score"),
            "price_proxy_usd": val.get("price_proxy_usd"),
            "certificate_sha256": cert,
        },
        "LIA_LIVE_TRADING": live,
        "broadcast": False,
        "created": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }

    DATA.mkdir(parents=True, exist_ok=True)
    path = DATA / f"rwa_mint_{work_id}.json"
    path.write_text(json.dumps(proposal, indent=2), encoding="utf-8")

    tro_event = None
    if confirm:
        from lia.utils.economic_validator import record_mint

        tro_event = record_mint(
            work_id=work_id,
            artist=str(work.get("artist") or ""),
            cost_usd=total_cost,
        )
        # catalog status
        for it in items:
            if it.get("id") == work_id:
                it["status"] = "minted"
                it["listed"] = True
        try:
            from lia.brain.rwa_evaluator import save_catalog

            save_catalog(items)
        except Exception:
            pass

    try:
        from lia.utils.audit_log import audit

        audit(
            "rwa_mint_proposal",
            work_id=work_id,
            confirm=confirm,
            cost=total_cost,
            path=str(path),
        )
    except Exception:
        pass

    return {"ok": True, "proposal": proposal, "path": str(path), "tro": tro_event}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--work", type=str, default="rwa_001")
    ap.add_argument("--collection-cost", type=float, default=0.0)
    ap.add_argument("--nft-cost", type=float, default=0.0)
    ap.add_argument("--confirm-mint", action="store_true", help="Record paper +1 TRO")
    args = ap.parse_args()
    print(
        json.dumps(
            plan_mint(
                args.work,
                collection_creation_cost=args.collection_cost,
                nft_creation_cost=args.nft_cost,
                confirm=args.confirm_mint,
            ),
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
