#!/usr/bin/env python3
"""Sprint 1 — compare data/contracts.json pinned codeHash vs live MultiversX API.

Read-only. Exit 0 if all pinned hashes match live; 2 on mismatch; 1 on API error.
Does not set any VITE_* flags and does not touch secrets.
"""
from __future__ import annotations

import json
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
API = "https://api.multiversx.com"


def fetch_codehash(addr: str) -> str | None:
    url = f"{API}/accounts/{addr}"
    with urllib.request.urlopen(url, timeout=30) as r:
        data = json.loads(r.read().decode())
    h = data.get("codeHash")
    if not h or not isinstance(h, str) or len(h) < 8:
        return None
    return h


def main() -> int:
    path = ROOT / "data" / "contracts.json"
    if not path.exists():
        print("missing data/contracts.json", file=sys.stderr)
        return 1
    full = json.loads(path.read_text(encoding="utf-8"))
    addresses = full.get("addresses") or full.get("contracts") or {}
    pinned = full.get("codeHash") or {}

    # normalize keys: contracts.json uses both styles
    key_map = {
        "agents_marketplace": "agents_marketplace",
        "nft_marketplace": "nft_marketplace",
        "marketplace": "nft_marketplace",
        "treasury_splitter": "treasury_splitter",
        "tro_staking": "tro_staking",
        "tro_staking_legacy": "tro_staking_legacy",
        "venue_split": "venue_split",
        "nft_staking": "nft_staking",
        "tro_governance": "tro_governance",
        "agent_stake_escrow": "agent_stake_escrow",
        "slot_casino": "slot_casino",
    }

    results = []
    mismatches = 0
    errors = 0
    for label, pin_key in key_map.items():
        addr = addresses.get(label) or addresses.get(pin_key)
        expected = pinned.get(pin_key) or pinned.get(label)
        if not addr or not expected:
            continue
        try:
            live = fetch_codehash(addr)
        except Exception as e:
            results.append({"label": label, "error": str(e), "ok": False})
            errors += 1
            continue
        ok = live == expected
        if not ok:
            mismatches += 1
        results.append(
            {
                "label": label,
                "address": addr,
                "pinned": expected,
                "live": live,
                "ok": ok,
            }
        )

    out = {
        "checked": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "results": results,
        "mismatches": mismatches,
        "errors": errors,
        "all_ok": mismatches == 0 and errors == 0 and len(results) > 0,
    }
    print(json.dumps(out, indent=2))
    out_path = ROOT / "data" / "codehash_pin_check.json"
    out_path.write_text(json.dumps(out, indent=2), encoding="utf-8")
    print("wrote", out_path)

    if errors:
        return 1
    if mismatches:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
