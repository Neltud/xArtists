"""xOrus analysis report — sealed paper document (phase-1 bridge)."""
from __future__ import annotations

try:
    from lia.xorus.analysis_report import *  # noqa: F401,F403
except Exception as exc:  # pragma: no cover
    raise ImportError("xorus.analysis_report phase-1 bridge failed") from exc
