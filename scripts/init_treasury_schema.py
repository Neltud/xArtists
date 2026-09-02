#!/usr/bin/env python3
"""Ensure 4 treasury slots: Mission, Reserve, Reward, Ops (lia_ops).
Does not create keys. Never writes PEM.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "data" / "treasury_wallets.json"
LIA_OPS = "erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6"


def slot(address, role, status, note):
    return {"address": address, "role": role, "status": status, "note": note}


def main() -> None:
    data = {}
    if PATH.exists():
        data = json.loads(PATH.read_text(encoding="utf-8"))
    wallets = data.setdefault("wallets", {})

    wallets.setdefault(
        "lia_ops",
        slot(LIA_OPS, "Ops / Protocol (LIA)", "live", "Execution LIA — never user Connect"),
    )
    # alias ops → same as lia_ops for 4-name schema
    wallets["ops"] = {
        **wallets["lia_ops"],
        "role": "Ops (alias lia_ops)",
        "note": "Same address as lia_ops — gas/dev runway",
    }
    wallets.setdefault(
        "mission",
        slot(None, "Treasury Mission", "CREATE_REQUIRED", "Grants, art, drops — prefer multisig"),
    )
    wallets.setdefault(
        "reserve",
        slot(None, "Treasury Reserve", "CREATE_REQUIRED", "Runway, drawdown — prefer multisig"),
    )
    wallets.setdefault(
        "reward",
        slot(
            None,
            "Treasury Reward / Incentives",
            "CREATE_REQUIRED",
            "Pack pool share, creator 1 TRO max, listing incentives",
        ),
    )

    data["version"] = 2
    data["network"] = "mainnet"
    data["updated"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    data["schema"] = ["mission", "reserve", "reward", "ops"]
    data["split_indicative_bps"] = {
        "mission": 4000,
        "reserve": 3000,
        "ops": 2000,
        "reward": 1000,
        "note": "Align TREASURY_POLICY / splitter SC when live",
    }
    data["create_steps"] = [
        "mxpy wallet new --format pem --outfile mission.pem",
        "mxpy wallet new --format pem --outfile reserve.pem",
        "mxpy wallet new --format pem --outfile reward.pem",
        "python scripts/set_treasury_wallets.py --mission erd1… --reserve erd1… --reward erd1…",
        "PEM offline only — never git",
    ]
    data["split_policy"] = "docs/TREASURY_POLICY.md"
    data["frontend"] = {
        "display": "Public treasury balances — null address = show CREATE_REQUIRED",
        "never_login_ops_as_user": True,
    }

    PATH.parent.mkdir(parents=True, exist_ok=True)
    PATH.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"wrote": str(PATH), "schema": data["schema"], "wallets": {
        k: {"address": v.get("address"), "status": v.get("status")} for k, v in wallets.items()
        if k in ("mission", "reserve", "reward", "ops", "lia_ops")
    }}, indent=2))


if __name__ == "__main__":
    main()
