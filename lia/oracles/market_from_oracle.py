"""
Build market/book inputs for swarm + compound from oracle snapshot.

Priority:
  1. Fresh PriceOracle().run (network)
  2. data/oracle_prices.json if age < max_age
  3. data/egld_price.json / lia_v6_status market fallback
  4. dex_mids attach (economics / token / mex)
"""
from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any, Optional

_ROOT = Path(__file__).resolve().parents[2]


def _load_json(path: Path) -> dict[str, Any]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}


def load_oracle_prices(max_age_sec: float = 180.0) -> dict[str, Any]:
    p = _ROOT / "data" / "oracle_prices.json"
    if not p.exists():
        return {}
    data = _load_json(p)
    try:
        age = time.time() - p.stat().st_mtime
        if age > max_age_sec:
            data = dict(data)
            data["_stale_file"] = True
            data["_age_sec"] = age
    except Exception:
        pass
    return data


def refresh_oracle(*, persist: bool = True) -> dict[str, Any]:
    from lia.oracles.price_oracle import PriceOracle

    return PriceOracle().run(persist=persist, multi=True)


def egld_usd_from_sources(
    oracle: Optional[dict[str, Any]] = None,
    status: Optional[dict[str, Any]] = None,
) -> float:
    if oracle and oracle.get("egld_usd"):
        return float(oracle["egld_usd"])
    if oracle and oracle.get("price"):
        return float(oracle["price"])
    pairs = (oracle or {}).get("pairs") or {}
    eg = pairs.get("EGLD-USD") or pairs.get("WEGLD-USD") or {}
    if eg.get("price"):
        return float(eg["price"])
    leg = _load_json(_ROOT / "data" / "egld_price.json")
    if leg.get("egld_usd"):
        return float(leg["egld_usd"])
    if leg.get("price"):
        return float(leg["price"])
    st = status or _load_json(_ROOT / "data" / "lia_v6_status.json")
    m = st.get("market") or {}
    return float(m.get("egld_price") or m.get("egld_usd") or 0)


def token_usd(token_id: str, oracle: Optional[dict[str, Any]] = None) -> float:
    oracle = oracle or load_oracle_prices()
    tokens = oracle.get("tokens") or {}
    if token_id in tokens and isinstance(tokens[token_id], dict):
        return float(tokens[token_id].get("price") or 0)
    for k, v in tokens.items():
        if isinstance(v, dict) and (
            k == token_id or v.get("token") == token_id or token_id in k
        ):
            return float(v.get("price") or 0)
    pairs = oracle.get("pairs") or {}
    for sym, row in pairs.items():
        if token_id.split("-")[0] in sym and isinstance(row, dict):
            return float(row.get("price") or 0)
    return 0.0


def build_market_from_oracle(
    *,
    refresh: bool = True,
    token: str = "WEGLD-bd4d79",
    status: Optional[dict[str, Any]] = None,
    extra: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    oracle: dict[str, Any] = {}
    err = None
    if refresh:
        try:
            oracle = refresh_oracle(persist=True)
        except Exception as e:
            err = str(e)
            oracle = load_oracle_prices()
    else:
        oracle = load_oracle_prices()

    status = status or _load_json(_ROOT / "data" / "lia_v6_status.json")
    m_status = status.get("market") or {}
    egld = egld_usd_from_sources(oracle, status)
    wegld = token_usd("WEGLD-bd4d79", oracle) or token_usd("WEGLD", oracle) or egld
    price = float(wegld or egld or m_status.get("egld_price") or 0)

    ok = bool(oracle.get("ok")) and price > 0
    market: dict[str, Any] = {
        "token": token,
        "price": price,
        "vwap_24h": float(m_status.get("vwap_24h") or price * 0.998),
        "rsi_14": float(m_status.get("rsi_14") or 50),
        "trend_7d_pct": float(m_status.get("trend_7d_pct") or 0),
        "price_change_1h": float(m_status.get("price_change_1h") or 0),
        "price_change_24h": float(m_status.get("price_change_24h") or 0),
        "liquidity_usd": float(m_status.get("liquidity_usd") or 150_000),
        "fear_greed": float(m_status.get("fear_greed") or 50),
        "gs_bias": str(m_status.get("gs_bias") or "NEUTRAL"),
        "gs_regime": str(m_status.get("gs_regime") or m_status.get("guard_status") or "NEUTRAL"),
        "egld_usd": egld,
        "oracle_ok": ok,
        "oracle_sources": int(oracle.get("n_sources") or 0),
        "oracle_updated": oracle.get("updated"),
        "oracle_error": err,
        "dex_a": float(m_status.get("price_dex_a") or price),
        "dex_b": float(m_status.get("price_dex_b") or price),
    }
    if extra:
        market.update(extra)
    try:
        from lia.oracles.dex_mids import attach_to_market

        market = attach_to_market(market)
    except Exception as e:
        market["dex_mids_error"] = str(e)[:120]
    return market


def build_book_from_status(
    status: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    status = status or _load_json(_ROOT / "data" / "lia_v6_status.json")
    port = status.get("portfolio") or {}
    equity = float(port.get("total_usd") or port.get("equity_usd") or 100)
    return {
        "equity_usd": equity,
        "deployable_usd": float(port.get("deployable_usd") or equity * 0.4),
        "drawdown": float(port.get("drawdown") or 0),
        "consecutive_wins": int(port.get("consecutive_wins") or 0),
        "consecutive_losses": int(port.get("consecutive_losses") or 0),
    }
