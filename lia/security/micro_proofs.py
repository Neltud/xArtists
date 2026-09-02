"""Micro-proof log — security analysis & append API."""
from __future__ import annotations

import json
import os
import re
import time
from pathlib import Path
from typing import Any, Optional

ROOT = Path(__file__).resolve().parents[2]
LOG_PATH = ROOT / "data" / "micro_proof_log.json"
EXAMPLE = ROOT / "data" / "micro_proof_log.example.json"
LIA_OPS = "erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6"
TX_RE = re.compile(r"^[0-9a-fA-F]{64}$")
ADDR_RE = re.compile(r"^erd1[a-z0-9]{58}$")
MAX_MICRO_USD = float(os.getenv("MICRO_PROOF_MAX_USD", "25"))
MIN_MICRO_USD = float(os.getenv("MICRO_PROOF_MIN_USD", "0.01"))


def _empty() -> dict[str, Any]:
    if EXAMPLE.exists():
        try:
            return json.loads(EXAMPLE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {
        "LIA_LIVE_TRADING": "0",
        "updated": None,
        "sc": {"marketplace": None, "agents": None, "codeHash_non_null": False},
        "user_txs": [],
        "lia_live_micro_txs": [],
        "proof_micro_on": False,
        "notes": "fill after mainnet micro tests",
    }


def load() -> dict[str, Any]:
    if LOG_PATH.exists():
        try:
            return json.loads(LOG_PATH.read_text(encoding="utf-8"))
        except Exception:
            return _empty()
    return _empty()


def save(data: dict[str, Any]) -> Path:
    data["updated"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    LOG_PATH.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    return LOG_PATH


def analyze_proof(entry: dict[str, Any], *, role: str = "user") -> dict[str, Any]:
    issues: list[str] = []
    ok = True
    tx = str(entry.get("tx") or entry.get("txHash") or entry.get("hash") or "")
    addr = str(entry.get("address") or entry.get("from") or "")
    usd = float(entry.get("usd") or entry.get("notional_usd") or 0)
    kind = str(entry.get("kind") or entry.get("type") or "unknown")

    if not TX_RE.match(tx):
        ok = False
        issues.append("tx hash missing or not 64 hex")
    if addr and not ADDR_RE.match(addr):
        ok = False
        issues.append("address invalid erd1")
    if role == "user" and addr == LIA_OPS:
        ok = False
        issues.append("user proof must not use LIA ops wallet")
    if role == "lia" and addr and addr != LIA_OPS:
        issues.append("warn: lia micro tx not from known ops address")
    if usd > MAX_MICRO_USD:
        ok = False
        issues.append(f"notional ${usd} > micro max ${MAX_MICRO_USD}")
    if usd < 0:
        ok = False
        issues.append("negative notional")

    status = entry.get("status") or entry.get("ok")
    if status not in (True, "ok", "success", "Success"):
        if status in (False, "fail", "failed"):
            ok = False
            issues.append("status failed")
        else:
            issues.append("status not explicit success — treat as unverified")

    return {
        "ok": ok and status in (True, "ok", "success", "Success"),
        "issues": issues,
        "tx": tx[:16] + "…" if len(tx) == 64 else tx,
        "kind": kind,
        "role": role,
        "usd": usd,
        "explorer": f"https://explorer.multiversx.com/transactions/{tx}" if TX_RE.match(tx) else None,
    }


def analyze_log(data: Optional[dict[str, Any]] = None) -> dict[str, Any]:
    data = data or load()
    user = [analyze_proof(e, role="user") for e in (data.get("user_txs") or [])]
    lia = [analyze_proof(e, role="lia") for e in (data.get("lia_live_micro_txs") or [])]
    user_ok = sum(1 for a in user if a["ok"])
    lia_ok = sum(1 for a in lia if a["ok"])
    sc = data.get("sc") or {}
    return {
        "updated": data.get("updated"),
        "LIA_LIVE_TRADING": data.get("LIA_LIVE_TRADING"),
        "proof_micro_on": bool(data.get("proof_micro_on")),
        "user_ok": user_ok,
        "lia_ok": lia_ok,
        "user_total": len(user),
        "lia_total": len(lia),
        "sc_codehash_claim": sc.get("codeHash_non_null"),
        "ready_for_live_flag": user_ok + lia_ok >= 1 and os.getenv("LIA_LIVE_TRADING", "0") == "0",
        "analyses_user": user,
        "analyses_lia": lia,
        "security_verdict": (
            "PASS_MINIMAL" if (user_ok + lia_ok) >= 1 else "INSUFFICIENT_PROOFS"
        ),
    }


def append_proof(
    *,
    tx: str,
    address: str,
    usd: float,
    kind: str,
    role: str = "user",
    status: str = "success",
    meta: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    data = load()
    entry = {
        "tx": tx,
        "address": address,
        "usd": usd,
        "kind": kind,
        "status": status,
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "meta": meta or {},
    }
    analysis = analyze_proof(entry, role=role)
    key = "user_txs" if role == "user" else "lia_live_micro_txs"
    data.setdefault(key, []).append(entry)
    if analysis["ok"]:
        data["proof_micro_on"] = True
    save(data)
    return {"appended": entry, "analysis": analysis, "log": str(LOG_PATH)}


if __name__ == "__main__":
    print(json.dumps(analyze_log(), indent=2))
