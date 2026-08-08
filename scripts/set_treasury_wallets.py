#!/usr/bin/env python3
"""Register Mission + Reserve addresses after mxpy wallet new.
Never stores PEM. Updates data/treasury_wallets.json + TREASURY_POLICY placeholders note.
"""
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "data" / "treasury_wallets.json"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--mission", default=None)
    ap.add_argument("--reserve", default=None)
    args = ap.parse_args()
    data = json.loads(PATH.read_text(encoding="utf-8")) if PATH.exists() else {"wallets": {}}
    data.setdefault("wallets", {})
    data["updated"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    if args.mission:
        if not args.mission.startswith("erd1"):
            raise SystemExit("mission must be erd1...")
        data["wallets"]["mission"] = {
            "address": args.mission,
            "role": "Treasury Mission",
            "status": "live",
            "note": "Grants / art — not LIA signing",
        }
    if args.reserve:
        if not args.reserve.startswith("erd1"):
            raise SystemExit("reserve must be erd1...")
        data["wallets"]["reserve"] = {
            "address": args.reserve,
            "role": "Treasury Reserve",
            "status": "live",
            "note": "Runway / risk",
        }

    PATH.write_text(json.dumps(data, indent=2), encoding="utf-8")
    print("wrote", PATH)
    print(json.dumps(data["wallets"], indent=2))
    print("Update docs/TREASURY_POLICY.md table with these addresses.")


if __name__ == "__main__":
    main()
