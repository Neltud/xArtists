"""
On-chain micro-proofs — MultiversX mainnet.

  verify_tx(hash)      — API status/value/addresses
  register_from_hash   — verify + append micro_proof_log.json
  execute_micro_self   — PEM self-transfer (gated)
  refresh_all_proofs   — re-verify log against chain

Defaults: dry-run. Broadcast only if LIA_MICRO_PROOF_EXECUTE=1 + PEM.
"""
from __future__ import annotations

import json
import os
import re
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Optional

from lia.security.micro_proofs import (
    ADDR_RE,
    LIA_OPS,
    MAX_MICRO_USD,
    TX_RE,
    analyze_proof,
    append_proof,
    load,
    save,
)

ROOT = Path(__file__).resolve().parents[2]
API = os.getenv("API", "https://api.multiversx.com").rstrip("/")
DEFAULT_MICRO_WEI = int(os.getenv("MICRO_PROOF_WEI", "1000000000000000"))
MAX_MICRO_WEI = int(os.getenv("MICRO_PROOF_MAX_WEI", "50000000000000000"))


def _http_json(url: str, timeout: float = 15.0) -> dict[str, Any]:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "xArtists-MicroProof/1.0", "Accept": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode())


def fetch_egld_usd() -> float:
    try:
        from lia.oracles.price_oracle import fetch_egld_usd as _f

        return float(_f() or 0)
    except Exception:
        try:
            return float(_http_json(f"{API}/economics").get("price") or 0)
        except Exception:
            return 0.0


def fetch_tx(tx_hash: str) -> dict[str, Any]:
    h = tx_hash.strip().lower()
    if not TX_RE.match(h):
        return {"ok": False, "error": "invalid tx hash (need 64 hex)"}
    try:
        data = _http_json(f"{API}/transactions/{h}?withResults=true")
        data["_fetched"] = True
        return data
    except urllib.error.HTTPError as e:
        return {"ok": False, "error": f"HTTP {e.code}", "tx": h}
    except Exception as e:
        return {"ok": False, "error": str(e)[:160], "tx": h}


def verify_tx_onchain(
    tx_hash: str,
    *,
    role: str = "user",
    max_usd: float = MAX_MICRO_USD,
) -> dict[str, Any]:
    h = tx_hash.strip().lower()
    raw = fetch_tx(h)
    if raw.get("error") and not raw.get("txHash") and not raw.get("hash"):
        return {
            "ok": False,
            "onchain": False,
            "tx": h,
            "error": raw.get("error"),
            "issues": [str(raw.get("error"))],
        }

    status = str(raw.get("status") or "").lower()
    sender = str(raw.get("sender") or "")
    receiver = str(raw.get("receiver") or "")
    value_wei = int(raw.get("value") or 0)
    egld = value_wei / 1e18
    egld_usd = fetch_egld_usd()
    value_usd = egld * egld_usd if egld_usd > 0 else 0.0

    issues: list[str] = []
    ok = True
    if status not in ("success", "successful"):
        ok = False
        issues.append(f"status={status or 'unknown'} (need success)")
    if value_wei > MAX_MICRO_WEI:
        ok = False
        issues.append(f"value {egld:.6f} EGLD exceeds micro wei cap")
    if role == "user" and sender == LIA_OPS:
        ok = False
        issues.append("user proof cannot use LIA ops as sender")
    if not ADDR_RE.match(sender):
        ok = False
        issues.append("invalid sender")

    data_field = str(raw.get("data") or "")
    kind = "egld_transfer"
    if data_field:
        try:
            import base64

            decoded = base64.b64decode(data_field).decode("utf-8", errors="ignore")
        except Exception:
            decoded = data_field
        if "ESDTTransfer" in decoded or "ESDTNFT" in decoded:
            kind = "esdt_transfer"
        elif "MultiESDT" in decoded:
            kind = "multi_esdt"
        else:
            kind = "data_tx"

    return {
        "ok": ok and status in ("success", "successful"),
        "onchain": True,
        "tx": h,
        "status": status,
        "sender": sender,
        "receiver": receiver,
        "value_wei": value_wei,
        "value_egld": round(egld, 9),
        "value_usd": round(value_usd, 6),
        "egld_usd_mark": egld_usd,
        "kind": kind,
        "timestamp": raw.get("timestamp"),
        "shard": raw.get("senderShard"),
        "explorer": f"https://explorer.multiversx.com/transactions/{h}",
        "issues": issues,
        "role_suggested": "lia" if sender == LIA_OPS else "user",
    }


