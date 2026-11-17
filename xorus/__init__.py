"""xOrus — canonical paper intelligence backend for xArtists.

Replaces LIA / Vellum execution path. This package never authorizes live trading,
mint, signing, or payment. Sentinel veto is absolute. External LLM briefs are
advisory only (ChatGPT weight capped at 15%).

Entry points:
  PYTHONPATH=. python -m xorus
  PYTHONPATH=. python -m xorus.production_run
  from xorus import run_xorus, SAFETY
"""
from __future__ import annotations

from xorus.safety import SAFETY
from xorus.swarm import run_xorus

__all__ = ["run_xorus", "SAFETY", "__version__"]

__version__ = "0.1.0-paper"
