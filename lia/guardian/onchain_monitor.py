"""
On-chain monitor — real balances + recent TX for deployer / LIA wallets.
Writes data/lia_live_status.json. Does NOT set LIA_LIVE_TRADING=1.

  PYTHONPATH=. python -m lia.guardian.onchain_monitor
"""
from __future__ import annotations

import json
import time
import urllib.request
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"
API = "https://api.multiversx.com"

DEPLOYER = "erd1kex0pvp9dng8j76sgsejkyx86nhxuqk24my6wnha8dga9mymvhxqvl8v0g"
LIA_WALLET = "erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6"
TRACK_TOKENS = ("USDC-c76f1f", "TRO-94c925", "WEGLD-bd4d79")


def _get(url: str) -> Any:
    req = urllib.request.Request(url, headers={"User-Agent": "xArtists-onchain-monitor/1.0"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read().decode())


def fetch_account(address: str) -> dict[str, Any]:
    try:
        d = _get(f"{API}/accounts/{address}")
        return {
            "address": address,
            "egld": int(d.get("balance") or 0) / 1e18,
            "nonce": d.get("nonce"),
            "ok": True,
        }
    except Exception as e:
        return {"address": address, "egld": None, "ok": False, "error": str(e)}


def fetch_tokens(address: str) -> dict[str, float]:
    out: dict[str, float] = {}
    try:
        tokens = _get(f"{API}/accounts/{address}/tokens?size=50")
        if not isinstance(tokens, list):
            return out
        for t in tokens:
            tid = str(t.get("identifier") or "")
            if tid in TRACK_TOKENS or tid.upper() in {x.upper() for x in TRACK_TOKENS}:
                dec = int(t.get("decimals") or 18)
                out[tid] = int(t.get("balance") or 0) / (10**dec)
    except Exception:
        pass
    return out


def fetch_txs(address: str, size: int = 8) -> list[dict[str, Any]]:
    try:
        txs = _get(f"{API}/accounts/{address}/transactions?size={size}&order=desc")
        if not isinstance(txs, list):
            return []
        rows = []
        for t in txs:
            rows.append(
                {
                    "txHash": t.get("txHash"),
                    "status": t.get("status"),
                    "function": t.get("function"),
                    "value": t.get("value"),
                    "timestamp": t.get("timestamp"),
                    "explorer": f"https://explorer.multiversx.com/transactions/{t.get('txHash')}",
                }
            )
        return rows
    except Exception:
        return []


def build_status() -> dict[str, Any]:
    dep = fetch_account(DEPLOYER)
    dep["tokens"] = fetch_tokens(DEPLOYER)
    dep["txs"] = fetch_txs(DEPLOYER, 6)
    lia = fetch_account(LIA_WALLET)
    lia["tokens"] = fetch_tokens(LIA_WALLET)
    lia["txs"] = fetch_txs(LIA_WALLET, 6)

    # Rough equity proxy: EGLD * price + USDC
    egld_usd = 0.0
    try:
        econ = _get(f"{API}/economics")
        egld_usd = float(econ.get("price") or 0)
    except Exception:
        egld_usd = 0.0

    dep_egld = float(dep.get("egld") or 0)
    usdc = float((dep.get("tokens") or {}).get("USDC-c76f1f") or 0)
    equity_usd = dep_egld * egld_usd + usdc

    return {
        "schema": "lia_live_status/v1",
        "updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "LIA_LIVE_TRADING": 0,  # monitor never enables live
        "mode_default": "shadow",
        "egld_usd": egld_usd,
        "deployer": dep,
        "lia_wallet": lia,
        "equity_proxy_usd": round(equity_usd, 4),
        "note": "On-chain snapshot only — UI Live mode is display; trading still gated",
    }


def publish(status: dict[str, Any]) -> Path:
    DATA.mkdir(parents=True, exist_ok=True)
    path = DATA / "lia_live_status.json"
    path.write_text(json.dumps(status, indent=2), encoding="utf-8")
    for dest in (
        ROOT / "apps" / "frontend" / "public" / "data" / "lia_live_status.json",
        ROOT / "docs" / "data" / "lia_live_status.json",
    ):
        try:
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(json.dumps(status, indent=2), encoding="utf-8")
        except OSError:
            pass
    return path


def main() -> None:
    st = build_status()
    p = publish(st)
    print(
        json.dumps(
            {
                "path": str(p),
                "deployer_egld": (st.get("deployer") or {}).get("egld"),
                "equity_proxy_usd": st.get("equity_proxy_usd"),
                "txs": len((st.get("deployer") or {}).get("txs") or []),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