def register_from_hash(
    tx_hash: str,
    *,
    role: Optional[str] = None,
    kind: Optional[str] = None,
    force: bool = False,
) -> dict[str, Any]:
    v = verify_tx_onchain(tx_hash)
    if not v.get("onchain"):
        return {"registered": False, "verify": v}

    role = role or v.get("role_suggested") or "user"
    entry = {
        "tx": v["tx"],
        "address": v.get("sender"),
        "usd": v.get("value_usd") or 0.01,
        "kind": kind or v.get("kind") or "onchain_micro",
        "status": "success" if v.get("ok") else v.get("status"),
        "meta": {
            "receiver": v.get("receiver"),
            "value_egld": v.get("value_egld"),
            "verified_onchain": True,
            "explorer": v.get("explorer"),
        },
    }
    analysis = analyze_proof(entry, role=role)
    if not v.get("ok") and not force:
        return {"registered": False, "verify": v, "analysis": analysis}
    if not analysis.get("ok") and not force:
        return {"registered": False, "verify": v, "analysis": analysis}

    out = append_proof(
        tx=v["tx"],
        address=str(v.get("sender") or ""),
        usd=float(v.get("value_usd") or 0.01),
        kind=str(kind or v.get("kind") or "onchain_micro"),
        role=role,
        status="success" if v.get("ok") else "unverified",
        meta=entry["meta"],
    )
    return {"registered": True, "verify": v, "append": out}


