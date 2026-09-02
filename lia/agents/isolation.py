"""
Hard isolation helpers: protocol LIA book vs owner sub-agent stakes.
"""
from __future__ import annotations

from typing import Any

LIA_SCOPE = "protocol"
OWNER_SCOPE = "owner_subagent"


def assert_not_protocol_wallet(address: str, lia_wallet: str) -> None:
    if address.strip().lower() == lia_wallet.strip().lower():
        raise ValueError("Owner sub-agent cannot use LIA protocol wallet")


def scope_for_stake(stake: dict[str, Any]) -> str:
    return OWNER_SCOPE


def scope_for_lia_run() -> str:
    return LIA_SCOPE


def merge_forbidden(protocol_equity: float, owner_stakes_equity: float) -> dict[str, Any]:
    """Reporting only — never sum into one trading budget for live."""
    return {
        "protocol_equity": protocol_equity,
        "owner_stakes_equity": owner_stakes_equity,
        "combined_display_only": protocol_equity + owner_stakes_equity,
        "live_budget_protocol_only": protocol_equity,
        "note": "Do not use combined figure for LIA_LIVE sizing",
    }
