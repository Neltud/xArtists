"""
Polymarket free signals (off-MVX) — advisory only for LIA.
Uses public Gamma API when reachable; falls back to data/polymarket_feed.json.
Never executes trades alone. Weight cap low (politics/macro noise).
"""
from __future__ import annotations

import json
import time
import urllib.request
from pathlib import Path
from typing import Any

_ROOT = Path(__file__).resolve().parents[2]
OUT = _ROOT / "data" / "polymarket_signals.json"
OFFLINE = _ROOT / "data" / "polymarket_feed.json"
GAMMA = "https://gamma-api.polymarket.com/markets?limit=30&active=true&closed=false"
MAX_WEIGHT = 0.12


def _fetch_gamma() -> list[dict[str, Any]]:
    try:
        req = urllib.request.Request(GAMMA, headers={"User-Agent": "xArtists-LIA/1.0"})
        with urllib.request.urlopen(req, timeout=15) as r:
            data = json.loads(r.read().decode())
        return data if isinstance(data, list) else data.get("data") or []
    except Exception:
        return []


def _load_offline() -> list[dict[str, Any]]:
    if not OFFLINE.exists():
        return []
    try:
        raw = json.loads(OFFLINE.read_text(encoding="utf-8"))
        return raw if isinstance(raw, list) else raw.get("markets") or []
    except json.JSONDecodeError:
        return []


def _parse_market(m: dict[str, Any]) -> dict[str, Any] | None:
    q = str(m.get("question") or m.get("title") or "").strip()
    if not q:
        return None
    # prices: yes probability ~ outcomePrices[0] or lastTradePrice
    yes = None
    op = m.get("outcomePrices") or m.get("outcome_prices")
    if isinstance(op, str):
        try:
            op = json.loads(op)
        except json.JSONDecodeError:
            op = None
    if isinstance(op, list) and op:
        try:
            yes = float(op[0])
        except (TypeError, ValueError):
            yes = None
    if yes is None:
        try:
            yes = float(m.get("lastTradePrice") or m.get("probability") or 0.5)
        except (TypeError, ValueError):
            yes = 0.5
    if yes > 1:
        yes = yes / 100.0
    # map extreme probs to soft bias for crypto/macro keywords
    low = q.lower()
    domain = "politics"
    if any(k in low for k in ("bitcoin", "btc", "eth", "crypto", "fed", "rate")):
        domain = "finance"
    elif any(k in low for k in ("art", "culture", "museum", "music")):
        domain = "culture"
    bias = "WAIT"
    if yes >= 0.65:
        bias = "BUY"  # market prices event likely — interpret cautiously
    elif yes <= 0.35:
        bias = "SELL"
    return {
        "question": q[:200],
        "yes_prob": round(yes, 4),
        "bias": bias,
        "domain": domain,
        "platform": "polymarket",
        "chain": "polygon_off_mvx",
        "url": str(m.get("slug") or m.get("url") or ""),
    }


def aggregate(markets: list[dict[str, Any]]) -> dict[str, Any]:
    parsed = [p for m in markets if (p := _parse_market(m))]
    if not parsed:
        return {
            "bias": "WAIT",
            "weight": 0.0,
            "n": 0,
            "markets": [],
            "note": "no polymarket data",
        }
    # finance-tagged markets weigh more for LIA trading; politics lower
    score = 0.0
    wsum = 0.0
    for p in parsed:
        w = 1.2 if p["domain"] == "finance" else (0.6 if p["domain"] == "politics" else 0.8)
        delta = 1.0 if p["bias"] == "BUY" else (-1.0 if p["bias"] == "SELL" else 0.0)
        # strength from distance to 0.5
        strength = abs(p["yes_prob"] - 0.5) * 2
        score += w * delta * strength
        wsum += w
    norm = score / wsum if wsum else 0.0
    bias = "BUY" if norm > 0.2 else ("SELL" if norm < -0.2 else "WAIT")
    weight = min(MAX_WEIGHT, abs(norm) * MAX_WEIGHT)
    return {
        "bias": bias,
        "weight": round(weight, 4),
        "score": round(norm, 4),
        "n": len(parsed),
        "markets": parsed[:15],
        "note": "Off-MVX advisory — never sole execute signal",
    }


def run(persist: bool = True) -> dict[str, Any]:
    markets = _fetch_gamma()
    source = "gamma_api"
    if not markets:
        markets = _load_offline()
        source = "offline_json"
    agg = aggregate(markets)
    out = {
        "updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "source": source,
        "max_weight": MAX_WEIGHT,
        "aggregate": agg,
    }
    if persist:
        OUT.parent.mkdir(parents=True, exist_ok=True)
        OUT.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return out


if __name__ == "__main__":
    print(json.dumps(run(), indent=2, ensure_ascii=False)[:2000])
