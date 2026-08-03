"""
Post-buy agent fulfillment — API key (limited) + badge mint intent + receipt.
Triggered by Vellum after detecting buyAgentAction success (not by browser).
"""
from __future__ import annotations

import hashlib
import json
import secrets
import time
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "data" / "agent_purchases"


def _api_key(agent_id: str, buyer: str) -> str:
    raw = f"{agent_id}:{buyer}:{secrets.token_hex(16)}"
    return "xart_" + hashlib.sha256(raw.encode()).hexdigest()[:32]


def fulfill_purchase(
    *,
    listing_id: int,
    agent_id: str,
    buyer: str,
    tx_hash: str,
    price_egld: float,
) -> dict[str, Any]:
    """
    Create receipt + limited API key record.
    Badge mint is recorded as intent for mxpy/minter (ops).
    """
    key = _api_key(agent_id, buyer)
    receipt = {
        "version": "1",
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "listing_id": listing_id,
        "agent_id": agent_id,
        "buyer": buyer,
        "tx_hash": tx_hash,
        "price_egld": price_egld,
        "deliverables": {
            "api_key_prefix": key[:10] + "…",
            "api_key_full_storage": "vellum_secret_only",
            "nft_badge": {
                "status": "pending_mint",
                "collection_hint": "XARTISTS-AGENT-BADGE",
                "metadata": {"agent_id": agent_id, "buyer": buyer, "tx": tx_hash},
            },
            "receipt": True,
        },
        "api_key_hash": hashlib.sha256(key.encode()).hexdigest(),
        "scopes": [f"agent:{agent_id}:read", f"agent:{agent_id}:invoke_limited"],
        "rate_limit_per_day": 100,
        "note": "Full API key returned only via secure Vellum channel to buyer — never commit plaintext key",
    }
    # Store hash only in public data; full key must stay in secret manager
    public = {**receipt, "api_key_plaintext": None}
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"{tx_hash or listing_id}.json"
    path.write_text(json.dumps(public, indent=2), encoding="utf-8")
    return {"receipt_path": str(path), "api_key_once": key, "public": public}


if __name__ == "__main__":
    r = fulfill_purchase(
        listing_id=1,
        agent_id="lia-trading-v1",
        buyer="erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gqag2",
        tx_hash="deadbeef",
        price_egld=1.0,
    )
    print(json.dumps({k: r[k] for k in ("receipt_path", "public")}, indent=2))