def refresh_all_proofs() -> dict[str, Any]:
    data = load()
    report: dict[str, list] = {"user": [], "lia": []}
    for key, role in (("user_txs", "user"), ("lia_live_micro_txs", "lia")):
        bucket = "user" if role == "user" else "lia"
        for e in data.get(key) or []:
            tx = str(e.get("tx") or e.get("txHash") or "")
            if not TX_RE.match(tx):
                report[bucket].append({"tx": tx, "ok": False, "error": "bad hash"})
                continue
            v = verify_tx_onchain(tx, role=role)
            e["onchain_verified"] = bool(v.get("ok"))
            e["onchain_status"] = v.get("status")
            e["last_verified"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            report[bucket].append({"tx": tx[:16], "ok": v.get("ok"), "status": v.get("status")})
    save(data)
    return report


def execute_micro_self(
    *,
    amount_wei: int = DEFAULT_MICRO_WEI,
    dry_run: Optional[bool] = None,
) -> dict[str, Any]:
    if amount_wei <= 0 or amount_wei > MAX_MICRO_WEI:
        return {"ok": False, "error": f"amount_wei out of range (1..{MAX_MICRO_WEI})"}

    execute = os.getenv("LIA_MICRO_PROOF_EXECUTE", "0") == "1"
    if dry_run is None:
        dry_run = not execute

    pem = os.getenv("PEM") or os.getenv("LIA_WALLET_PEM_PATH") or ""
    if dry_run:
        return {
            "ok": True,
            "dry_run": True,
            "amount_wei": amount_wei,
            "amount_egld": amount_wei / 1e18,
            "hint": "Set PEM=... and LIA_MICRO_PROOF_EXECUTE=1 to broadcast self-transfer",
            "pem_present": bool(pem and Path(pem).is_file()),
        }

    if not pem or not Path(pem).is_file():
        return {"ok": False, "error": "PEM missing — export PEM=/path/mainnet.pem"}

    result = _mxpy_self_transfer(pem, amount_wei)
    txh = result.get("tx") or result.get("tx_hash")
    if result.get("ok") and txh:
        time.sleep(2.0)
        result["register"] = register_from_hash(str(txh), role="lia", kind="egld_self_micro")
    return result


def _mxpy_self_transfer(pem: str, amount_wei: int) -> dict[str, Any]:
    import shutil
    import subprocess

    if not shutil.which("mxpy"):
        return {"ok": False, "error": "mxpy not found"}
    try:
        addr = subprocess.check_output(["mxpy", "wallet", "pem-address", pem], text=True).strip()
    except Exception as e:
        return {"ok": False, "error": f"pem address: {e}"}
    m = re.search(r"erd1[a-z0-9]{58}", addr)
    if not m:
        return {"ok": False, "error": f"bad address from pem: {addr}"}
    addr = m.group(0)
    cmd = [
        "mxpy", "tx", "new",
        "--pem", pem,
        "--receiver", addr,
        "--value", str(amount_wei),
        "--gas-limit", "50000",
        "--proxy", os.getenv("PROXY", "https://gateway.multiversx.com"),
        "--chain", "1",
        "--send",
    ]
    try:
        out = subprocess.check_output(cmd, text=True, stderr=subprocess.STDOUT, timeout=120)
    except subprocess.CalledProcessError as e:
        return {"ok": False, "error": (e.output or str(e))[-500:]}
    except Exception as e:
        return {"ok": False, "error": str(e)[:200]}
    hm = re.search(r"\b([0-9a-fA-F]{64})\b", out)
    if not hm:
        return {"ok": False, "error": "no tx hash in mxpy output", "raw": out[-400:]}
    return {"ok": True, "tx": hm.group(1).lower(), "raw": out[-200:]}


def main(argv: Optional[list[str]] = None) -> int:
    import argparse
    import sys

    argv = argv if argv is not None else sys.argv[1:]
    p = argparse.ArgumentParser(description="On-chain micro-proofs MVX mainnet")
    sub = p.add_subparsers(dest="cmd", required=True)

    v = sub.add_parser("verify")
    v.add_argument("tx_hash")
    v.add_argument("--role", default="user")

    r = sub.add_parser("register")
    r.add_argument("tx_hash")
    r.add_argument("--role", default=None)
    r.add_argument("--force", action="store_true")

    sub.add_parser("refresh")
    sub.add_parser("status")

    e = sub.add_parser("execute-self")
    e.add_argument("--wei", type=int, default=DEFAULT_MICRO_WEI)
    e.add_argument("--send", action="store_true")

    args = p.parse_args(argv)

    if args.cmd == "verify":
        print(json.dumps(verify_tx_onchain(args.tx_hash, role=args.role), indent=2))
        return 0
    if args.cmd == "register":
        print(json.dumps(register_from_hash(args.tx_hash, role=args.role, force=args.force), indent=2))
        return 0
    if args.cmd == "refresh":
        print(json.dumps(refresh_all_proofs(), indent=2))
        return 0
    if args.cmd == "status":
        from lia.security.micro_proofs import analyze_log

        out: dict[str, Any] = {"log": analyze_log()}
        try:
            from lia.security.go_live_gates import evaluate_gates

            out["gates"] = evaluate_gates(check_network=True).to_dict()
        except Exception as ex:
            out["gates_error"] = str(ex)
        print(json.dumps(out, indent=2))
        return 0
    if args.cmd == "execute-self":
        if args.send:
            os.environ["LIA_MICRO_PROOF_EXECUTE"] = "1"
        print(json.dumps(execute_micro_self(amount_wei=args.wei, dry_run=not args.send), indent=2))
        return 0
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
