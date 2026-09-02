"""
Price oracle layer — prefer on-chain / DEX-indexed MultiversX sources.

Reality (MVX mainnet):
  - No standalone Chainlink feed deployed by xArtists
  - api.multiversx.com/economics + /tokens/{id} index on-chain DEX activity
  - Optional CoinGecko as low-weight centralized reference
  - Optional XEXCHANGE_PRICE_URL for custom DEX GraphQL

Config: data/oracle_config.json
Output: data/oracle_prices.json
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
CONFIG_PATH = _ROOT / "data" / "oracle_config.json"
DEFAULT_OUT = _ROOT / "data" / "oracle_prices.json"
API_MVX = os.environ.get("MVX_API", "https://api.multiversx.com").rstrip("/")

MAX_AGE_SEC = int(os.environ.get("ORACLE_MAX_AGE_SEC", "120"))
MAX_DEVIATION = float(os.environ.get("ORACLE_MAX_DEVIATION", "0.05"))


@dataclass
class OracleQuote:
    symbol: str
    price: float
    source: str
    ts: float
    stale: bool = False
    meta: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def load_config() -> dict[str, Any]:
    if CONFIG_PATH.exists():
        try:
            return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {
        "policy": {
            "max_age_sec": MAX_AGE_SEC,
            "max_deviation": MAX_DEVIATION,
            "prefer_onchain_weight": 2.0,
            "centralized_weight": 0.75,
        },
        "tokens": {
            "WEGLD": "WEGLD-bd4d79",
            "USDC": "USDC-c76f1f",
            "TRO": "TRO-94c925",
        },
    }


def _http_json(url: str, timeout: int = 12) -> Any:
    req = urllib.request.Request(
        url, headers={"User-Agent": "xArtists-LIA-Oracle/1.1", "Accept": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode())


def fetch_mvx_economics() -> Optional[OracleQuote]:
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
            meta={
                "onchain_index": True,
                "marketCap": data.get("marketCap"),
                "apr": data.get("apr"),
            },
        )
    except Exception as e:
        return OracleQuote(
            "EGLD-USD", 0.0, "mvx_economics", time.time(), True, {"error": str(e)}
        )


def fetch_mvx_token(token_id: str, symbol: str) -> Optional[OracleQuote]:
    try:
        data = _http_json(f"{API_MVX}/tokens/{token_id}")
        price = float(data.get("price") or 0)
        if price <= 0:
            return None
        return OracleQuote(
            symbol,
            price,
            f"mvx_token:{token_id}",
            time.time(),
            meta={
                "onchain_index": True,
                "ticker": data.get("ticker"),
                "name": data.get("name"),
                "token": token_id,
            },
        )
    except Exception as e:
        return OracleQuote(
            symbol, 0.0, f"mvx_token:{token_id}", time.time(), True, {"error": str(e)}
        )


def fetch_coingecko_egld() -> Optional[OracleQuote]:
    try:
        url = (
            "https://api.coingecko.com/api/v3/simple/price"
            "?ids=elrond-erd-2&vs_currencies=usd"
        )
        data = _http_json(url)
        price = float((data.get("elrond-erd-2") or {}).get("usd") or 0)
        if price <= 0:
            return None
        return OracleQuote(
            "EGLD-USD",
            price,
            "coingecko",
            time.time(),
            meta={"centralized": True},
        )
    except Exception as e:
        return OracleQuote(
            "EGLD-USD", 0.0, "coingecko", time.time(), True, {"error": str(e)}
        )


def fetch_xexchange_hint(pair: str = "WEGLDUSDC") -> Optional[OracleQuote]:
    url = os.environ.get("XEXCHANGE_PRICE_URL", "").strip()
    if not url:
        return None
    try:
        data = _http_json(url)
        price = float(data.get("price") or data.get("data", {}).get("price") or 0)
        if price <= 0:
            return None
        return OracleQuote(
            "EGLD-USD",
            price,
            f"xexchange:{pair}",
            time.time(),
            meta={"dex": True, "onchain_index": True},
        )
    except Exception as e:
        return OracleQuote(
            "EGLD-USD", 0.0, "xexchange", time.time(), True, {"error": str(e)}
        )


def _median_filter(
    quotes: list[OracleQuote], max_dev: float
) -> list[OracleQuote]:
    valid = [q for q in quotes if q.price > 0 and not q.meta.get("error")]
    if len(valid) < 2:
        return valid
    med = statistics.median(q.price for q in valid)
    out = []
    for q in valid:
        dev = abs(q.price - med) / med if med else 1.0
        if dev <= max_dev:
            out.append(q)
        else:
            q.meta["rejected_deviation"] = round(dev, 4)
            q.stale = True
    return out or valid


def _weight(q: OracleQuote, cfg: dict) -> float:
    pol = cfg.get("policy") or {}
    onchain_w = float(pol.get("prefer_onchain_weight", 2.0))
    cex_w = float(pol.get("centralized_weight", 0.75))
    if q.meta.get("centralized"):
        return cex_w
    if q.meta.get("onchain_index") or q.source.startswith("mvx") or "xexchange" in q.source:
        return onchain_w
    return 1.0


def _consensus_quotes(
    symbol: str,
    quotes: list[OracleQuote],
    cfg: dict,
) -> dict[str, Any]:
    pol = cfg.get("policy") or {}
    max_age = int(pol.get("max_age_sec", MAX_AGE_SEC))
    max_dev = float(pol.get("max_deviation", MAX_DEVIATION))
    now = time.time()
    for q in quotes:
        if now - q.ts > max_age:
            q.stale = True
    filtered = _median_filter(quotes, max_dev)
    live = [q for q in filtered if q.price > 0 and not q.stale]
    if not live:
        live = [q for q in filtered if q.price > 0]
    if not live:
        return {
            "ok": False,
            "symbol": symbol,
            "price": 0.0,
            "sources": [q.to_dict() for q in quotes],
            "error": "no valid oracle price",
            "ts": now,
        }
    weights = [_weight(q, cfg) for q in live]
    prices = [q.price for q in live]
    price = sum(p * w for p, w in zip(prices, weights)) / sum(weights)
    return {
        "ok": True,
        "symbol": symbol,
        "price": round(price, 8),
        "n_sources": len(live),
        "sources": [q.to_dict() for q in quotes],
        "ts": now,
        "max_age_sec": max_age,
        "max_deviation": max_dev,
    }


class PriceOracle:
    def __init__(
        self,
        fetchers: Optional[list[Callable[[], Optional[OracleQuote]]]] = None,
        config: Optional[dict] = None,
    ):
        self.config = config or load_config()
        tokens = (self.config.get("tokens") or {})
        wegld = tokens.get("WEGLD", "WEGLD-bd4d79")
        self.fetchers = fetchers or [
            fetch_mvx_economics,
            lambda: fetch_mvx_token(wegld, "EGLD-USD"),
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
                    OracleQuote(
                        "EGLD-USD",
                        0.0,
                        getattr(fn, "__name__", "fn"),
                        time.time(),
                        True,
                        {"error": str(e)},
                    )
                )
        return quotes

    def consensus(self) -> dict[str, Any]:
        return _consensus_quotes("EGLD-USD", self.collect(), self.config)

    def multi_token(self) -> dict[str, Any]:
        """Fetch all configured tokens + EGLD consensus."""
        cfg = self.config
        tokens = cfg.get("tokens") or {}
        pairs_out: dict[str, Any] = {}
        # EGLD primary
        pairs_out["EGLD-USD"] = self.consensus()
        # Token mids from MVX indexer (on-chain derived)
        mapping = [
            ("WEGLD-USD", tokens.get("WEGLD", "WEGLD-bd4d79")),
            ("USDC-USD", tokens.get("USDC", "USDC-c76f1f")),
            ("TRO-USD", tokens.get("TRO", "TRO-94c925")),
        ]
        if tokens.get("MEX"):
            mapping.append(("MEX-USD", tokens["MEX"]))
        for symbol, tid in mapping:
            q = fetch_mvx_token(tid, symbol)
            quotes = [q] if q else []
            pairs_out[symbol] = _consensus_quotes(symbol, quotes, cfg)
        return {
            "ok": any(p.get("ok") for p in pairs_out.values()),
            "network": "mainnet",
            "pairs": pairs_out,
            "egld_usd": float((pairs_out.get("EGLD-USD") or {}).get("price") or 0),
            "config_version": cfg.get("version"),
            "ts": time.time(),
            "updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "notes": cfg.get("notes") or [],
        }

    def run(self, persist: bool = True, multi: bool = True) -> dict[str, Any]:
        result = self.multi_token() if multi else self.consensus()
        # Flatten primary price for backward compat
        if multi and "price" not in result:
            result["price"] = result.get("egld_usd") or 0
            result["symbol"] = "EGLD-USD"
            eg = (result.get("pairs") or {}).get("EGLD-USD") or {}
            result["n_sources"] = eg.get("n_sources", 0)
            result["sources"] = eg.get("sources", [])
        if persist:
            DEFAULT_OUT.parent.mkdir(parents=True, exist_ok=True)
            DEFAULT_OUT.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
            # Mirror legacy egld_price.json for older consumers
            leg = {
                "price": result.get("price") or result.get("egld_usd"),
                "source": "oracle_multi",
                "updated": result.get("updated"),
                "ok": result.get("ok"),
            }
            (_ROOT / "data" / "egld_price.json").write_text(
                json.dumps(leg, indent=2) + "\n", encoding="utf-8"
            )
        return result


def fetch_egld_usd() -> float:
    r = PriceOracle().run(persist=False, multi=True)
    return float(r.get("egld_usd") or r.get("price") or 0)


def fetch_token_usd(token_id: str) -> float:
    q = fetch_mvx_token(token_id, token_id)
    return float(q.price) if q and q.price > 0 else 0.0


if __name__ == "__main__":
    print(json.dumps(PriceOracle().run(), indent=2))
