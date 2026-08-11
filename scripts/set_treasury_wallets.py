#!/usr/bin/env python3
"""Register Mission / Reserve / Reward addresses after mxpy wallet new.
Never stores PEM. Updates data/treasury_wallets.json + contracts.json wallets.
"""
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "data" / "treasury_wallets.json"
CONTRACTS = ROOT / "data" / "contracts.json"


def _erd(addr: str, name: str) -> str:
    if not addr.startswith("erd1") or len(addr) < 20:
        raise SystemExit(f"{name} must be erd1…")
    return addr


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--mission", default=None)
    ap.add_argument("--reserve", default=None)
    ap.add_argument("--reward", default=None)
    args = ap.parse_args()

    # ensure schema
    from init_treasury_schema import main as init_main  # type: ignore

    try:
        init_main()
    except Exception:
        pass

    data = json.loads(PATH.read_text(encoding="utf-8")) if PATH.exists() else {"wallets": {}}
    data.setdefault("wallets", {})
    data["updated"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    if args.mission:
        a = _erd(args.mission, "mission")
        data["wallets"]["mission"] = {
            "address": a,
            "role": "Treasury Mission",
            "status": "live",
            "note": "Grants / art — not LIA signing",
        }
    if args.reserve:
        a = _erd(args.reserve, "reserve")
        data["wallets"]["reserve"] = {
            "address": a,
            "role": "Treasury Reserve",
            "status": "live",
            "note": "Runway / risk",
        }
    if args.reward:
        a = _erd(args.reward, "reward")
        data["wallets"]["reward"] = {
            "address": a,
            "role": "Treasury Reward / Incentives",
            "status": "live",
            "note": "Pack pool + creator incentives",
        }

    PATH.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    print("wrote", PATH)

    if CONTRACTS.exists():
        c = json.loads(CONTRACTS.read_text(encoding="utf-8"))
        c.setdefault("wallets", {})
        for k in ("mission", "reserve", "reward"):
            w = data["wallets"].get(k) or {}
            if w.get("address"):
                c["wallets"][k] = w["address"]
        c["updated"] = data["updated"]
        CONTRACTS.write_text(json.dumps(c, indent=2) + "\n", encoding="utf-8")
        print("updated", CONTRACTS)

    print(json.dumps({k: data["wallets"].get(k) for k in ("mission", "reserve", "reward", "ops", "lia_ops")}, indent=2))
    print("Update docs/TREASURY_POLICY.md with addresses.")


if __name__ == "__main__":
    main()
