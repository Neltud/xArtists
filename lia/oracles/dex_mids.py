"""
Multi-source WEGLD/EGLD mids for arb diagnostics (block-time, not HFT).

Sources (mainnet, read-only):
  - api.multiversx.com/economics
  - api.multiversx.com/tokens/WEGLD-bd4d79
  - api.multiversx.com/mex/tokens (xExchange index)
  - api.multiversx.com/mex/pairs EGLDUSDC (pair legs)

Honest limit: most mids share the same indexer → micro spreads (few bps).
MICRO_ARB must still require spread > fee multiple; this module never invents
a second venue quote.
"""
from __future__ import annotations

import json
import time
import urllib.request
from typing import Any, Optional

API = "https://api.multiversx.com"
WEGLD = "WEGLD-bd4d79"
UA = "xArtists-LIA-DexMids/1.0"


def _get(url: str, timeout: float = 12.0) -> Any:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode())


def _safe(url: str) -> tuple[Optional[Any], Optional[str]]:
    try:
        return _get(url), None
    except Exception as e:
        return None, str(e)[:160]


def fetch_block() -> dict[str, Any]:
    data, err = _safe(f"{API}/blocks?size=1&order=desc")
    if not data or not isinstance(data, list) or not data:
        return {"ok": False, "error": err, "approx_block_time_sec": 6}
    b = data[0]
    return {
        "ok": True,
        "nonce": b.get("nonce"),
        "hash": b.get("hash"),
        "timestamp": b.get("timestamp"),
        "approx_block_time_sec": 6,
    }


def collect_wegld_mids() -> dict[str, Any]:
    mids: list[dict[str, Any]] = []
    errors: list[str] = []

    econ, e1 = _safe(f"{API}/economics")
    if e1:
        errors.append(f"economics:{e1}")
    elif econ:
        px = float(econ.get("price") or econ.get("egldPrice") or 0)
        if px > 0:
            mids.append({"source": "mvx_economics", "price": px, "venue_label": "network"})

    tok, e2 = _safe(f"{API}/tokens/{WEGLD}")
    if e2:
        errors.append(f"token:{e2}")
    elif tok:
        px = float(tok.get("price") or 0)
        if px > 0:
            mids.append(
                {
                    "source": "mvx_token",
                    "price": px,
                    "venue_label": "token_index",
                    "volume24h": tok.get("volume24h"),
                }
            )

    mex, e3 = _safe(f"{API}/mex/tokens?size=20")
    if e3:
        errors.append(f"mex_tokens:{e3}")
    elif isinstance(mex, list):
        row = next((x for x in mex if x.get("id") == WEGLD), None)
        if row:
            px = float(row.get("price") or 0)
            if px > 0:
                mids.append(
                    {
                        "source": "mex_tokens",
                        "price": px,
                        "venue_label": "xexchange_index",
                        "volume24h": row.get("previous24hVolume"),
                    }
                )

    pairs, e4 = _safe(f"{API}/mex/pairs?size=30")
    if e4:
        errors.append(f"mex_pairs:{e4}")
    elif isinstance(pairs, list):
        pair = next(
            (
                p
                for p in pairs
                if p.get("id") == "EGLDUSDC-594e5e"
                or (
                    p.get("baseId") == WEGLD
                    and str(p.get("quoteSymbol") or "").upper() == "USDC"
                )
            ),
            None,
        )
        if pair:
            bp = float(pair.get("basePrice") or 0)
            if bp > 0:
                mids.append(
                    {
                        "source": "mex_pair_EGLDUSDC",
                        "price": bp,
                        "venue_label": pair.get("exchange") or "xexchange",
                        "pair_id": pair.get("id"),
                        "tvl": pair.get("totalValue"),
                        "volume24h": pair.get("volume24h"),
                    }
                )

    prices = [float(m["price"]) for m in mids if m.get("price")]
    if not prices:
        return {
            "ok": False,
            "mids": mids,
            "errors": errors,
            "dex_a": 0.0,
            "dex_b": 0.0,
            "spread_bps": 0.0,
            "updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }

    by_src = {m["source"]: m for m in mids}
    a = float(
        (by_src.get("mex_pair_EGLDUSDC") or by_src.get("mex_tokens") or by_src.get("mvx_token") or mids[0])[
            "price"
        ]
    )
    b = float((by_src.get("mvx_economics") or by_src.get("mvx_token") or mids[-1])["price"])
    mid = sum(prices) / len(prices)
    spread_bps = abs(a - b) / max(mid, 1e-12) * 10_000

    return {
        "ok": True,
        "mids": mids,
        "errors": errors,
        "dex_a": a,
        "dex_b": b,
        "mid": mid,
        "spread_bps": round(spread_bps, 4),
        "n_sources": len(mids),
        "same_index_family": spread_bps < 15,
        "block": fetch_block(),
        "note": (
            "Sources are MVX indexer / xExchange-family; not independent CEX venues. "
            "Do not expect HFT-scale arb edges."
        ),
        "updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }


def attach_to_market(market: dict[str, Any]) -> dict[str, Any]:
    out = dict(market)
    try:
        snap = collect_wegld_mids()
    except Exception as e:
        out["dex_mids_error"] = str(e)[:160]
        return out
    out["dex_mids"] = {
        "ok": snap.get("ok"),
        "spread_bps": snap.get("spread_bps"),
        "n_sources": snap.get("n_sources"),
        "same_index_family": snap.get("same_index_family"),
        "block_nonce": (snap.get("block") or {}).get("nonce"),
        "updated": snap.get("updated"),
    }
    if snap.get("ok"):
        out["dex_a"] = float(snap["dex_a"])
        out["dex_b"] = float(snap["dex_b"])
        if not out.get("price"):
            out["price"] = float(snap.get("mid") or 0)
        out["egld_usd"] = float(out.get("egld_usd") or snap.get("mid") or 0)
    return out


if __name__ == "__main__":
    print(json.dumps(collect_wegld_mids(), indent=2)[:2000])
