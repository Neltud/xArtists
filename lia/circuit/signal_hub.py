"""
LIA Signal Hub — fusion centralisée des edges (STATARB prioritaire)
=================================================================
Produit un signal unique {action, confidence, strategy, reason, meta, token}
à partir de:
  - pairs_market → PairBook + statistical_arbitrage
  - signaux optionnels (MR, MOM, ARB, externe)
  - fuse_signals (priorité STATARB > ARB > MR > MOM)
"""
from __future__ import annotations

from typing import Any, Optional

from lia.circuit.statistical_arbitrage import (
    PairBook,
    StatArbConfig,
    statistical_arbitrage,
)
from lia.circuit.strategies import (
    Signal,
    fuse_signals,
    mean_reversion_liquid,
    micro_arb,
    momentum_regime,
    yield_first,
)


def _sig_to_dict(s: Signal) -> dict[str, Any]:
    return {
        "action": s.action,
        "confidence": s.confidence,
        "strategy": s.strategy,
        "reason": s.reason,
        "token": s.token,
        "entry_hint": s.entry_hint,
        "meta": s.meta or {},
    }


def collect_statarb_signals(
    pairs_market: list[dict[str, Any]],
    *,
    pairs_path: str = "data/lia_statarb_pairs.json",
    cfg: Optional[StatArbConfig] = None,
    update_book: bool = True,
) -> list[Signal]:
    """Update PairBook from market snapshots and emit StatArb signals."""
    cfg = cfg or StatArbConfig()
    book = PairBook(path=pairs_path)
    signals: list[Signal] = []

    for snap in pairs_market or []:
        token_a = str(snap.get("token_a") or "")
        token_b = str(snap.get("token_b") or "")
        price_a = float(snap.get("price_a") or 0)
        price_b = float(snap.get("price_b") or 0)
        if not token_a or not token_b or price_a <= 0 or price_b <= 0:
            continue

        if update_book:
            st = book.update(
                token_a=token_a,
                token_b=token_b,
                price_a=price_a,
                price_b=price_b,
                liquidity_a=float(snap.get("liquidity_a") or 0),
                liquidity_b=float(snap.get("liquidity_b") or 0),
                hedge_ratio=float(snap.get("hedge_ratio") or 1.0),
                half_life_h=(
                    float(snap["half_life_h"]) if snap.get("half_life_h") is not None else None
                ),
                cointegration_score=(
                    float(snap["cointegration_score"])
                    if snap.get("cointegration_score") is not None
                    else None
                ),
            )
        else:
            key = f"{token_a}|{token_b}"
            st = book.pairs.get(key)
            if not st:
                continue

        signals.append(
            statistical_arbitrage(
                token_a=st.token_a,
                token_b=st.token_b,
                price_a=st.price_a,
                price_b=st.price_b,
                spread_mean=st.spread_mean,
                spread_std=st.spread_std,
                z_score=st.last_z,
                half_life_h=st.half_life_h,
                liquidity_a=st.liquidity_a,
                liquidity_b=st.liquidity_b,
                cointegration_score=st.cointegration_score,
                hedge_ratio=st.hedge_ratio,
                sample_count=st.sample_count,
                cfg=cfg,
            )
        )

    # Also emit for tracked pairs not in this batch
    seen = {s.token for s in signals}
    for st in book.pairs.values():
        if st.token_a in seen:
            continue
        signals.append(book.signal_for(st.token_a, st.token_b, cfg))

    return signals


def collect_aux_signals(
    *,
    market: Optional[dict[str, Any]] = None,
    gs: Optional[dict[str, Any]] = None,
) -> list[Signal]:
    """Optional MR / MOM / micro-arb from a single-token market snapshot."""
    market = market or {}
    gs = gs or {}
    out: list[Signal] = []
    token = str(market.get("token") or "")
    price = float(market.get("price") or 0)

    if token and price > 0:
        vwap = float(market.get("vwap_24h") or 0)
        rsi = float(market.get("rsi_14") or 50)
        liq = float(market.get("liquidity_usd") or 0)
        if vwap > 0 and liq > 0:
            out.append(
                mean_reversion_liquid(
                    token=token, price=price, vwap_24h=vwap, rsi_14=rsi, liquidity_usd=liq
                )
            )

        out.append(
            momentum_regime(
                token=token,
                price_change_1h=float(market.get("price_change_1h") or 0),
                price_change_24h=float(market.get("price_change_24h") or 0),
                volume_spike=float(market.get("volume_spike") or 1.0),
                gs_regime=str(gs.get("regime") or "NEUTRAL"),
                gs_bias=str(gs.get("bias") or "NEUTRAL"),
            )
        )

        px_b = float(market.get("price_alt_dex") or 0)
        if px_b > 0:
            out.append(micro_arb(token=token, price_a=price, price_b=px_b))

    return out


def build_fused_signal(
    *,
    pairs_market: Optional[list[dict[str, Any]]] = None,
    market: Optional[dict[str, Any]] = None,
    gs: Optional[dict[str, Any]] = None,
    external_signal: Optional[dict[str, Any]] = None,
    pairs_path: str = "data/lia_statarb_pairs.json",
    include_aux: bool = True,
) -> dict[str, Any]:
    """
    Point d'entrée unique pour le cycle LIA.

    Returns dict compatible guarded_cycle / autonomous_loop:
      action, confidence, strategy, reason, token, meta, entry_hint, components
    """
    signals: list[Signal] = []

    if pairs_market:
        signals.extend(collect_statarb_signals(pairs_market, pairs_path=pairs_path))

    if include_aux:
        signals.extend(collect_aux_signals(market=market, gs=gs))

    if external_signal:
        ext = Signal(
            action=str(external_signal.get("action") or "WAIT"),
            token=str(external_signal.get("token") or (market or {}).get("token") or ""),
            confidence=float(external_signal.get("confidence") or 0.5),
            strategy=str(external_signal.get("strategy") or "EXT"),
            reason=str(external_signal.get("reason") or "external"),
            entry_hint=float(external_signal.get("entry_hint") or 0),
            meta=external_signal.get("meta") or {},
        )
        signals.append(ext)

    if not signals:
        y = yield_first(trade_confidence=0.0)
        return {**_sig_to_dict(y), "components": []}

    fused = fuse_signals(signals)

    # If still weak, consider yield
    if fused.action == "WAIT":
        best_conf = max((s.confidence for s in signals), default=0.0)
        y = yield_first(trade_confidence=best_conf)
        if y.action == "YIELD":
            fused = y

    result = _sig_to_dict(fused)
    result["components"] = [_sig_to_dict(s) for s in signals]
    return result
