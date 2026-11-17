"""xOrus decision agent — bounded advisory paper board (phase-1 bridge)."""
from __future__ import annotations

try:
    from lia.xorus.decision_agent import *  # noqa: F401,F403
except Exception as exc:  # pragma: no cover
    raise ImportError("xorus.decision_agent phase-1 bridge failed") from exc
