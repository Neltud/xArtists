#!/usr/bin/env python3
"""Adaptive tx confirmation poll — MultiversX mainnet (Supernova-friendly).

Fast start intervals for low latency finality, then backoff.
Exits 0 on success, 1 on fail, 2 on timeout.

Usage:
  python scripts/confirm_tx_mainnet.py <txHash>
  python scripts/confirm_tx_mainnet.py <txHash> --timeout 120
"""
from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.request

API = "https://api.multiversx.com"


def fetch_tx(tx_hash: str) -> dict | None:
    url = f"{API}/transactions/{tx_hash}?withResults=true"
    try:
        with urllib.request.urlopen(url, timeout=12) as r:
            return json.loads(r.read().decode())
    except Exception as e:
        print(f"  poll error: {e}")
        return None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("tx_hash")
    ap.add_argument("--timeout", type=int, default=120)
    ap.add_argument("--api", default=API)
    args = ap.parse_args()
    global API
    API = args.api.rstrip("/")

    txh = args.tx_hash.strip().lower()
    if len(txh) != 64:
        print("❌ tx hash must be 64 hex chars")
        return 1

    start = time.time()
    # Supernova: often final in a few seconds — poll aggressively first
    intervals = [0.4, 0.5, 0.6, 0.8, 1.0, 1.2, 1.5, 2.0, 3.0, 4.0, 6.0]
    i = 0
    print(f"Confirming {txh[:16]}… (timeout {args.timeout}s)")

    while time.time() - start < args.timeout:
        data = fetch_tx(txh)
        if data:
            status = (data.get("status") or "").lower()
            print(f"  status={status}  t={time.time()-start:.1f}s")
            if status == "success":
                sc = data.get("contractAddress") or data.get("receiver")
                results = data.get("results") or data.get("smartContractResults") or []
                print(
                    json.dumps(
                        {
                            "status": "success",
                            "txHash": txh,
                            "contractAddress": sc,
                            "gasUsed": data.get("gasUsed"),
                            "fee": data.get("fee"),
                            "results_n": len(results) if isinstance(results, list) else 0,
                            "confirm_sec": round(time.time() - start, 2),
                        },
                        indent=2,
                    )
                )
                return 0
            if status in ("fail", "failed", "invalid", "executed", "execution failed"):
                if status == "executed":
                    rc = data.get("returnCode") or data.get("returnMessage")
                    if str(rc) in ("ok", "0", "") or rc is None:
                        print(
                            json.dumps(
                                {
                                    "status": "success",
                                    "txHash": txh,
                                    "note": "executed",
                                    "confirm_sec": round(time.time() - start, 2),
                                },
                                indent=2,
                            )
                        )
                        return 0
                print(
                    json.dumps(
                        {
                            "status": status,
                            "txHash": txh,
                            "returnMessage": data.get("returnMessage")
                            or data.get("returnCode"),
                        },
                        indent=2,
                    )
                )
                return 1
        sleep_s = intervals[min(i, len(intervals) - 1)]
        i += 1
        time.sleep(sleep_s)

    print(
        f"❌ timeout after {args.timeout}s — "
        f"https://explorer.multiversx.com/transactions/{txh}"
    )
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
