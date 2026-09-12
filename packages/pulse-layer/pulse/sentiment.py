"""Lightweight vibe decoder — lexicon + velocity (no heavy model required for v0)."""
from __future__ import annotations

import math
import re
from dataclasses import dataclass

POS = {
    "moon", "bull", "pump", "breakout", "ath", "partnership", "launch", "mainnet",
    "upgrade", "surge", "accumulate", "undervalued", "alpha", "hype", "fire",
}
NEG = {
    "hack", "exploit", "rug", "scam", "dump", "bear", "crash", "ban", "lawsuit",
    "insolvent", "delay", "outage", "fear", "selloff", "liquidat",
}


@dataclass
class SentimentResult:
    score: float  # -1 .. +1
    label: str
    tokens_hit: int


def analyze_text(text: str) -> SentimentResult:
    words = re.findall(r"[a-zA-Z$#]{2,}", (text or "").lower())
    if not words:
        return SentimentResult(0.0, "neutral", 0)
    p = sum(1 for w in words if any(k in w for k in POS))
    n = sum(1 for w in words if any(k in w for k in NEG))
    total = p + n
    if total == 0:
        return SentimentResult(0.0, "neutral", 0)
    raw = (p - n) / total
    # mild length dampening
    score = max(-1.0, min(1.0, raw * (1.0 - math.exp(-total / 5))))
    if score >= 0.25:
        label = "bullish"
    elif score <= -0.25:
        label = "bearish"
    else:
        label = "neutral"
    return SentimentResult(round(score, 4), label, total)


def velocity_bucket(delta_score: float, window_hits: int) -> str:
    """Hype if sentiment jumps and volume of hits rises."""
    mag = abs(delta_score)
    if mag >= 0.5 and window_hits >= 5:
        return "high"
    if mag >= 0.25 and window_hits >= 3:
        return "medium"
    return "low"
