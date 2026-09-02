"""
Mainnet on-chain / API feeds for LIA placement options.
Read-only, fail-soft. Soul = testnet/experimental only.
"""
from __future__ import annotations

import json
import time
import urllib.error
import urllib.request
from typing import Any, Optional

MVX_API = "https://api.multiversx.com"
WEGLD = "WEGLD-bd4d79"
USDC = "USDC-c76f1f"
TRO = "TRO-94c925"

# Public app endpoints (no private keys)
VENUE_APPS = {
    "xexchange": "https://xexchange.com",
    "onedex": "https://onedex.app",
    "hatom": "https://app.hatom.com",
    "xoxno": "https://xoxno.com",
    "ashswap": "https://app.ashswap.io",
    "jexchange": "https://jexchange.io",
    "soul": None,  # experimental — no stable verified mainnet app in-repo
}


def _get(url: str, timeout: float = 12.0) -> Any:
    req = urllib.request.Request(
        url, headers={"User-Agent": "xArtists-LIA/1.0", "Accept": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode())


def mvx_token_price(token_id: str) -> dict[str, Any]:
    try:
        data = _get(f"{MVX_API}/tokens/{token_id}")
        return {
            "ok": True,
            "token": token_id,
            "price_usd": float(data.get("price") or 0),
            "source": "api.multiversx.com/tokens",
            "name": data.get("name"),
            "ticker": data.get("ticker"),
        }
    except Exception as e:
        return {"ok": False, "token": token_id, "price_usd": 0.0, "error": str(e)}


def mvx_economics() -> dict[str, Any]:
    try:
        data = _get(f"{MVX_API}/economics")
        return {
            "ok": True,
            "egld_price_usd": float(data.get("price") or 0),
            "source": "api.multiversx.com/economics",
        }
    except Exception as e:
        return {"ok": False, "egld_price_usd": 0.0, "error": str(e)}


def network_block_meta() -> dict[str, Any]:
    """Latest block height for block-by-block arb cadence."""
    try:
        data = _get(f"{MVX_API}/blocks?size=1&order=desc")
        if isinstance(data, list) and data:
            b = data[0]
            return {
                "ok": True,
                "nonce": b.get("nonce"),
                "hash": b.get("hash"),
                "timestamp": b.get("timestamp"),
                "approx_block_time_sec": 6,
                "source": "api.multiversx.com/blocks",
            }
    except Exception as e:
        return {"ok": False, "error": str(e), "approx_block_time_sec": 6}
    return {"ok": False, "approx_block_time_sec": 6}


def hatom_feed(wallet: Optional[str] = None) -> dict[str, Any]:
    from lia.venues.hatom import LIA_WALLET, sleeve_summary

    s = sleeve_summary(wallet or LIA_WALLET)
    return {
        "venue": "hatom",
        "network": "mainnet",
        "app": VENUE_APPS["hatom"],
        "position": s,
        "roles": ["supply", "yield_sleeve", "collateral"],
    }


def xexchange_feed(token_id: str = WEGLD) -> dict[str, Any]:
    p = mvx_token_price(token_id)
    return {
        "venue": "xexchange",
        "network": "mainnet",
        "app": VENUE_APPS["xexchange"],
        "mid_usd": p.get("price_usd") or 0,
        "token": token_id,
        "source": p.get("source"),
        "ok": p.get("ok"),
        "roles": ["swap", "lp", "price"],
        "note": "Mid from MultiversX token index (xExchange-heavy); pair-level AMM quote TBD",
    }


def onedex_feed(token_id: str = WEGLD) -> dict[str, Any]:
    # No stable public quote API — use MVX index as proxy + label partial
    p = mvx_token_price(token_id)
    return {
        "venue": "onedex",
        "network": "mainnet",
        "app": VENUE_APPS["onedex"],
        "mid_usd": p.get("price_usd") or 0,
        "token": token_id,
        "ok": p.get("ok"),
        "partial": True,
        "roles": ["swap", "lp", "micro_arb"],
        "note": "Pair mid proxied via MVX token API until OneDex quote endpoint wired",
    }


def jexchange_feed(token_id: str = WEGLD) -> dict[str, Any]:
    p = mvx_token_price(token_id)
    return {
        "venue": "jexchange",
        "network": "mainnet",
        "app": VENUE_APPS["jexchange"],
        "mid_usd": p.get("price_usd") or 0,
        "token": token_id,
        "ok": p.get("ok"),
        "partial": True,
        "roles": ["swap", "stake"],
        "note": "Partial — public quote API not hard-wired; mid from MVX index",
    }


def ashswap_feed(token_id: str = USDC) -> dict[str, Any]:
    p = mvx_token_price(token_id)
    return {
        "venue": "ashswap",
        "network": "mainnet",
        "app": VENUE_APPS["ashswap"],
        "mid_usd": p.get("price_usd") or 0,
        "token": token_id,
        "ok": p.get("ok"),
        "partial": True,
        "roles": ["stable_swap", "yield"],
        "note": "Stable pools candidate for yield sleeve",
    }


def xoxno_feed(collection: Optional[str] = None) -> dict[str, Any]:
    return {
        "venue": "xoxno",
        "network": "mainnet",
        "app": VENUE_APPS["xoxno"],
        "collection": collection,
        "roles": ["nft_market", "external_buy"],
        "ok": True,
        "note": "NFT external market — not used for ESDT micro-arb; floor API optional later",
    }


def soul_feed() -> dict[str, Any]:
    return {
        "venue": "soul",
        "network": "testnet_experimental",
        "app": None,
        "roles": ["restake", "identity"],
        "ok": False,
        "executable": False,
        "note": "Testnet/experimental only — no mainnet funds; no verified app URL in-repo",
    }


def all_placement_feeds(
    *,
    token: str = WEGLD,
    wallet: Optional[str] = None,
) -> dict[str, Any]:
    block = network_block_meta()
    econ = mvx_economics()
    feeds = {
        "xexchange": xexchange_feed(token),
        "onedex": onedex_feed(token),
        "jexchange": jexchange_feed(token),
        "ashswap": ashswap_feed(USDC),
        "hatom": hatom_feed(wallet),
        "xoxno": xoxno_feed(),
        "soul": soul_feed(),
    }
    return {
        "updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "network": "mainnet",
        "token_focus": token,
        "block": block,
        "economics": econ,
        "venues": feeds,
    }


if __name__ == "__main__":
    print(json.dumps(all_placement_feeds(), indent=2))
