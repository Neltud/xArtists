#!/usr/bin/env python3
"""
P0 ops: fetch live marketplace account from MultiversX API and print codeHash.
Compare manually to local wasm build. Does not invent equality.
"""
from __future__ import annotations

import json
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
API = "https://api.multiversx.com"


def main() -> int:
    contracts = {}
    p = ROOT / "data" / "contracts.json"
    if p.exists():
        contracts = json.loads(p.read_text(encoding="utf-8")).get("contracts") or {}
    addr = contracts.get("marketplace") or ""
    if len(sys.argv) > 1:
        addr = sys.argv[1]
    if not addr.startswith("erd1"):
        print("Usage: python scripts/verify_marketplace_codehash.py [erd1...]")
        print("No marketplace address in data/contracts.json")
        return 1

    url = f"{API}/accounts/{addr}"
    with urllib.request.urlopen(url, timeout=30) as r:
        data = json.loads(r.read().decode())

    code_hash = data.get("codeHash") or data.get("code") or data.get("rootHash")
    out = {
        "address": addr,
        "codeHash": code_hash,
        "balance": data.get("balance"),
        "explorer": f"https://explorer.multiversx.com/accounts/{addr}",
        "check": [
            "Build contracts/nft-marketplace wasm locally",
            "Compare codeHash to explorer / this output",
            "If mismatch: redeploy before enabling Bid UI as live",
            "Expected endpoints: listNft buyNft placeBid acceptBid withdrawBid cancelListing claimFees",
        ],
        "agents_marketplace": contracts.get("agents_marketplace"),
        "LIA_LIVE_TRADING_must_be": "0 until micro-trades OK",
    }
    print(json.dumps(out, indent=2))
    path = ROOT / "data" / "marketplace_codehash_live.json"
    path.write_text(json.dumps(out, indent=2), encoding="utf-8")
    print("wrote", path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
