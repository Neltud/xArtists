"""Resolve paper vs live — auto never becomes live without LIA_LIVE_TRADING=1.

P0 honesty: force_mode=auto must not silently enable mainnet signing.
"""
from __future__ import annotations

import os
from pathlib import Path


def live_flag() -> bool:
    return (os.environ.get("LIA_LIVE_TRADING") or "0").strip() == "1"


def pem_path() -> str:
    return (os.environ.get("LIA_WALLET_PEM_PATH") or os.environ.get("PEM") or "").strip()


def pem_ok() -> bool:
    p = pem_path()
    return bool(p and Path(p).expanduser().is_file())


def resolve_mode(force_mode: str = "auto") -> str:
    """Return 'paper' | 'live'.

    - paper → always paper
    - live → live only if LIA_LIVE_TRADING=1 and PEM exists; else paper
    - auto → live only if LIA_LIVE_TRADING=1 and PEM; else paper
    """
    fm = (force_mode or "auto").strip().lower()
    if fm == "paper":
        return "paper"
    if fm in ("live", "auto"):
        if live_flag() and pem_ok():
            return "live"
        return "paper"
    return "paper"


def mode_report(force_mode: str = "auto") -> dict:
    m = resolve_mode(force_mode)
    return {
        "force_mode": force_mode,
        "resolved": m,
        "LIA_LIVE_TRADING": live_flag(),
        "pem_configured": pem_ok(),
        "note": (
            "Live signing allowed"
            if m == "live"
            else "Paper only — set LIA_LIVE_TRADING=1 and PEM for live"
        ),
    }
