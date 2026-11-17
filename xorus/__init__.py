"""xOrus — canonical paper intelligence backend for xArtists.

Replaces LIA / Vellum execution path. Never authorizes live trading, mint, signing, or payment.
"""
from __future__ import annotations

from xorus.safety import SAFETY
from xorus.swarm import run_xorus

__all__ = ["run_xorus", "SAFETY", "__version__"]
__version__ = "0.2.0-paper"
