#!/usr/bin/env python3
"""Estimate MultiversX SC deploy gas from WASM size.

Mainnet gas limit hard-cap: 600_000_000.
Data cost is dominated by bytecode size; we add a safety buffer.

Usage:
  python scripts/estimate_deploy_gas.py contracts/agents-marketplace/output/*.wasm
  python scripts/estimate_deploy_gas.py --bytes 120000
  GAS_LIMIT=$(python scripts/estimate_deploy_gas.py path/to.wasm --print-only)
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

NETWORK_MAX = 600_000_000
NETWORK_MIN_SANE = 50_000_000
# Empirical MVX deploy: base + per-byte (conservative vs protocol constants)
BASE = 80_000
PER_BYTE = 1_800
BUFFER_RATIO = 1.35  # headroom for init + metadata
FLOOR = 120_000_000  # small wasm still needs room for init(fee_bps)


def estimate(bytes_size: int) -> dict:
    raw = BASE + PER_BYTE * max(0, bytes_size)
    buffered = int(raw * BUFFER_RATIO)
    recommended = min(NETWORK_MAX, max(FLOOR, buffered))
    data_only = BASE + PER_BYTE * max(0, bytes_size)
    return {
        "bytes": bytes_size,
        "data_gas_est": data_only,
        "with_buffer": buffered,
        "recommended_gas_limit": recommended,
        "network_max": NETWORK_MAX,
        "ok": recommended <= NETWORK_MAX and data_only < NETWORK_MAX,
        "headroom": NETWORK_MAX - recommended,
    }


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("wasm", nargs="?", help="Path to .wasm")
    p.add_argument("--bytes", type=int, default=None)
    p.add_argument("--print-only", action="store_true", help="Print only gas limit integer")
    p.add_argument("--check", type=int, default=None, help="Exit 2 if this GAS_LIMIT is too low")
    args = p.parse_args()

    if args.bytes is not None:
        n = args.bytes
    elif args.wasm:
        path = Path(args.wasm)
        if not path.is_file():
            print(f"❌ wasm not found: {path}", file=sys.stderr)
            return 1
        n = path.stat().st_size
    else:
        print("Provide wasm path or --bytes", file=sys.stderr)
        return 1

    est = estimate(n)
    if args.print_only:
        print(est["recommended_gas_limit"])
        return 0

    print("=== Deploy gas estimate ===")
    for k, v in est.items():
        print(f"  {k}: {v}")

    if args.check is not None:
        if args.check < est["data_gas_est"]:
            print(f"❌ GAS_LIMIT {args.check} < data_gas_est {est['data_gas_est']}")
            return 2
        if args.check < est["recommended_gas_limit"] * 0.9:
            print(f"⚠️  GAS_LIMIT {args.check} below recommended {est['recommended_gas_limit']}")
        else:
            print(f"✅ GAS_LIMIT {args.check} OK vs recommended {est['recommended_gas_limit']}")
    return 0 if est["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
