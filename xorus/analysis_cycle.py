"""xOrus analysis cycle — public Binance klines → sealed paper report.

Re-exports the phase-1 port. Implementation body lives under lia.xorus until
the full inlined module is committed; API path is xorus.analysis_cycle only.
"""
from __future__ import annotations

try:
    from lia.xorus.analysis_cycle import *  # noqa: F401,F403
except Exception as exc:  # pragma: no cover
    raise ImportError(
        "xorus.analysis_cycle requires lia.xorus.analysis_cycle during phase-1 bridge"
    ) from exc
