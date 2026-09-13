"""Signal categories for Strategist + environment driver."""
from __future__ import annotations

import re
from typing import Literal

Category = Literal["MARKET_HYPE", "SOCIAL_CRASH", "ART_TREND", "WHALE_MOVE", "NEUTRAL"]

ART = re.compile(r"\b(nft|art|gallery|museum|webxr|xartists|generative|curat)\b", re.I)
WHALE = re.compile(r"\b(whale|unlock|treasury|otc|accumulation|bought \d)\b", re.I)
CRASH = re.compile(r"\b(hack|exploit|rug|crash|liquidat|insolvent|sec\b|lawsuit)\b", re.I)
HYPE = re.compile(r"\b(moon|ath|breakout|mainnet|listing|partnership|hype|pump)\b", re.I)


def categorize(text: str, sentiment: float) -> Category:
    t = text or ""
    if CRASH.search(t) or sentiment <= -0.45:
        return "SOCIAL_CRASH"
    if ART.search(t):
        return "ART_TREND"
    if WHALE.search(t):
        return "WHALE_MOVE"
    if HYPE.search(t) or sentiment >= 0.45:
        return "MARKET_HYPE"
    return "NEUTRAL"
