#!/usr/bin/env python3
"""Update data/contracts.json after mainnet deploy. Never invents addresses."""
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "data" / "contracts.json"


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--agents", default=None, help="agents_marketplace erd1...")
    p.add_argument("--marketplace", default=None, help="nft marketplace erd1...")
    args = p.parse_args()
    data = {}
    if PATH.exists():
        data = json.loads(PATH.read_text(encoding="utf-8"))
    data.setdefault("network", "mainnet")
    data.setdefault("chainId", "1")
    data["updated"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    contracts = data.setdefault("contracts", {})
    if args.agents:
        if not args.agents.startswith("erd1"):
            raise SystemExit("agents address must be erd1...")
        contracts["agents_marketplace"] = args.agents
    if args.marketplace:
        if not args.marketplace.startswith("erd1"):
            raise SystemExit("marketplace address must be erd1...")
        contracts["marketplace"] = args.marketplace
    data["contracts"] = contracts
    data["gaps"] = {
        "agents_marketplace": None if contracts.get("agents_marketplace") else "P0 deploy",
        "marketplace_placeBid": "Confirm codehash includes placeBid",
    }
    PATH.write_text(json.dumps(data, indent=2), encoding="utf-8")
    print("wrote", PATH)
    print(json.dumps(contracts, indent=2))


if __name__ == "__main__":
    main()
