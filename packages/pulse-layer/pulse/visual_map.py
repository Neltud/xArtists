"""Map sentiment → WebXR / Three.js visual params (protocol only)."""
from __future__ import annotations

from typing import Any


def sentiment_to_visual(sentiment: float, velocity: str) -> dict[str, Any]:
    """Frontend can lerp these uniforms."""
    s = max(-1.0, min(1.0, float(sentiment)))
    # 0 neutral dark · +1 saturated · -1 cold
    saturation = 0.35 + 0.55 * (s + 1) / 2
    particle_density = 0.2 + 0.8 * abs(s)
    if velocity == "high":
        particle_density = min(1.0, particle_density * 1.4)
    light_intensity = 0.4 + 0.6 * max(0, s)
    fog = 0.5 + 0.4 * max(0, -s)
    # hue: bullish cyan-violet · bearish red-gray
    hue = 0.55 + 0.15 * s
    return {
        "saturation": round(saturation, 3),
        "particleDensity": round(particle_density, 3),
        "lightIntensity": round(light_intensity, 3),
        "fogDensity": round(fog, 3),
        "hue": round(hue, 3),
        "chaos": 1.0 if velocity == "high" else 0.35 if velocity == "medium" else 0.1,
    }
