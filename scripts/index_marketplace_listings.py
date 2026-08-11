#!/usr/bin/env python3
"""
P1 Indexer — build data/listings_index.json from marketplace SC txs (mainnet API).

Usage:
  python scripts/index_marketplace_listings.py
  python scripts/index_marketplace_listings.py erd1qq...   # override SC address

Safe on empty SC: writes empty listings + codehash_ok=false.
Does not require PEM. Commit/push result for GH Pages / Vellum mirror.
"""
from __future__ import annotations

import json
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
API = "https://api.multiversx.com"
OUT = ROOT / "data" / "listings_index.json"
CONTRACTS = ROOT / "data" / "contracts.json"

# Historical empty placeholder — never treat as live
KNOWN_EMPTY = "erd1qqqqqqqqqqqqqpgqjzn7zjyevwez8n0zfevpvnrwyp2ln879yj7sj8354t"


def get_json(url: str):
    with urllib.request.urlopen(url, timeout=45) as r:
        return json.loads(r.read().decode())


def hex_to_utf8(h: str) -> str:
    try:
        if len(h) % 2:
            h = "0" + h
        return bytes.fromhex(h).decode("utf-8", errors="ignore")
    except Exception:
        return ""


def parse_listing_id(data: str | None) -> int | None:
    if not data:
        return None
    parts = data.split("@")
    for i, p in enumerate(parts):
        if not p:
            continue
        fn = hex_to_utf8(p) if all(c in "0123456789abcdefABCDEF" for c in p) else p
        if fn in ("buyNft", "placeBid", "acceptBid", "cancelListing", "withdrawBid", "listNft"):
            if i + 1 < len(parts) and parts[i + 1]:
                try:
                    return int(parts[i + 1], 16)
                except ValueError:
                    return None
    return None


def main() -> int:
    addr = None
    if CONTRACTS.exists():
        c = json.loads(CONTRACTS.read_text(encoding="utf-8"))
        addr = (c.get("contracts") or {}).get("marketplace")
    if len(sys.argv) > 1 and sys.argv[1].startswith("erd1"):
        addr = sys.argv[1]

    if not addr:
        print("No marketplace address")
        return 1

    codehash_ok = False
    code_hash = None
    try:
        acc = get_json(f"{API}/accounts/{addr}")
        code_hash = acc.get("codeHash") or None
        if code_hash and code_hash not in ("", "0" * 64):
            codehash_ok = True
        if addr.lower() == KNOWN_EMPTY.lower() and not codehash_ok:
            codehash_ok = False
    except Exception as e:
        print("account fetch failed", e)

    listings: list[dict] = []
    activity: list[dict] = []

    if codehash_ok:
        try:
            txs = get_json(
                f"{API}/accounts/{addr}/transactions?size=100&status=success&withScResults=true"
            )
            if not isinstance(txs, list):
                txs = []
            seen_ids: set[int] = set()
            for t in txs:
                fn = t.get("function") or (t.get("action") or {}).get("name")
                lid = parse_listing_id(t.get("data"))
                if lid is None and isinstance(t.get("arguments"), list) and t["arguments"]:
                    try:
                        lid = int(t["arguments"][0])
                    except (TypeError, ValueError):
                        pass
                activity.append(
                    {
                        "txHash": t.get("txHash") or t.get("hash"),
                        "function": fn,
                        "listingIdHint": lid,
                        "sender": t.get("sender"),
                        "timestamp": t.get("timestamp"),
                    }
                )
                # Best-effort catalog: listNft events only for active hints
                if lid is not None and fn in ("listNft", "list") and lid not in seen_ids:
                    seen_ids.add(lid)
                    listings.append(
                        {
                            "listing_id": lid,
                            "token_id": "",
                            "nonce": 0,
                            "price_egld": "",
                            "seller": t.get("sender") or "",
                            "active": True,
                            "tx_list": t.get("txHash") or t.get("hash"),
                        }
                    )
        except Exception as e:
            print("txs fetch failed", e)
    else:
        print("SC not live (no codeHash) — writing empty index")

    out = {
        "version": 1,
        "network": "mainnet",
        "updated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "marketplace_address": addr,
        "codehash_ok": codehash_ok,
        "codeHash": code_hash,
        "note": (
            "Live index"
            if codehash_ok
            else "Empty until deploy + codeHash. Do not send user funds to known-empty address."
        ),
        "listings": listings,
        "activity": activity[:40],
        "schema": {
            "listing_id": "u64 on-chain",
            "token_id": "COLLECTION-xxxxxx",
            "nonce": "u64",
            "price_egld": "string decimal",
            "seller": "erd1…",
            "active": "bool",
            "tx_list": "optional hash",
        },
    }
    OUT.write_text(json.dumps(out, indent=2), encoding="utf-8")
    print("wrote", OUT)
    print("codehash_ok=", codehash_ok, "listings=", len(listings), "activity=", len(activity))
    return 0 if codehash_ok or addr else 2


if __name__ == "__main__":
    raise SystemExit(main())
