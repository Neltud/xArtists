#!/usr/bin/env python3
"""Probe product SC deploy status on MultiversX mainnet.

Usage:
  python3 scripts/ops_sc_status.py
  python3 scripts/ops_sc_status.py --json

Exit 0 always (ops report). Exit 2 if --strict and any NOT_DEPLOYED.
"""
from __future__ import annotations

import argparse
import json
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTRACTS = ROOT / "data" / "contracts.json"
API = "https://api.multiversx.com"


def get_account(addr: str) -> dict:
    req = urllib.request.Request(
        f"{API}/accounts/{addr}",
        headers={"User-Agent": "xArtists-ops-sc-status/1.0"},
    )
    with urllib.request.urlopen(req, timeout=25) as r:
        return json.loads(r.read().decode())


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--strict", action="store_true", help="exit 2 if any NOT_DEPLOYED")
    args = ap.parse_args()

    data = json.loads(CONTRACTS.read_text(encoding="utf-8"))
    contracts = data.get("contracts") or {}
    rows = []
    any_down = False

    for name, addr in contracts.items():
        if not addr or not str(addr).startswith("erd1"):
            rows.append(
                {
                    "name": name,
                    "address": addr,
                    "codeHash": None,
                    "status": "NO_ADDRESS",
                }
            )
            any_down = True
            continue
        try:
            acc = get_account(str(addr))
            ch = acc.get("codeHash")
            code = acc.get("code") or ""
            if ch:
                status = "DEPLOYED"
            elif isinstance(code, str) and len(code) > 10:
                status = "CODE_PRESENT"
            else:
                status = "NOT_DEPLOYED"
                any_down = True
            rows.append(
                {
                    "name": name,
                    "address": addr,
                    "codeHash": ch,
                    "balance": acc.get("balance"),
                    "status": status,
                }
            )
        except Exception as e:
            rows.append(
                {
                    "name": name,
                    "address": addr,
                    "codeHash": None,
                    "status": f"ERROR:{type(e).__name__}",
                }
            )
            any_down = True

    report = {
        "verdict": data.get("ui_status", {}).get("verdict", "GO_DEMO"),
        "updated_file": data.get("updated"),
        "rows": rows,
        "all_deployed": not any_down,
    }

    if args.json:
        print(json.dumps(report, indent=2))
    else:
        print(f"verdict={report['verdict']}  contracts.json updated={report['updated_file']}")
        print(f"{'name':<22} {'status':<14} address")
        print("-" * 72)
        for r in rows:
            print(f"{r['name']:<22} {r['status']:<14} {r.get('address') or '—'}")
        print("-" * 72)
        print("all_deployed=" + str(report["all_deployed"]))
        print("Next: docs/SC_DEPLOY_CHECKLIST.md · scripts/preflight_deploy_mainnet.sh")

    if args.strict and any_down:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
