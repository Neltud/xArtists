"""DEPRECATED — use xorus.swarm / xorus.run_xorus (phase 1b)."""
from __future__ import annotations
import warnings
warnings.warn("lia.xorus.swarm is deprecated; use xorus.swarm", DeprecationWarning, stacklevel=2)
from xorus.swarm import run_xorus, main
__all__ = ["run_xorus", "main"]
