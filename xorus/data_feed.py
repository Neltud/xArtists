"""xOrus data feed helpers (phase-1 bridge)."""
from __future__ import annotations

try:
    from lia.xorus.data_feed import *  # noqa: F401,F403
except Exception as exc:  # pragma: no cover
    raise ImportError("xorus.data_feed phase-1 bridge failed") from exc
