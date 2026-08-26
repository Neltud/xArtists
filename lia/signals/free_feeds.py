"""
Free multi-domain signals: crypto, finance, politics, culture, arts.
Offline JSON + optional public endpoints. Fail-soft. Advisory only.
"""
from __future__ import annotations

import json
import time
import urllib.request
from pathlib import Path
from typing import Any

_ROOT = Path(__file__).resolve().parents[2]
OUT = _ROOT / "data" / "free_signals.json"
SEED = _ROOT / "data" / "free_signals_seed.json"

DOMAINS = ("crypto", "finance", "politics", "culture", "arts")


def _get(url: str, timeout: int = 12) -> Any:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "xArtists-LIA/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read().decode())
    except Exception:
        return None


def fetch_crypto_fear_greed() -> list[dict[str, Any]]:
    data = _get("https://api.alternative.me/fng/?limit=1")
    if not data or not isinstance(data, dict):
        return []
    rows = data.get("data") or []
    if not rows:
        return []
    v = int(rows[0].get("value") or 50)
    label = str(rows[0].get("value_classification") or "")
    bias = "BUY" if v >= 60 else ("SELL" if v <= 30 else "WAIT")
    return [{
        "domain": "crypto",
        "source": "alternative.me/fng",
        "title": f"Fear&Greed {v} ({label})",
        "bias": bias,
        "score": (v - 50) / 50.0,
        "free": True,
    }]


def fetch_egld_hint() -> list[dict[str, Any]]:
    """Lightweight public ticker hint — not a full oracle."""
    data = _get(
        "https://api.coingecko.com/api/v3/simple/price?ids=elrond-erd-2&vs_currencies=usd&include_24hr_change=true"
    )
    if not data or not isinstance(data, dict):
        return []
    node = data.get("elrond-erd-2") or {}
    ch = float(node.get("usd_24h_change") or 0)
    bias = "BUY" if ch > 3 else ("SELL" if ch < -3 else "WAIT")
    return [{
        "domain": "crypto",
        "source": "coingecko",
        "title": f"EGLD 24h {ch:+.2f}%",
        "bias": bias,
        "score": max(-1.0, min(1.0, ch / 10.0)),
        "free": True,
    }]


def load_seed() -> list[dict[str, Any]]:
    if not SEED.exists():
        return []
    try:
        raw = json.loads(SEED.read_text(encoding="utf-8"))
        items = raw if isinstance(raw, list) else raw.get("items") or []
        out = []
        for it in items:
            if not isinstance(it, dict):
                continue
            dom = str(it.get("domain") or "culture")
            if dom not in DOMAINS:
                dom = "culture"
            out.append({
                "domain": dom,
                "source": str(it.get("source") or "seed"),
                "title": str(it.get("title") or it.get("text") or "")[:180],
                "bias": str(it.get("bias") or "WAIT").upper(),
                "score": float(it.get("score") or 0),
                "free": True,
            })
        return out
    except (json.JSONDecodeError, TypeError, ValueError):
        return []


def aggregate(items: list[dict[str, Any]]) -> dict[str, Any]:
    by: dict[str, list] = {d: [] for d in DOMAINS}
    for it in items:
        by.setdefault(it.get("domain") or "culture", []).append(it)
    domain_bias = {}
    for d, rows in by.items():
        if not rows:
            domain_bias[d] = {"bias": "WAIT", "n": 0, "avg_score": 0.0}
            continue
        avg = sum(float(r.get("score") or 0) for r in rows) / len(rows)
        bias = "BUY" if avg > 0.2 else ("SELL" if avg < -0.2 else "WAIT")
        domain_bias[d] = {"bias": bias, "n": len(rows), "avg_score": round(avg, 4)}
    # trading-relevant: crypto + finance dominate weight
    c = domain_bias.get("crypto", {}).get("avg_score", 0) or 0
    f = domain_bias.get("finance", {}).get("avg_score", 0) or 0
    blend = 0.6 * c + 0.4 * f
    bias = "BUY" if blend > 0.2 else ("SELL" if blend < -0.2 else "WAIT")
    weight = min(0.15, abs(blend) * 0.15)
    return {
        "bias": bias,
        "weight": round(weight, 4),
        "blend_score": round(blend, 4),
        "by_domain": domain_bias,
        "n": len(items),
    }


def run(persist: bool = True) -> dict[str, Any]:
    items: list[dict[str, Any]] = []
    items.extend(fetch_crypto_fear_greed())
    items.extend(fetch_egld_hint())
    items.extend(load_seed())
    agg = aggregate(items)
    out = {
        "updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "items": items[:40],
        "aggregate": agg,
        "note": "Free feeds — advisory; culture/arts for ticker context not size-up",
    }
    if persist:
        OUT.parent.mkdir(parents=True, exist_ok=True)
        OUT.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return out


if __name__ == "__main__":
    print(json.dumps(run(), indent=2, ensure_ascii=False)[:2500])
