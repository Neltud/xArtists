"""DEPRECATED shim — use top-level package `xorus`.

LIA path is retired. Prefer:
  from xorus import run_xorus
  python -m xorus
"""
from __future__ import annotations

import warnings

warnings.warn(
    "lia.xorus is deprecated; import from top-level package 'xorus' instead. LIA is retired.",
    DeprecationWarning,
    stacklevel=2,
)

try:
    from xorus import run_xorus
    from xorus.safety import SAFETY
except ImportError:  # pragma: no cover — during partial checkouts
    from lia.xorus.swarm import run_xorus  # type: ignore

    SAFETY = {"executable": False, "live_trading": False, "lia_retired": True}

__all__ = ["run_xorus", "SAFETY"]
