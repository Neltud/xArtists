"""
Stratégies quasi-robustes pour le circuit +1% net (calibrage compétent)
======================================================================
Priorité: STATARB > ARB > MR > MOM > YIELD
Seuils de fusion abaissés pour les edges haute priorité.
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
    min_liq: float = 60_000,
) -> Signal:
    if liquidity_usd < min_liq:
        return Signal("WAIT", token, 0.3, "MR", "low liquidity")
    if vwap_24h <= 0:
        return Signal("WAIT", token, 0.2, "MR", "no vwap")
    deviation = (price - vwap_24h) / vwap_24h
    # Un peu plus sélectif: -1.4% / RSI 33
    if deviation <= -0.014 and rsi_14 <= 33:
        conf = min(0.9, 0.56 + abs(deviation) * 11 + (33 - rsi_14) / 100)
        return Signal("BUY", token, conf, "MR", f"dev={deviation:.3%} rsi={rsi_14}", price)
    if deviation >= 0.014 and rsi_14 >= 67:
        return Signal("SELL", token, 0.62, "MR", f"overbought dev={deviation:.3%}", price)
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
        return Signal("WAIT", token, 0.85, "MOM", "RISK_OFF")
    if (
        price_change_1h > 0.005
        and price_change_24h > 0.012
        and volume_spike >= 1.6
        and gs_bias in ("BULLISH", "BUY", "ACCUMULATE")
    ):
        conf = min(0.88, 0.52 + price_change_1h * 9 + max(0.0, volume_spike - 1.0) * 0.04)
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
    # Exiger un edge plus net vs frais
    if spread > fee_roundtrip * 2.8:
        return Signal(
            "BUY",
            token,
            min(0.88, 0.52 + spread * 5.5),
            "ARB",
            f"spread={spread:.3%} > fees*2.8",
            entry_hint=min(price_a, price_b),
        )
    return Signal("WAIT", token, 0.35, "ARB", f"spread={spread:.3%} too thin")


def yield_first(
    *,
    trade_confidence: float,
    min_trade_conf: float = 0.60,
    stable_apy: float = 0.08,
) -> Signal:
    if trade_confidence < min_trade_conf:
        return Signal(
            "YIELD",
            "USDC-c76f1f",
            0.72,
            "YIELD",
            f"no trade edge; target APY~{stable_apy:.0%}",
        )
    return Signal("WAIT", "", 0.5, "YIELD", "trade preferred")


_STRATEGY_PRIORITY = {
    "STATARB": 5,
    "ARB": 4,
    "MR": 3,
    "MOM": 2,
    "YIELD": 1,
    "FUSE": 0,
}


def fuse_signals(signals: list[Signal]) -> Signal:
    if not signals:
        return Signal("WAIT", "", 0.3, "FUSE", "empty")

    sells = [s for s in signals if s.action == "SELL"]
    buys = [s for s in signals if s.action == "BUY"]
    yields = [s for s in signals if s.action == "YIELD"]

    def rank(s: Signal) -> tuple[float, int]:
        # Légère boost de rank pour STATARB afin de le préférer à conf égale
        prio = _STRATEGY_PRIORITY.get(s.strategy, 0)
        return (s.confidence + prio * 0.01, prio)

    # Protection capital: SELL dès 0.55
    if sells and max(s.confidence for s in sells) >= 0.55:
        return max(sells, key=rank)

    if buys:
        best = max(buys, key=rank)
        if best.strategy == "STATARB":
            min_conf = 0.55
        elif best.strategy == "ARB":
            min_conf = 0.57
        else:
            min_conf = 0.62
        if best.confidence >= min_conf:
            return best

    if yields:
        return max(yields, key=rank)

    return Signal("WAIT", "", 0.4, "FUSE", "no consensus")
