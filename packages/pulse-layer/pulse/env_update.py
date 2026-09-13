"""Frontend payload: ENVIRONMENT_UPDATE for Three.js / WebXR."""
from __future__ import annotations

from typing import Any

from pulse.visual_map import sentiment_to_visual

# vibe → accent color
VIBE_COLOR = {
    "hype_event": "#ffaa00",
    "art_glow": "#a78bfa",
    "whale_calm": "#22d3ee",
    "crash_fog": "#64748b",
    "neutral": "#94a3b8",
}


def category_to_vibe(category: str, velocity: str) -> str:
    if category == "MARKET_HYPE" or (velocity == "high" and category != "SOCIAL_CRASH"):
        return "hype_event"
    if category == "ART_TREND":
        return "art_glow"
    if category == "WHALE_MOVE":
        return "whale_calm"
    if category == "SOCIAL_CRASH":
        return "crash_fog"
    return "neutral"


def build_environment_update(
    *,
    sentiment: float,
    velocity: str,
    category: str,
    asset: str = "MACRO",
    context: str = "",
) -> dict[str, Any]:
    vibe = category_to_vibe(category, velocity)
    visual = sentiment_to_visual(sentiment, velocity)
    intensity = velocity if velocity in ("low", "medium", "high") else "low"
    return {
        "type": "ENVIRONMENT_UPDATE",
        "sentiment": round(float(sentiment), 4),
        "intensity": intensity,
        "color_target": VIBE_COLOR.get(vibe, VIBE_COLOR["neutral"]),
        "vibe": vibe,
        "category": category,
        "asset": asset,
        "context": (context or "")[:160],
        "three": visual,
    }
