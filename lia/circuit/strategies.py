"""
Stratégies quasi-robustes pour le circuit +1% net
=================================================
Piliers:
  1. Mean-reversion liquide (EGLD/USDC, WBTC/USDC)
  2. Momentum multi-TF + GreenSmoke RISK_ON
  3. Micro-arb DEX si spread > fees*2.5
  4. Yield-first si score < seuil

Fuse priority: SELL high conf → BUY (ARB preferred on equal conf) → YIELD → WAIT
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional


@dataclass
class Signal:
    action: str  # BUY | SELL | WAIT | YIELD
    token: str
    confidence: float
    strategy: str
    reason: str
    entry_hint: float = 0.0
    meta: Optional[dict[str, Any]] = None


def mean_reversion_liquid(
    *,
    token: str,
    price: float,
    vwap_24h: float,
    rsi_14: float,
    liquidity_usd: float,
    min_liq: float = 50_000,
) -> Signal:
    if liquidity_usd < min_liq:
        return Signal("WAIT", token, 0.3, "MR", "low liquidity")
    if vwap_24h <= 0:
        return Signal("WAIT", token, 0.2, "MR", "no vwap")
    deviation = (price - vwap_24h) / vwap_24h
    if deviation <= -0.012 and rsi_14 <= 35:
        conf = min(0.9, 0.55 + abs(deviation) * 10 + (35 - rsi_14) / 100)
        return Signal("BUY", token, conf, "MR", f"dev={deviation:.3%} rsi={rsi_14}", price)
    if deviation >= 0.012 and rsi_14 >= 65:
        return Signal("SELL", token, 0.6, "MR", f"overbought dev={deviation:.3%}", price)
    return Signal("WAIT", token, 0.4, "MR", "no dislocation")


def momentum_regime(
    *,
    token: str,
    price_change_1h: float,
    price_change_24h: float,
    volume_spike: float,
    gs_regime: str,
    gs_bias: str,
) -> Signal:
    if gs_regime == "RISK_OFF":
        return Signal("WAIT", token, 0.8, "MOM", "RISK_OFF")
    if (
        price_change_1h > 0.004
        and price_change_24h > 0.01
        and volume_spike >= 1.5
        and gs_bias in ("BULLISH", "BUY", "ACCUMULATE")
    ):
        conf = min(0.88, 0.5 + price_change_1h * 10 + max(0.0, volume_spike - 1.0) * 0.05)
        return Signal(
            "BUY",
            token,
            conf,
            "MOM",
            "momentum+regime",
            meta={"vol_spike": volume_spike, "chg_1h": price_change_1h},
        )
    return Signal("WAIT", token, 0.45, "MOM", "no momentum")


def micro_arb(
    *,
    token: str,
    price_a: float,
    price_b: float,
    fee_roundtrip: float = 0.006,
) -> Signal:
    if price_a <= 0 or price_b <= 0:
        return Signal("WAIT", token, 0.2, "ARB", "bad prices")
    mid = (price_a + price_b) / 2
    spread = abs(price_a - price_b) / mid
    if spread > fee_roundtrip * 2.5:
        return Signal(
            "BUY",
            token,
            min(0.85, 0.5 + spread * 5),
            "ARB",
            f"spread={spread:.3%} > fees*2.5",
            entry_hint=min(price_a, price_b),
            meta={"spread": spread, "fee_rt": fee_roundtrip},
        )
    return Signal("WAIT", token, 0.35, "ARB", f"spread={spread:.3%} too thin")


def yield_first(
    *,
    trade_confidence: float,
    min_trade_conf: float = 0.65,
    stable_apy: float = 0.08,
) -> Signal:
    if trade_confidence < min_trade_conf:
        return Signal(
            "YIELD",
            "USDC-c76f1f",
            0.7,
            "YIELD",
            f"no trade edge; target APY~{stable_apy:.0%}",
        )
    return Signal("WAIT", "", 0.5, "YIELD", "trade preferred")


def fuse_signals(signals: list[Signal]) -> Signal:
    """Priority: protective SELL → best BUY (ARB tie-break) → YIELD → WAIT."""
    buys = [s for s in signals if s.action == "BUY"]
    sells = [s for s in signals if s.action == "SELL"]
    yields = [s for s in signals if s.action == "YIELD"]
    if sells and max(s.confidence for s in sells) >= 0.6:
        return max(sells, key=lambda s: s.confidence)
    if buys:
        # Prefer ARB on near-equal confidence (structural edge vs directional)
        def buy_key(s: Signal) -> tuple:
            arb_boost = 0.03 if s.strategy == "ARB" else 0.0
            return (s.confidence + arb_boost, 1 if s.strategy == "ARB" else 0)

        best = max(buys, key=buy_key)
        if best.confidence >= 0.62:
            return best
    if yields:
        return max(yields, key=lambda s: s.confidence)
    return Signal("WAIT", "", 0.4, "FUSE", "no consensus")
