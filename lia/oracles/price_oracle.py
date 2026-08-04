"""
Price oracle layer — prefer on-chain / DEX-derived sources over CEX alone.

Sources (priority):
  1. MultiversX economics API (network-native EGLD metrics when available)
  2. xExchange-style pair mid (GraphQL or public price endpoint if configured)
  3. Multi-source median fallback (public APIs) with freshness + deviation checks

Never trade solely on a single stale CEX tick. Paper-safe; no PEM.
"""
from __future__ import annotations

import json
import os
import statistics
import time
import urllib.request
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Callable, Optional

_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUT = _ROOT / "data" / "oracle_prices.json"
API_MVX = os.environ.get("MVX_API", "https://api.multiversx.com")

# Max age before quote marked stale (seconds)
MAX_AGE_SEC = int(os.environ.get("ORACLE_MAX_AGE_SEC", "120"))
# Reject sources that deviate > X from median
MAX_DEVIATION = float(os.environ.get("ORACLE_MAX_DEVIATION", "0.05"))


@dataclass
class OracleQuote:
    symbol: str  # EGLD-USD
    price: float
    source: str
    ts: float
    stale: bool = False
    meta: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def _http_json(url: str, timeout: int = 15) -> Any:
    req = urllib.request.Request(url, headers={"User-Agent": "xArtists-LIA-Oracle/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode())


def fetch_mvx_economics() -> Optional[OracleQuote]:
    """Network economics endpoint — EGLD price when provided by API."""
    try:
        data = _http_json(f"{API_MVX}/economics")
        price = float(data.get("price") or data.get("egldPrice") or 0)
        if price <= 0:
            return None
        return OracleQuote(
            "EGLD-USD",
            price,
            "mvx_economics",
            time.time(),
            meta={"raw_keys": list(data.keys())[:12]},
        )
    except Exception as e:
        return OracleQuote("EGLD-USD", 0.0, "mvx_economics", time.time(), True, {"error": str(e)})


def fetch_coingecko_egld() -> Optional[OracleQuote]:
    """Secondary public reference (not decentralized — labeled)."""
    try:
        url = "https://api.coingecko.com/api/v3/simple/price?ids=elrond-erd-2&vs_currencies=usd"
        data = _http_json(url)
        price = float((data.get("elrond-erd-2") or {}).get("usd") or 0)
        if price <= 0:
            return None
        return OracleQuote("EGLD-USD", price, "coingecko", time.time(), meta={"centralized": True})
    except Exception as e:
        return OracleQuote("EGLD-USD", 0.0, "coingecko", time.time(), True, {"error": str(e)})


def fetch_xexchange_hint(pair: str = "WEGLDUSDC") -> Optional[OracleQuote]:
    """
    Optional DEX mid: set XEXCHANGE_PRICE_URL to a GraphQL/REST that returns {price: number}.
    Without URL → skip (no invent).
    """
    url = os.environ.get("XEXCHANGE_PRICE_URL", "").strip()
    if not url:
        return None
    try:
        data = _http_json(url)
        price = float(data.get("price") or data.get("data", {}).get("price") or 0)
        if price <= 0:
            return None
        return OracleQuote("EGLD-USD", price, f"xexchange:{pair}", time.time(), meta={"dex": True})
    except Exception as e:
        return OracleQuote("EGLD-USD", 0.0, "xexchange", time.time(), True, {"error": str(e)})


def _median_filter(quotes: list[OracleQuote]) -> list[OracleQuote]:
    valid = [q for q in quotes if q.price > 0 and not q.meta.get("error")]
    if len(valid) < 2:
        return valid
    med = statistics.median(q.price for q in valid)
    out = []
    for q in valid:
        dev = abs(q.price - med) / med if med else 1.0
        if dev <= MAX_DEVIATION:
            out.append(q)
        else:
            q.meta["rejected_deviation"] = round(dev, 4)
            q.stale = True
    return out or valid


class PriceOracle:
    def __init__(self, fetchers: Optional[list[Callable[[], Optional[OracleQuote]]]] = None):
        self.fetchers = fetchers or [
            fetch_mvx_economics,
            fetch_xexchange_hint,
            fetch_coingecko_egld,
        ]

    def collect(self) -> list[OracleQuote]:
        quotes: list[OracleQuote] = []
        for fn in self.fetchers:
            try:
                q = fn()
                if q is not None:
                    quotes.append(q)
            except Exception as e:
                quotes.append(
                    OracleQuote("EGLD-USD", 0.0, getattr(fn, "__name__", "fn"), time.time(), True, {"error": str(e)})
                )
        return quotes

    def consensus(self) -> dict[str, Any]:
        raw = self.collect()
        now = time.time()
        for q in raw:
            if now - q.ts > MAX_AGE_SEC:
                q.stale = True
        filtered = _median_filter(raw)
        live = [q for q in filtered if q.price > 0 and not q.stale]
        if not live:
            live = [q for q in filtered if q.price > 0]
        if not live:
            return {
                "ok": False,
                "price": 0.0,
                "symbol": "EGLD-USD",
                "sources": [q.to_dict() for q in raw],
                "error": "no valid oracle price",
                "ts": now,
            }
        # Prefer mvx / dex labeled sources in weighted median
        weights = []
        prices = []
        for q in live:
            w = 2.0 if q.source.startswith("mvx") or "xexchange" in q.source else 1.0
            if q.meta.get("centralized"):
                w = 0.75
            weights.append(w)
            prices.append(q.price)
        # weighted average
        price = sum(p * w for p, w in zip(prices, weights)) / sum(weights)
        return {
            "ok": True,
            "price": round(price, 6),
            "symbol": "EGLD-USD",
            "n_sources": len(live),
            "sources": [q.to_dict() for q in raw],
            "ts": now,
            "max_age_sec": MAX_AGE_SEC,
            "max_deviation": MAX_DEVIATION,
        }

    def run(self, persist: bool = True) -> dict[str, Any]:
        result = self.consensus()
        if persist:
            DEFAULT_OUT.parent.mkdir(parents=True, exist_ok=True)
            DEFAULT_OUT.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
        return result


def fetch_egld_usd() -> float:
    """Convenience for gas / micro_trade egld_usd param."""
    r = PriceOracle().run(persist=False)
    return float(r.get("price") or 0)


if __name__ == "__main__":
    print(json.dumps(PriceOracle().run(), indent=2))
