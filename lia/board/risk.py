"""
Trading risk limits — clarify HF vs block-time arb + max trades/day.
"""
from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Any


@dataclass
class RiskLimits:
    # MultiversX ~6s blocks → max meaningful arb attempts ~ per block, not sub-ms
    hf_mode: str = "block_scan"
    approx_block_time_sec: int = 6
    max_arb_scans_per_day: int = 14_400  # 86400/6 theoretical upper
    max_trades_per_day: int = 48  # operational LIA cap (not every block)
    max_trades_per_hour: int = 6
    min_edge_after_fees: float = 0.004  # 0.4%
    fee_roundtrip: float = 0.006
    gas_buffer_usd: float = 0.05
    live_trading_default: bool = False
    note: str = (
        "Not CEX HFT. One decision cycle per block at most; "
        "ops cap max_trades_per_day to control gas and slippage."
    )

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


DEFAULT_LIMITS = RiskLimits()


def can_open_trade(
    *,
    trades_today: int,
    trades_this_hour: int,
    limits: RiskLimits | None = None,
) -> dict[str, Any]:
    lim = limits or DEFAULT_LIMITS
    ok = trades_today < lim.max_trades_per_day and trades_this_hour < lim.max_trades_per_hour
    return {
        "ok": ok,
        "trades_today": trades_today,
        "trades_this_hour": trades_this_hour,
        "max_trades_per_day": lim.max_trades_per_day,
        "max_trades_per_hour": lim.max_trades_per_hour,
        "reason": None if ok else "trade limit reached",
    }
