"""xOrus preprod gates (phase-1 bridge)."""
from __future__ import annotations

try:
    from lia.xorus.preprod_gate import *  # noqa: F401,F403
except Exception as exc:  # pragma: no cover
    raise ImportError("xorus.preprod_gate phase-1 bridge failed") from exc
