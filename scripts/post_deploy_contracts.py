#!/usr/bin/env python3
"""Update data/contracts.json + .env.mainnet.example after deploy."""
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "data" / "contracts.json"
VITE_OUT = ROOT / "apps" / "frontend" / ".env.mainnet.example"


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--agents", default=None)
    p.add_argument("--marketplace", default=None)
    p.add_argument("--tro-burn", default=None, dest="tro_burn")
    p.add_argument("--treasury-splitter", default=None, dest="treasury_splitter")
    p.add_argument("--rwa-escrow", default=None, dest="rwa_escrow")
    args = p.parse_args()
    data: dict = json.loads(PATH.read_text()) if PATH.exists() else {}
    data.setdefault("network", "mainnet")
    data.setdefault("chainId", "1")
    data["updated"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    contracts = data.setdefault("contracts", {})
    mapping = (
        ("agents_marketplace", args.agents),
        ("marketplace", args.marketplace),
        ("tro_burn", args.tro_burn),
        ("treasury_splitter", args.treasury_splitter),
        ("rwa_escrow_bridge", args.rwa_escrow),
    )
    for key, val in mapping:
        if val:
            if not val.startswith("erd1"):
                raise SystemExit(f"{key} must be erd1...")
            contracts[key] = val
    data["contracts"] = contracts
    mkt = contracts.get("marketplace")
    ag = contracts.get("agents_marketplace")
    tb = contracts.get("tro_burn")
    ts = contracts.get("treasury_splitter")
    data["verification"] = {
        "marketplace_mainnet": {"address": mkt, "note": "verify codeHash"},
        "agents_marketplace": ag or "null",
        "tro_burn": tb or "null",
        "treasury_splitter": ts or "null — deploy_treasury_splitter.sh 40/30/20/10",
    }
    data["gaps"] = {
        "agents_marketplace": None if ag else "P0 deploy FEE_BPS=300",
        "marketplace": None if mkt else "P0 deploy + codeHash",
        "tro_burn": None if tb else "Deploy + ESDTLocalBurn + fundRewards",
        "treasury_splitter": None
        if ts
        else "P0 after Mission+Reserve+Reward+Ops; receiveAndSplit 40/30/20/10",
        "LIA_LIVE_TRADING": "Keep 0 until micro-trades OK",
    }
    PATH.write_text(json.dumps(data, indent=2) + "\n")
    lines = [
        "VITE_CHAIN_ID=1",
        f"VITE_MARKETPLACE_ADDRESS={mkt or ''}",
        f"VITE_AGENTS_MARKETPLACE_ADDRESS={ag or ''}",
        "VITE_AGENTS_FEE_BPS=300",
        f"VITE_TRO_BURN_ADDRESS={tb or ''}",
        f"VITE_TREASURY_SPLITTER_ADDRESS={ts or ''}",
        "VITE_TRO_BURN_CODEHASH_OK=0",
        "VITE_TRO_TOKEN_ID=TRO-94c925",
        "VITE_TRO_DECIMALS=6",
        "VITE_TRO_BURN_EGLD_PER_TRO=0.001",
        "VITE_LIA_PROTOCOL_WALLET=erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6",
        "",
    ]
    VITE_OUT.write_text("\n".join(lines))
    print("wrote", PATH, VITE_OUT)


if __name__ == "__main__":
    main()
