"""
Hatom Protocol integration (MultiversX)
======================================
Read-only. Tries official HTTP APIs; falls back to MultiversX account
H-token balances (supply proxy). Borrow/HF only when API returns data.

LIA wallet default: production operational address.
"""
from __future__ import annotations

import json
import time
import urllib.error
import urllib.request
from typing import Any, Optional

MVX_API = "https://api.multiversx.com"
LIA_WALLET = "erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6"

# Candidate bases (order matters). 404/DNS → next.
HATOM_API_CANDIDATES = [
    "https://mainnet-api.hatom.com",
    "https://api.hatom.com",
    "https://backend.hatom.com",
]

HATOM_TICKERS = {
    "HEGLD",
    "HUSDC",
    "HUSDT",
    "HWBTC",
    "HMEX",
    "HWTAO",
    "HBUSD",
    "HSEGLD",
    "HWETH",
    "HHTM",
    "HUTCHR",
}

POSITION_PATHS = [
    "/lend/v2/userPosition/{wallet}",
    "/lend/v1/userPosition/{wallet}",
    "/v2/userPosition/{wallet}",
    "/userPosition/{wallet}",
]

MARKETS_PATHS = [
    "/lend/v2/markets",
    "/lend/v1/markets",
    "/v2/markets",
    "/markets",
]


def _get_json(url: str, timeout: float = 12.0) -> Any:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "xArtists-LIA/1.0", "Accept": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode())


def _try_paths(bases: list[str], paths: list[str], wallet: str = "") -> tuple[Optional[Any], str]:
    last_err = ""
    for base in bases:
        for path in paths:
            url = base + path.format(wallet=wallet)
            try:
                data = _get_json(url)
                if data is not None:
                    return data, url
            except Exception as e:
                last_err = f"{url}: {e}"
                continue
    return None, last_err


def fetch_wallet_htokens(wallet: str = LIA_WALLET) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    from_ = 0
    size = 100
    while True:
        try:
            batch = _get_json(f"{MVX_API}/accounts/{wallet}/tokens?size={size}&from={from_}")
        except Exception:
            break
        if not isinstance(batch, list) or not batch:
            break
        for t in batch:
            ticker = str(t.get("ticker") or "").upper()
            name = str(t.get("name") or "").lower()
            if ticker not in HATOM_TICKERS and not (
                ticker.startswith("H") and "hatom" in name
            ):
                continue
            dec = int(t.get("decimals") or 18)
            raw = float(t.get("balance") or 0)
            bal = raw / (10**dec)
            if bal <= 0:
                continue
            price = float(t.get("price") or 0)
            value = bal * price
            if not value and t.get("valueUsd"):
                value = float(t["valueUsd"])
            out.append(
                {
                    "identifier": t.get("identifier"),
                    "ticker": ticker,
                    "name": t.get("name"),
                    "balance": bal,
                    "price": price,
                    "value_usd": value,
                    "underlying": ticker[1:] if ticker.startswith("H") and len(ticker) > 1 else ticker,
                }
            )
        if len(batch) < size:
            break
        from_ += size
        if from_ > 2000:
            break
    return out


def _normalize_api_position(data: dict[str, Any]) -> dict[str, Any]:
    markets_in = data.get("markets") or data.get("positions") or []
    markets = []
    for m in markets_in:
        if not isinstance(m, dict):
            continue
        markets.append(
            {
                "label": m.get("asset") or m.get("label") or m.get("symbol") or "?",
                "identifier": m.get("hTokenIdentifier") or m.get("identifier") or "",
                "supplied": float(m.get("supplyAmount") or m.get("supplied") or 0),
                "borrowed": float(m.get("borrowAmount") or m.get("borrowed") or 0),
                "value_supplied_usd": float(
                    m.get("supplyValueUSD") or m.get("valueSuppliedUsd") or 0
                ),
                "value_borrowed_usd": float(
                    m.get("borrowValueUSD") or m.get("valueBorrowedUsd") or 0
                ),
                "supply_apy": float(m.get("supplyAPY") or m.get("supply_apy") or 0),
                "borrow_apy": float(m.get("borrowAPY") or m.get("borrow_apy") or 0),
            }
        )
    supplied = float(data.get("totalSupplyUSD") or data.get("totalSuppliedUsd") or 0)
    borrowed = float(data.get("totalBorrowUSD") or data.get("totalBorrowedUsd") or 0)
    if not supplied and markets:
        supplied = sum(x["value_supplied_usd"] for x in markets)
    if not borrowed and markets:
        borrowed = sum(x["value_borrowed_usd"] for x in markets)
    return {
        "health_factor": float(data.get("healthFactor") or data.get("health_factor") or 999),
        "total_supplied_usd": supplied,
        "total_borrowed_usd": borrowed,
        "net_usd": supplied - borrowed,
        "markets": markets,
        "claimable_htm": float(data.get("pendingRewards") or data.get("claimableHtm") or 0),
        "claimable_htm_usd": float(
            data.get("pendingRewardsUSD") or data.get("claimableHtmUsd") or 0
        ),
        "source": "api",
    }


