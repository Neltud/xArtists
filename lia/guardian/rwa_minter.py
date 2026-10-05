"""
RWA NFT mint planner — digital twin metadata + HITL mint proposal.
Does NOT broadcast mint unless LIA_LIVE_TRADING=1 and ops confirm (future ESDTIssue).

  PYTHONPATH=. python -m lia.guardian.rwa_minter --work rwa_001
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


def plan_mint(work_id: str) -> dict[str, Any]:
    from lia.brain.rwa_evaluator import load_catalog

    items = load_catalog()
    work = next((x for x in items if x.get("id") == work_id), None)
    if not work:
        return {"ok": False, "reason": "work_not_found"}

    val = work.get("valuation") or {}
    cert = work.get("certificate_hash") or hashlib.sha256(work_id.encode()).hexdigest()
    report = {
        "work_id": work_id,
        "score": val.get("score"),
        "price_proxy_usd": val.get("price_proxy_usd"),
        "certificate_sha256": cert,
        "valuation_ts": val.get("ts"),
        "disclaimer": val.get("disclaimer"),
    }
    attributes = {
        "artist": work.get("artist"),
        "title": work.get("title"),
        "style": work.get("style"),
        "condition": work.get("condition"),
        "provenance": work.get("provenance"),
        "rwa": True,
        "certificate_sha256": cert,
        "ai_value_score": val.get("score"),
    }
    live = os.environ.get("LIA_LIVE_TRADING", "0").strip() in ("1", "true", "TRUE")
    proposal = {
        "schema": "rwa_mint_proposal/v1",
        "status": "pending_human",
        "work_id": work_id,
        "token_name": f"XARWA-{work_id[-3:].upper()}",
        "ticker_hint": "XARWA",
        "attributes": attributes,
        "valuation_report": report,
        "calldata_note": "Use Studio / ESDTIssue NFT flow or collection SC — not auto-broadcast",
        "LIA_LIVE_TRADING": live,
        "broadcast": False,
        "created": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    DATA.mkdir(parents=True, exist_ok=True)
    path = DATA / f"rwa_mint_{work_id}.json"
    path.write_text(json.dumps(proposal, indent=2), encoding="utf-8")
    try:
        from lia.utils.audit_log import audit

        audit("rwa_mint_proposal", work_id=work_id, path=str(path))
    except Exception:
        pass
    return {"ok": True, "proposal": proposal, "path": str(path)}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--work", type=str, default="rwa_001")
    args = ap.parse_args()
    print(json.dumps(plan_mint(args.work), indent=2))


if __name__ == "__main__":
    main()
