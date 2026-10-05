"""
Calldata plans for RWA economic TRO flows (HITL — no auto broadcast).

  PYTHONPATH=. python -m lia.calldata.tro_economic --reward erd1...
  PYTHONPATH=. python -m lia.calldata.tro_economic --burn
"""
from __future__ import annotations

import argparse
import json
from typing import Any

from lia.calldata.esdt import build_esdt_transfer_human
from lia.utils.precision import normalize_for_token

TRO = "TRO-94c925"
TRO_DECIMALS = 6
# Ops must set real burn sink (Burnify SC or dead address) before live
BURN_ADDRESS_PLACEHOLDER = "erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu"


def plan_reward_1_tro(user_address: str) -> dict[str, Any]:
    atomic = normalize_for_token(1.0, TRO_DECIMALS)
    data = build_esdt_transfer_human(TRO, 1.0, decimals=TRO_DECIMALS)
    return {
        "schema": "tro_reward_plan/v1",
        "action": "ESDTTransfer_1_TRO_to_user",
        "token": TRO,
        "amount_human": 1.0,
        "amount_atomic": atomic,
        "receiver": user_address,
        "data": data,
        "gas_limit": 500_000,
        "broadcast": False,
        "note": "HITL: deployer signs after NFT mint confirmed",
    }


def plan_burn_1_tro(*, burn_address: str = BURN_ADDRESS_PLACEHOLDER) -> dict[str, Any]:
    atomic = normalize_for_token(1.0, TRO_DECIMALS)
    data = build_esdt_transfer_human(TRO, 1.0, decimals=TRO_DECIMALS)
    return {
        "schema": "tro_burn_plan/v1",
        "action": "ESDTTransfer_1_TRO_to_burn_sink",
        "token": TRO,
        "amount_human": 1.0,
        "amount_atomic": atomic,
        "receiver": burn_address,
        "data": data,
        "gas_limit": 500_000,
        "broadcast": False,
        "note": "HITL: set real burn address; mark TX in economic_validator after success",
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--reward", type=str, default="")
    ap.add_argument("--burn", action="store_true")
    ap.add_argument("--burn-address", type=str, default=BURN_ADDRESS_PLACEHOLDER)
    args = ap.parse_args()
    if args.reward:
        print(json.dumps(plan_reward_1_tro(args.reward), indent=2))
    elif args.burn:
        print(json.dumps(plan_burn_1_tro(burn_address=args.burn_address), indent=2))
    else:
        print(json.dumps({"hint": "--reward <erd> | --burn"}, indent=2))


if __name__ == "__main__":
    main()
