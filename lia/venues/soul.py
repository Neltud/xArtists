"""
Soul Protocol — FUTURE interface (experimental)
===============================================
Placeholder for upcoming Soul Protocol functions:
  - restake / shared security hooks
  - soulbound credit / identity-gated yield
  - cross-venue yield routing into LIA yield_sleeve

No live endpoints until protocol publishes API/SC addresses.
All methods return structured stubs safe for Vellum (no network).
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Optional

from lia.circuit.strategies import Signal

ENABLED = False  # flip when production endpoints exist


@dataclass
class SoulConfig:
    api_base: str = ""
    chain_ids: list[str] = field(default_factory=lambda: ["multiversx", "solana"])
    min_credit_score: float = 0.0
    restake_asset: str = "EGLD"


def is_enabled() -> bool:
    return ENABLED and bool(SoulConfig().api_base)


def soul_yield_opportunity(
    *,
    asset: str = "USDC",
    amount_usd: float = 0.0,
    credit_score: Optional[float] = None,
) -> dict[str, Any]:
    """Future: quote Soul yield vault / restake APY."""
    if not is_enabled():
        return {
            "ok": False,
            "status": "disabled",
            "asset": asset,
            "amount_usd": amount_usd,
            "apy": None,
            "note": "Soul Protocol not enabled — set ENABLED + api_base when live",
        }
    # placeholder branch for future HTTP
    return {"ok": False, "status": "not_implemented", "asset": asset}


def soul_restake_intent(*, asset: str, amount: float) -> dict[str, Any]:
    """Future: build unsigned restake intent for executor."""
    return {
        "ok": False,
        "action": "restake",
        "asset": asset,
        "amount": amount,
        "executable": False,
        "status": "planned",
    }


def soul_signal(trade_confidence: float) -> Signal:
    """
    If Soul yield beats idle threshold and no trade edge, emit YIELD with venue=soul.
    Currently always WAIT/disabled meta unless ENABLED.
    """
    if not is_enabled():
        return Signal(
            "WAIT",
            "",
            0.3,
            "SOUL",
            "soul disabled",
            meta={"venue": "soul", "status": "experimental", "executable": False},
        )
    if trade_confidence < 0.65:
        return Signal(
            "YIELD",
            "SOUL-VAULT",
            0.65,
            "SOUL",
            "soul yield preferred",
            meta={"venue": "soul", "executable": False},
        )
    return Signal("WAIT", "", 0.4, "SOUL", "trade preferred", meta={"venue": "soul"})


def future_functions() -> list[dict[str, str]]:
    return [
        {"name": "soul_yield_opportunity", "status": "stub", "desc": "Quote vault APY"},
        {"name": "soul_restake_intent", "status": "stub", "desc": "Build restake intent"},
        {"name": "soul_signal", "status": "stub", "desc": "YIELD signal for fuse"},
        {"name": "soulbound_credit_check", "status": "planned", "desc": "Gate size by identity score"},
        {"name": "cross_chain_sleeve_route", "status": "planned", "desc": "Route surplus 30% via Soul"},
    ]
