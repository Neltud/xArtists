"""
Collect venue-aware signals and fuse with core strategies.
"""
from __future__ import annotations

from typing import Any, Optional

from lia.circuit.strategies import (
    Signal,
    fuse_signals,
    mean_reversion_liquid,
    micro_arb,
    momentum_regime,
    yield_first,
)
from lia.venues import list_venues
from lia.venues.hyperliquid import funding_signal
from lia.venues.mvx import hatom_yield_signal, xexchange_onedex_arb, xoxno_note
from lia.venues.solana import jupiter_edge_signal
from lia.venues.soul import future_functions, soul_signal


def collect_core_signals(
    *,
    token: str,
    price: float,
    vwap_24h: float = 0.0,
    rsi_14: float = 50.0,
    liquidity_usd: float = 0.0,
    price_change_1h: float = 0.0,
    price_change_24h: float = 0.0,
    volume_spike: float = 1.0,
    gs_regime: str = "NEUTRAL",
    gs_bias: str = "NEUTRAL",
    price_dex_a: float = 0.0,
    price_dex_b: float = 0.0,
) -> list[Signal]:
    sigs = [
        mean_reversion_liquid(
            token=token,
            price=price,
            vwap_24h=vwap_24h or price,
            rsi_14=rsi_14,
            liquidity_usd=liquidity_usd or 100_000,
        ),
        momentum_regime(
            token=token,
            price_change_1h=price_change_1h,
            price_change_24h=price_change_24h,
            volume_spike=volume_spike,
            gs_regime=gs_regime,
            gs_bias=gs_bias,
        ),
        micro_arb(
            token=token,
            price_a=price_dex_a or price,
            price_b=price_dex_b or price,
        ),
    ]
    best_conf = max((s.confidence for s in sigs if s.action == "BUY"), default=0.0)
    sigs.append(yield_first(trade_confidence=best_conf))
    return sigs


def collect_venue_signals(
    *,
    token: str = "WEGLD-bd4d79",
    trade_confidence: float = 0.5,
    price_xex: Optional[float] = None,
    price_onedex: Optional[float] = None,
    jupiter_expected: float = 0.0,
    jupiter_quoted: float = 0.0,
    hl_coin: str = "ETH",
    hl_funding: float = 0.0,
    include_planned: bool = True,
) -> list[Signal]:
    sigs: list[Signal] = [
        xexchange_onedex_arb(token=token, price_xex=price_xex, price_onedex=price_onedex),
        hatom_yield_signal(trade_confidence=trade_confidence),
        soul_signal(trade_confidence),
    ]
    if include_planned:
        if jupiter_expected > 0 and jupiter_quoted > 0:
            sigs.append(
                jupiter_edge_signal(
                    expected_out=jupiter_expected,
                    quoted_out=jupiter_quoted,
                )
            )
        if hl_funding != 0.0:
            sigs.append(funding_signal(coin=hl_coin, funding_rate=hl_funding))
    return sigs


def fuse_all(core: list[Signal], venues: list[Signal]) -> Signal:
    return fuse_signals(core + venues)


def inventory() -> dict[str, Any]:
    return {
        "venues": [v.to_dict() for v in list_venues()],
        "soul_future": future_functions(),
        "xoxno": xoxno_note(),
        "executable_today": ["xexchange", "onedex", "hatom_yield_signal"],
        "signals_only": ["jupiter", "hyperliquid", "soul"],
    }


if __name__ == "__main__":
    import json

    print(json.dumps(inventory(), indent=2))
    core = collect_core_signals(token="WEGLD-bd4d79", price=10.0, rsi_14=30, vwap_24h=10.2, liquidity_usd=80_000)
    ven = collect_venue_signals(trade_confidence=0.5)
    print("fused", fuse_all(core, ven))
