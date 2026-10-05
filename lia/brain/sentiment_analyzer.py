"""Lightweight market / art-market sentiment proxy (paper)."""
from __future__ import annotations

import json
import math
import time
import urllib.request
from dataclasses import dataclass
from typing import Any

API = "https://api.multiversx.com"


@dataclass(frozen=True)
class SentimentSnapshot:
    score: float  # -1 .. 1
    egld_usd: float | None
    source: str
    ts: str


def _get(url: str) -> Any:
    req = urllib.request.Request(url, headers={"User-Agent": "xArtists-sentiment/1.0"})
    with urllib.request.urlopen(req, timeout=12) as r:
        return json.loads(r.read().decode())


def analyze_market_sentiment() -> SentimentSnapshot:
    ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    egld = None
    score = 0.0
    source = "neutral_default"
    try:
        econ = _get(f"{API}/economics")
        egld = float(econ.get("price") or 0) or None
        # Soft cyclic proxy + price level bias (not prediction)
        h = time.gmtime().tm_hour + time.gmtime().tm_min / 60.0
        cyclic = math.sin(h / 24 * math.pi * 2) * 0.12
        level = 0.0
        if egld:
            # mild bias around ~4–6 USD band — illustrative only
            level = max(-0.15, min(0.15, (egld - 5.0) / 20.0))
        score = max(-1.0, min(1.0, cyclic + level))
        source = "economics+cyclic"
    except Exception:
        source = "fallback_neutral"
    return SentimentSnapshot(score=round(score, 4), egld_usd=egld, source=source, ts=ts)


def artist_popularity_boost(artist: str, style: str = "") -> float:
    """Deterministic pseudo-popularity from name hash (stable, not social scrape)."""
    key = (artist or "unknown").lower().strip() + "|" + (style or "").lower()
    h = sum(ord(c) for c in key) % 100
    return (h / 100.0) * 0.4  # 0 .. 0.4
