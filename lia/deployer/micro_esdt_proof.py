"""
ESDT micro-proof readiness — dust transfer (TRO or USDC) via deployer PEM.

Does NOT send by default. Dry-run builds the ESDTTransfer payload.

  PYTHONPATH=. python -m lia.deployer.micro_esdt_proof --token TRO-94c925 --amount 0.0001
  PYTHONPATH=. python -m lia.deployer.micro_esdt_proof --token TRO-94c925 --amount 0.0001 --send

Requires deployer balance of the token + EGLD for gas.
"""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path

# Optional runtime paths
DEFAULT_PEM = Path("/home/workdir/artifacts/deployer-wallet/xartists-sc-deployer.pem")
OWNER = "erd1kex0pvp9dng8j76sgsejkyx86nhxuqk24my6wnha8dga9mymvhxqvl8v0g"
# Self-transfer validates signing path without external counterparty risk
DEFAULT_RECEIVER = OWNER


def token_to_hex(token_id: str) -> str:
    return token_id.encode("ascii").hex()


def amount_to_hex(amount: float, decimals: int = 18) -> str:
    raw = int(amount * (10**decimals))
    h = format(raw, "x")
    return h if len(h) % 2 == 0 else "0" + h


def build_esdt_transfer(token_id: str, amount: float, decimals: int = 18) -> str:
    """ESDTTransfer@token@amount — receiver is TX receiver field."""
    return f"ESDTTransfer@{token_to_hex(token_id)}@{amount_to_hex(amount, decimals)}"


def readiness_report(token_id: str, amount: float) -> dict:
    pem = Path(os.environ.get("DEPLOYER_PEM", str(DEFAULT_PEM)))
    data = build_esdt_transfer(token_id, amount)
    return {
        "schema": "micro_esdt_proof/v1",
        "ready": pem.is_file(),
        "pem_path_exists": pem.is_file(),
        "sender": OWNER,
        "receiver": DEFAULT_RECEIVER,
        "token": token_id,
        "amount": amount,
        "data": data,
        "gas_limit_suggested": 500000,
        "note": "Dry-run by default. --send requires token balance + network. Self-transfer = signature path proof.",
        "live_trading": False,
        "next": [
            "Ensure deployer holds dust TRO or USDC",
            "Run with --send only after Shadow Sprint day-1 log exists",
            "Document TX hash in docs/MICRO_PROOF_ESDT.md",
        ],
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--token", default="TRO-94c925")
    ap.add_argument("--amount", type=float, default=0.0001)
    ap.add_argument("--decimals", type=int, default=18)
    ap.add_argument("--send", action="store_true", help="Actually broadcast (requires deps + balance)")
    args = ap.parse_args()
    report = readiness_report(args.token, args.amount)
    report["data"] = build_esdt_transfer(args.token, args.amount, args.decimals)
    if not args.send:
        report["mode"] = "dry-run"
        print(json.dumps(report, indent=2))
        return
    report["mode"] = "send-not-implemented-in-minimal-script"
    report["hint"] = "Use micro_exec signing path or fund + mxpy once token dust is available"
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
