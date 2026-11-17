"""Hard safety contract for the xOrus backend.

No environment variable may flip these to authorize execution from this package.
"""
from __future__ import annotations

from types import MappingProxyType
from typing import Any

# Immutable public contract — mirrored into every board / report seal.
_SAFETY: dict[str, Any] = {
    "engine": "xorus",
    "mode": "paper_only",
    "executable": False,
    "live_trading": False,
    "live_locked": True,
    "signing_authorized": False,
    "trade_authorized": False,
    "mint_authorized": False,
    "payment_authorized": False,
    "lia_retired": True,
    "vellum_execution_path": False,
    "sentinel_veto": True,
    "chatgpt_weight_cap": 0.15,
    "min_signals_for_decision": 12,
    "min_independent_families": 3,
    "defined_signals": 120,
}

SAFETY = MappingProxyType(_SAFETY)


def seal(doc: dict[str, Any]) -> dict[str, Any]:
    """Force safety fields onto any outbound document."""
    out = dict(doc)
    out.update(
        {
            "engine": "xorus",
            "mode": "paper_only",
            "executable": False,
            "live_trading": False,
            "live_locked": True,
            "signing_authorized": False,
            "trade_authorized": False,
            "mint_authorized": False,
            "payment_authorized": False,
            "sentinel_veto": True,
        }
    )
    if isinstance(out.get("crosscut"), dict):
        cc = dict(out["crosscut"])
        cc["executable"] = False
        cc["live_trading"] = False
        out["crosscut"] = cc
    return out
