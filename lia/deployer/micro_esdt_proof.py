"""
ESDT micro-proof — dust transfer (TRO or USDC) via deployer PEM.

Dry-run by default. With --send: signs ESDTTransfer self-transfer (signature path).

  PYTHONPATH=. python -m lia.deployer.micro_esdt_proof --token TRO-94c925 --amount 0.0001
  PYTHONPATH=. python -m lia.deployer.micro_esdt_proof --token TRO-94c925 --amount 0.0001 --send

Requires: cryptography, token balance on deployer, EGLD for gas.
Never sets LIA_LIVE_TRADING.
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import urllib.request
from collections import OrderedDict
from pathlib import Path
from typing import Any

DEFAULT_PEM = Path(
    os.environ.get(
        "DEPLOYER_PEM",
        "/home/workdir/artifacts/deployer-wallet/xartists-sc-deployer.pem",
    )
)
OWNER = "erd1kex0pvp9dng8j76sgsejkyx86nhxuqk24my6wnha8dga9mymvhxqvl8v0g"
API = "https://api.multiversx.com"
GATEWAY = "https://gateway.multiversx.com"


def token_to_hex(token_id: str) -> str:
    return token_id.encode("ascii").hex()


def amount_to_hex(amount: float, decimals: int = 18) -> str:
    raw = int(round(amount * (10**decimals)))
    if raw <= 0:
        raise ValueError("amount too small")
    h = format(raw, "x")
    return h if len(h) % 2 == 0 else "0" + h


def build_esdt_transfer(token_id: str, amount: float, decimals: int = 18) -> str:
    return f"ESDTTransfer@{token_to_hex(token_id)}@{amount_to_hex(amount, decimals)}"


def load_seed(pem: Path) -> bytes:
    text = pem.read_text()
    body = "".join(
        line.strip() for line in text.splitlines() if not line.startswith("-----") and line.strip()
    )
    raw = base64.b64decode(body)
    try:
        return bytes.fromhex(raw.decode())
    except Exception:
        return raw[:32]


def readiness_report(token_id: str, amount: float, decimals: int) -> dict[str, Any]:
    pem = DEFAULT_PEM
    data = build_esdt_transfer(token_id, amount, decimals)
    return {
        "schema": "micro_esdt_proof/v1",
        "ready": pem.is_file(),
        "pem_path_exists": pem.is_file(),
        "sender": OWNER,
        "receiver": OWNER,
        "token": token_id,
        "amount": amount,
        "data": data,
        "gas_limit_suggested": 500_000,
        "note": "Self-transfer validates ESDT + signature path. Not LIA live trading.",
        "live_trading": False,
        "next": [
            "Hold dust TRO or USDC on deployer",
            "Run --send after Shadow day-1 logged",
            "Document TX in docs/MICRO_PROOF_ESDT.md",
        ],
    }


def send_esdt(token_id: str, amount: float, decimals: int) -> dict[str, Any]:
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

    pem = DEFAULT_PEM
    if not pem.is_file():
        return {"ok": False, "error": "PEM missing"}
    sk = Ed25519PrivateKey.from_private_bytes(load_seed(pem))
    acc = json.loads(urllib.request.urlopen(f"{API}/accounts/{OWNER}").read())
    nonce = int(acc["nonce"])
    data_str = build_esdt_transfer(token_id, amount, decimals)
    data_b64 = base64.b64encode(data_str.encode()).decode()
    d = OrderedDict(
        [
            ("nonce", nonce),
            ("value", "0"),
            ("receiver", OWNER),
            ("sender", OWNER),
            ("gasPrice", 1_000_000_000),
            ("gasLimit", 500_000),
            ("data", data_b64),
            ("chainID", "1"),
            ("version", 1),
        ]
    )
    sig = sk.sign(json.dumps(d, separators=(",", ":")).encode())
    tx = {**d, "signature": sig.hex()}
    req = urllib.request.Request(
        f"{GATEWAY}/transaction/send",
        data=json.dumps(tx).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        resp = json.loads(urllib.request.urlopen(req).read().decode())
        tx_hash = (resp.get("data") or {}).get("txHash")
        return {
            "ok": True,
            "txHash": tx_hash,
            "explorer": f"https://explorer.multiversx.com/transactions/{tx_hash}",
            "data": data_str,
            "paper": False,
            "note": "ESDT dust self-transfer — micro-proof only",
        }
    except Exception as e:
        body = e.read().decode() if hasattr(e, "read") else str(e)
        return {"ok": False, "error": body[:500]}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--token", default="TRO-94c925")
    ap.add_argument("--amount", type=float, default=0.0001)
    ap.add_argument("--decimals", type=int, default=18)
    ap.add_argument("--send", action="store_true")
    args = ap.parse_args()
    report = readiness_report(args.token, args.amount, args.decimals)
    if not args.send:
        report["mode"] = "dry-run"
        print(json.dumps(report, indent=2))
        return
    result = send_esdt(args.token, args.amount, args.decimals)
    print(json.dumps({**report, "mode": "send", "result": result}, indent=2))


if __name__ == "__main__":
    main()
