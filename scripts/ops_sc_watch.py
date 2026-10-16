#!/usr/bin/env python3
"""Ops SC watch — codeHash + balance vs MAINNET expected (P0 continuous).

Usage:
  python3 scripts/ops_sc_watch.py
  python3 scripts/ops_sc_watch.py --json
  BALANCE_ALERT_EGLD=2 python3 scripts/ops_sc_watch.py

Exit 0 = all codeHash OK and balances under alert threshold
Exit 1 = mismatch or high balance or API error on critical SC
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.request
from typing import Any

API = os.environ.get("MVX_API", "https://api.multiversx.com").rstrip("/")
BALANCE_ALERT = float(os.environ.get("BALANCE_ALERT_EGLD", "2"))

# Keep in sync with apps/frontend/src/config/contracts.ts MAINNET_*
SCS: list[dict[str, str]] = [
    {
        "id": "venue_split",
        "addr": "erd1qqqqqqqqqqqqqpgqvy4qejg6lds00hy829nwmyxktrdqsuq3vhxq2vje2y",
        "hash": "SRrGio4iLmtQrb22JJhapwobNgavYsoQ52WmfT1owuY=",
    },
    {
        "id": "nft_marketplace",
        "addr": "erd1qqqqqqqqqqqqqpgqx0araa285cdepdsfe8s23mer30r3dh9lvhxqq8txmm",
        "hash": "8TTszCmNyPZXjrzQ/fSKXX8+QzW7wFtCfdmiKsZBgFc=",
    },
    {
        "id": "agents_marketplace",
        "addr": "erd1qqqqqqqqqqqqqpgqgawa0p5y09f0e68pwaa50zm47jl9jxcwvhxqgdqwsg",
        "hash": "igm9oUpgad+QO2cQqhphuLZuicEBNR7jdcQHk8YEe00=",
    },
    {
        "id": "nft_staking",
        "addr": "erd1qqqqqqqqqqqqqpgq9ensu3f3p9yx4a583swu0raq8zzeve7tvhxq4fgtgu",
        "hash": "hXcRjpclnq0jsonSIemM17+tszcWpPjWKtCPUfnMuME=",
    },
    {
        "id": "tro_staking",
        "addr": "erd1qqqqqqqqqqqqqpgqes0a2kryurmt34g7nu4kx9n4ftj77dl5vhxqpe3xf3",
        "hash": "Jf5ZhzAGu58ez0njdWoZAnRxP7YevYSX9dpO8pGq7SA=",
    },
    {
        "id": "tro_governance",
        "addr": "erd1qqqqqqqqqqqqqpgqe6xrgq2y53q8d0lsact2dppzvg42t4wcvhxq9e9euy",
        "hash": "+9aNhboFyQuvteDzjkiQHdRTlXAtFyijK+iXV74UOsQ=",
    },
    {
        "id": "agent_stake_escrow",
        "addr": "erd1qqqqqqqqqqqqqpgqzyvwldu6jq8w6ry6s856dl0uy7g0v37vvhxqndvzr3",
        "hash": "Hs3AClbYzDpyZ6f/UjB9gBekiYKApXGxcVWy3mmlSnE=",
    },
    {
        "id": "treasury_splitter",
        "addr": "erd1qqqqqqqqqqqqqpgq245sma97w0j9ga9jdgxu36zs0v8g0y6evhxq2nkezv",
        "hash": "9pB9+UN372QxE77Nj8TUjWn6+Q6qtOPhmmXgUdLnpk8=",
    },
    {
        "id": "slot_casino",
        "addr": "erd1qqqqqqqqqqqqqpgquf3cuv2zsfsahy7ypvter3qcep4ptthsvhxqs4g34f",
        "hash": "UZ0nX6dWsSgkVqjnFnR5zPNPk1UrNtR5SsrYf96VJCs=",
    },
]


def fetch_account(addr: str) -> dict[str, Any]:
    req = urllib.request.Request(
        f"{API}/accounts/{addr}",
        headers={"User-Agent": "xArtists-ops-sc-watch/1"},
    )
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode())


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    rows: list[dict[str, Any]] = []
    hard_fail = False
    ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    for sc in SCS:
        row: dict[str, Any] = {
            "id": sc["id"],
            "addr": sc["addr"],
            "expected": sc["hash"],
        }
        try:
            acc = fetch_account(sc["addr"])
            live = acc.get("codeHash") or acc.get("codehash") or ""
            bal_atomic = int(acc.get("balance") or 0)
            bal_egld = bal_atomic / 1e18
            owner = acc.get("ownerAddress") or ""
            match = "OK" if live == sc["hash"] else ("NULL" if not live else "MISMATCH")
            if match != "OK":
                hard_fail = True
            if bal_egld >= BALANCE_ALERT:
                hard_fail = True
                row["balance_alert"] = True
            row.update(
                {
                    "match": match,
                    "live": live,
                    "balance_egld": round(bal_egld, 6),
                    "owner": owner,
                }
            )
        except Exception as e:
            hard_fail = True
            row.update({"match": "ERROR", "error": f"{type(e).__name__}: {e}"})
        rows.append(row)

    payload = {
        "ts": ts,
        "api": API,
        "balance_alert_egld": BALANCE_ALERT,
        "results": rows,
        "ok": not hard_fail,
        "pause_hint": "On MISMATCH: set VITE_*_CODEHASH_OK=0 and owner setPaused(true)",
    }

    if args.json:
        print(json.dumps(payload, indent=2))
    else:
        print(f"=== ops_sc_watch {ts} (alert ≥ {BALANCE_ALERT} EGLD) ===")
        print(f"{'SC':22} {'MATCH':10} {'BALANCE':12} OWNER")
        for r in rows:
            bal = r.get("balance_egld")
            bal_s = f"{bal:.6f}" if isinstance(bal, float) else "?"
            own = (r.get("owner") or "—")[:18]
            flag = " ⚠" if r.get("balance_alert") or r.get("match") != "OK" else ""
            print(f"{r['id']:22} {r.get('match','?'):10} {bal_s:12} {own}{flag}")
            if r.get("match") == "MISMATCH":
                print(f"  expected {r['expected']}")
                print(f"  live     {r.get('live')}")
            if r.get("error"):
                print(f"  {r['error']}")
        print("---")
        print("OK" if not hard_fail else "FAIL — review before keeping gates live")

    return 1 if hard_fail else 0


if __name__ == "__main__":
    raise SystemExit(main())
