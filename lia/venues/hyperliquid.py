"""
Hyperliquid perps/funding — planned adapter (not Solana).
Read-only meta + signal shape for future funding capture / hedge.
"""
from __future__ import annotations

from typing import Any

from lia.circuit.strategies import Signal


def funding_signal(
    *,
    coin: str,
    funding_rate: float,
    threshold: float = 0.0001,
) -> Signal:
    """
    funding_rate: fraction per period (venue-specific).
    Positive large funding → consider short bias (receive funding); inverse for long.
    Not wired to executor.
    """
    if abs(funding_rate) < threshold:
        return Signal(
            "WAIT",
            coin,
            0.4,
            "HL_FUND",
            "funding noise",
            meta={"venue": "hyperliquid", "executable": False},
        )
    action = "SELL" if funding_rate > 0 else "BUY"
    conf = min(0.75, 0.5 + abs(funding_rate) * 1000)
    return Signal(
        action,
        coin,
        conf,
        "HL_FUND",
        f"funding={funding_rate:.6f}",
        meta={"venue": "hyperliquid", "chain": "hyperliquid", "executable": False},
    )


def venue_info() -> dict[str, Any]:
    return {
        "id": "hyperliquid",
        "category": "perps",
        "status": "planned",
        "risk": "Separate from MVX spot compound; max notional cap required",
    }