def fetch_position(wallet: str = LIA_WALLET) -> dict[str, Any]:
    data, url = _try_paths(HATOM_API_CANDIDATES, POSITION_PATHS, wallet=wallet)
    if isinstance(data, dict):
        pos = _normalize_api_position(data)
        pos["api_url"] = url
        pos["wallet"] = wallet
        pos["updated"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        return pos

    htokens = fetch_wallet_htokens(wallet)
    markets = [
        {
            "label": h.get("underlying") or h.get("ticker"),
            "identifier": h.get("identifier") or "",
            "supplied": h.get("balance") or 0,
            "borrowed": 0,
            "value_supplied_usd": h.get("value_usd") or 0,
            "value_borrowed_usd": 0,
            "supply_apy": 0,
            "borrow_apy": 0,
        }
        for h in htokens
    ]
    supplied = sum(m["value_supplied_usd"] for m in markets)
    return {
        "health_factor": 999.0,
        "total_supplied_usd": supplied,
        "total_borrowed_usd": 0.0,
        "net_usd": supplied,
        "markets": markets,
        "htokens": htokens,
        "claimable_htm": 0.0,
        "claimable_htm_usd": 0.0,
        "source": "wallet",
        "api_url": None,
        "api_error": url,
        "wallet": wallet,
        "updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "note": "Hatom HTTP API unavailable — H-token balances via MultiversX API only; HF/borrow N/A",
    }


def fetch_markets_snapshot() -> dict[str, Any]:
    data, url = _try_paths(HATOM_API_CANDIDATES, MARKETS_PATHS)
    if data is None:
        return {"ok": False, "markets": [], "api_url": None, "error": url}
    markets = data if isinstance(data, list) else (data.get("markets") or [])
    parsed = []
    for m in markets:
        if not isinstance(m, dict):
            continue
        parsed.append(
            {
                "symbol": m.get("symbol") or m.get("asset") or m.get("name"),
                "supply_apy": float(m.get("supplyAPY") or m.get("supply_apy") or 0),
                "borrow_apy": float(m.get("borrowAPY") or m.get("borrow_apy") or 0),
                "liquidity_usd": float(m.get("totalSupplyUSD") or m.get("liquidity") or 0),
            }
        )
    return {"ok": True, "markets": parsed, "api_url": url}


def best_stable_supply_apy(default: float = 0.05) -> float:
    snap = fetch_markets_snapshot()
    if not snap.get("ok"):
        return default
    stables = []
    for m in snap.get("markets") or []:
        sym = str(m.get("symbol") or "").upper()
        if any(x in sym for x in ("USDC", "USDT", "BUSD", "USD")):
            apy = float(m.get("supply_apy") or 0)
            if apy > 0:
                stables.append(apy)
    if not stables:
        return default
    # Hatom often returns percent (8.0) or fraction (0.08)
    apy = max(stables)
    if apy > 1.0:
        apy = apy / 100.0
    return apy


def sleeve_summary(wallet: str = LIA_WALLET) -> dict[str, Any]:
    pos = fetch_position(wallet)
    apy = best_stable_supply_apy()
    return {
        **pos,
        "suggested_stable_apy": apy,
        "venue": "hatom",
        "chain": "multiversx",
        "dapp": "https://app.hatom.com",
    }


if __name__ == "__main__":
    print(json.dumps(sleeve_summary(), indent=2))
