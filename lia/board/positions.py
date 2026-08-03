"""Aggregate LIA wallet positions across placement venues (read-only)."""
from __future__ import annotations

import json
import time
import urllib.request
from typing import Any

from lia.venues.hatom import LIA_WALLET, sleeve_summary
from lia.venues.registry import list_venues

MVX_API = "https://api.multiversx.com"


def _get(url: str) -> Any:
    req = urllib.request.Request(url, headers={"User-Agent": "xArtists-LIA/1.0"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read().decode())


def fetch_wallet_snapshot(wallet: str = LIA_WALLET) -> dict[str, Any]:
    positions: list[dict[str, Any]] = []
    total_usd = 0.0
    try:
        acc = _get(f"{MVX_API}/accounts/{wallet}")
        egld = float(acc.get("balance") or 0) / 1e18
        econ = _get(f"{MVX_API}/economics")
        egld_px = float(econ.get("price") or 0)
        egld_usd = egld * egld_px
        total_usd += egld_usd
        positions.append(
            {
                "venue": "wallet",
                "platform": "multiversx",
                "asset": "EGLD",
                "amount": egld,
                "value_usd": egld_usd,
                "kind": "spot",
            }
        )
    except Exception as e:
        positions.append({"venue": "wallet", "error": str(e)})

    try:
        tokens = _get(f"{MVX_API}/accounts/{wallet}/tokens?size=200")
        if isinstance(tokens, list):
            for t in tokens:
                dec = int(t.get("decimals") or 18)
                bal = float(t.get("balance") or 0) / (10**dec)
                if bal <= 0:
                    continue
                px = float(t.get("price") or 0)
                usd = bal * px
                total_usd += usd
                ticker = str(t.get("ticker") or t.get("identifier") or "?")
                kind = "hatom_htoken" if ticker.upper().startswith("H") else "esdt"
                positions.append(
                    {
                        "venue": "hatom" if kind == "hatom_htoken" else "wallet",
                        "platform": "multiversx",
                        "asset": ticker,
                        "identifier": t.get("identifier"),
                        "amount": bal,
                        "value_usd": usd,
                        "kind": kind,
                    }
                )
    except Exception as e:
        positions.append({"venue": "tokens", "error": str(e)})

    hatom = sleeve_summary(wallet)
    placement_options = [
        {
            "id": v.id,
            "name": v.name,
            "chain": v.chain,
            "category": v.category,
            "status": v.status,
            "roles": v.roles,
            "app": (v.endpoints or {}).get("app"),
        }
        for v in list_venues()
    ]

    return {
        "wallet": wallet,
        "updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "total_usd_approx": round(total_usd, 4),
        "positions": positions,
        "hatom_sleeve": {
            "source": hatom.get("source"),
            "supplied_usd": hatom.get("total_supplied_usd"),
            "borrowed_usd": hatom.get("total_borrowed_usd"),
            "health_factor": hatom.get("health_factor"),
        },
        "placement_options": placement_options,
    }
