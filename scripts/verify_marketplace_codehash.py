#!/usr/bin/env python3
"""
P0 ops: verify marketplace + agents accounts on MultiversX mainnet.
Writes data/marketplace_codehash_live.json and optional VITE snippet.
Does not invent equality with local wasm — prints hashes for human/CI compare.
"""
from __future__ import annotations

import json
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
API = "https://api.multiversx.com"


def fetch_account(addr: str) -> dict:
    url = f"{API}/accounts/{addr}"
    with urllib.request.urlopen(url, timeout=30) as r:
        return json.loads(r.read().decode())


def codehash_of(data: dict) -> str | None:
    h = data.get("codeHash") or data.get("code") or None
    if not h or h in ("", "0" * 64):
        return None
    # empty account often has no codeHash key
    code = data.get("code")
    if code is not None and code == "":
        return None
    return h if isinstance(h, str) and len(h) > 8 else None


def check_one(label: str, addr: str | None) -> dict:
    if not addr or not str(addr).startswith("erd1"):
        return {
            "label": label,
            "address": addr,
            "codeHash": None,
            "ok": False,
            "verdict": "NO_ADDRESS",
        }
    try:
        data = fetch_account(addr)
    except Exception as e:
        return {
            "label": label,
            "address": addr,
            "codeHash": None,
            "ok": False,
            "verdict": f"API_ERROR: {e}",
        }
    ch = codehash_of(data)
    empty = not ch
    return {
        "label": label,
        "address": addr,
        "codeHash": ch,
        "balance": data.get("balance"),
        "ok": bool(ch),
        "verdict": "LIVE" if ch else "NOT_DEPLOYED_OR_EMPTY",
        "explorer": f"https://explorer.multiversx.com/accounts/{addr}",
    }


def main() -> int:
    contracts: dict = {}
    p = ROOT / "data" / "contracts.json"
    if p.exists():
        contracts = json.loads(p.read_text(encoding="utf-8")).get("contracts") or {}

    mkt = contracts.get("marketplace")
    agents = contracts.get("agents_marketplace")
    if len(sys.argv) > 1 and sys.argv[1].startswith("erd1"):
        mkt = sys.argv[1]
    if len(sys.argv) > 2 and sys.argv[2].startswith("erd1"):
        agents = sys.argv[2]

    mkt_r = check_one("marketplace", mkt)
    ag_r = check_one("agents_marketplace", agents)

    out = {
        "checked": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "marketplace": mkt_r,
        "agents_marketplace": ag_r,
        "all_ok": bool(mkt_r["ok"] and ag_r["ok"]),
        "vite": {
            "VITE_MARKETPLACE_ADDRESS": mkt or "",
            "VITE_MARKETPLACE_CODEHASH_OK": "1" if mkt_r["ok"] else "0",
            "VITE_AGENTS_MARKETPLACE_ADDRESS": agents or "",
            "VITE_AGENTS_CODEHASH_OK": "1" if ag_r["ok"] else "0",
            "VITE_AGENTS_FEE_BPS": "300",
        },
        "next": [
            "If ok: copy vite block into deploy-pages.yml env + rebuild Pages",
            "python scripts/generate_vite_env.py",
            "Micro List/Buy with USER wallet (never LIA ops session)",
            "Keep LIA_LIVE_TRADING=0 until micro-trades OK",
        ],
        "LIA_LIVE_TRADING_must_be": "0 until micro-trades OK",
    }
    print(json.dumps(out, indent=2))
    path = ROOT / "data" / "marketplace_codehash_live.json"
    path.write_text(json.dumps(out, indent=2), encoding="utf-8")
    print("wrote", path)

    # Also refresh contracts.json verification section
    if p.exists():
        full = json.loads(p.read_text(encoding="utf-8"))
        full["verification"] = {
            "marketplace_mainnet": mkt_r,
            "agents_marketplace": ag_r,
            "checked": out["checked"],
        }
        full["updated"] = out["checked"]
        p.write_text(json.dumps(full, indent=2), encoding="utf-8")
        print("updated", p)

    return 0 if out["all_ok"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
