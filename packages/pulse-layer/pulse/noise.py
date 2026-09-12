"""Noise filter — botty / spam heuristics."""
from __future__ import annotations

import re

URL_RE = re.compile(r"https?://\S+", re.I)
REPEAT_RE = re.compile(r"(.)\1{4,}")


def is_noise(text: str, *, followers: int = 0, is_verified: bool = False) -> bool:
    t = (text or "").strip()
    if len(t) < 8:
        return True
    if t.count("#") > 8:
        return True
    if len(URL_RE.findall(t)) > 3:
        return True
    if REPEAT_RE.search(t):
        return True
    # very new empty accounts often spam
    if followers == 0 and not is_verified and len(t) < 40:
        return True
    return False
