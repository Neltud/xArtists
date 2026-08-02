"""
LIA Statistical Arbitrage — Pairs / Z-Score Mean-Reversion
=========================================================
Edge statistique pour le circuit +1 % net.

Principe:
  - Identifier des paires liquides co-mouvementées (EGLD/USDC, WBTC/USDC, etc.)
  - Suivre le spread (ou log-ratio) et son z-score
  - Entrer quand |z| >= entry_z, viser le retour vers mean (z ≈ 0)
  - Filtrer par half-life (trop long = edge trop lent pour le compounding court)
  - Toujours respecter les guards + required_gross_pct du CompoundCircuit

Math rapide:
  spread_t = log(P_a) - hedge_ratio * log(P_b)
  z = (spread - mean) / std
  half_life ≈ -log(2) / log(phi)  où phi = AR(1) du spread

Aucune stratégie n'est imbattable: on combine z-score fort +
liquidité + half-life courte + fees validés.
"""
from __future__ import annotations

import json
import math
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Optional

from lia.circuit.strategies import Signal


@dataclass
class PairConfig:
    token_a: str
    token_b: str
    hedge_ratio: float = 1.0
    entry_z: float = 2.0
    exit_z: float = 0.35
    max_half_life_h: float = 36.0
    min_liquidity_usd: float = 40_000.0
    lookback: int = 72  # periods used for mean/std (e.g. hourly)


@dataclass
class PairState:
    token_a: str
    token_b: str
    hedge_ratio: float = 1.0
    spread_mean: float = 0.0
    spread_std: float = 1.0
    last_spread: float = 0.0
    last_z: float = 0.0
    half_life_h: float = 24.0
    liquidity_a: float = 0.0
    liquidity_b: float = 0.0
    price_a: float = 0.0
    price_b: float = 0.0
    cointegration_score: float = 0.0  # 0..1 proxy
    updated_at: str = ""
    sample_count: int = 0

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "PairState":
        return cls(**{k: v for k, v in d.items() if k in cls.__dataclass_fields__})


@dataclass
class StatArbConfig:
    entry_z: float = 2.0
    soft_entry_z: float = 1.7
    exit_z: float = 0.35
    max_half_life_h: float = 36.0
    min_liquidity_usd: float = 40_000.0
    min_cointegration: float = 0.55
    min_std: float = 1e-6
    pairs_path: str = "data/lia_statarb_pairs.json"


def compute_spread(price_a: float, price_b: float, hedge_ratio: float = 1.0) -> float:
    if price_a <= 0 or price_b <= 0:
        return 0.0
    return math.log(price_a) - hedge_ratio * math.log(price_b)


def compute_z(spread: float, mean: float, std: float) -> float:
    if std < 1e-12:
        return 0.0
    return (spread - mean) / std


def estimate_half_life(phi: float) -> float:
    """
    Approximate half-life in periods from AR(1) coefficient phi.
    phi in (0, 1) → mean-reverting. Returns hours if input is hourly.
    """
    if phi <= 0 or phi >= 1:
        return 999.0
    return -math.log(2) / math.log(phi)


def statistical_arbitrage(
    *,
    token_a: str,
    token_b: str,
    price_a: float,
    price_b: float,
    spread_mean: float,
    spread_std: float,
    z_score: Optional[float] = None,
    half_life_h: float = 24.0,
    liquidity_a: float = 100_000.0,
    liquidity_b: float = 100_000.0,
    cointegration_score: float = 0.7,
    hedge_ratio: float = 1.0,
    cfg: Optional[StatArbConfig] = None,
) -> Signal:
    """
    Core StatArb signal generator.
    BUY token_a (long the cheap leg) when z is sufficiently negative.
    SELL token_a when z is sufficiently positive.
    """
    cfg = cfg or StatArbConfig()

    if price_a <= 0 or price_b <= 0:
        return Signal("WAIT", token_a, 0.2, "STATARB", "bad prices")

    if liquidity_a < cfg.min_liquidity_usd or liquidity_b < cfg.min_liquidity_usd:
        return Signal("WAIT", token_a, 0.3, "STATARB", "low liquidity")

    if half_life_h > cfg.max_half_life_h:
        return Signal(
            "WAIT", token_a, 0.35, "STATARB",
            f"half-life {half_life_h:.1f}h > {cfg.max_half_life_h}h",
        )

    if cointegration_score < cfg.min_cointegration:
        return Signal(
            "WAIT", token_a, 0.35, "STATARB",
            f"coint={cointegration_score:.2f} < {cfg.min_cointegration}",
        )

    if spread_std < cfg.min_std:
        return Signal("WAIT", token_a, 0.25, "STATARB", "std too small")

    if z_score is None:
        spread = compute_spread(price_a, price_b, hedge_ratio)
        z_score = compute_z(spread, spread_mean, spread_std)

    meta = {
        "pair": token_b,
        "z": round(z_score, 4),
        "half_life_h": round(half_life_h, 2),
        "coint": round(cointegration_score, 3),
        "hedge_ratio": hedge_ratio,
        "target_z": 0.0,
    }

    # Strong mean-reversion entry
    if z_score <= -cfg.entry_z:
        conf = min(0.92, 0.58 + abs(z_score) * 0.09 + (0.15 if half_life_h < 12 else 0))
        return Signal(
            "BUY", token_a, conf, "STATARB",
            f"z={z_score:.2f} undervalued vs {token_b}",
            entry_hint=price_a,
            meta=meta,
        )

    if z_score >= cfg.entry_z:
        conf = min(0.88, 0.55 + abs(z_score) * 0.08)
        return Signal(
            "SELL", token_a, conf, "STATARB",
            f"z={z_score:.2f} overvalued vs {token_b}",
            entry_hint=price_a,
            meta=meta,
        )

    # Soft entry zone (lower confidence)
    if z_score <= -cfg.soft_entry_z:
        conf = min(0.72, 0.5 + abs(z_score) * 0.07)
        return Signal(
            "BUY", token_a, conf, "STATARB",
            f"soft z={z_score:.2f}",
            entry_hint=price_a,
            meta=meta,
        )

    if z_score >= cfg.soft_entry_z:
        conf = min(0.68, 0.48 + abs(z_score) * 0.06)
        return Signal(
            "SELL", token_a, conf, "STATARB",
            f"soft z={z_score:.2f}",
            entry_hint=price_a,
            meta=meta,
        )

    return Signal(
        "WAIT", token_a, 0.4, "STATARB",
        f"z={z_score:.2f} neutral",
        meta=meta,
    )


class PairBook:
    """Persist and update statistical pairs state."""

    def __init__(self, path: str = "data/lia_statarb_pairs.json"):
        self.path = Path(path)
        self.pairs: dict[str, PairState] = {}
        self.load()

    def _key(self, a: str, b: str) -> str:
        return f"{a}|{b}"

    def load(self) -> None:
        try:
            raw = json.loads(self.path.read_text(encoding="utf-8"))
            self.pairs = {
                k: PairState.from_dict(v) for k, v in raw.get("pairs", {}).items()
            }
        except (FileNotFoundError, json.JSONDecodeError):
            self.pairs = {}

    def save(self) -> None:
        payload = {
            "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "pairs": {k: p.to_dict() for k, p in self.pairs.items()},
        }
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    def update(
        self,
        *,
        token_a: str,
        token_b: str,
        price_a: float,
        price_b: float,
        liquidity_a: float = 0.0,
        liquidity_b: float = 0.0,
        hedge_ratio: float = 1.0,
        half_life_h: Optional[float] = None,
        cointegration_score: Optional[float] = None,
        ewma_alpha: float = 0.08,
    ) -> PairState:
        """Online update of mean/std via EWMA and recompute z."""
        key = self._key(token_a, token_b)
        spread = compute_spread(price_a, price_b, hedge_ratio)

        if key not in self.pairs:
            st = PairState(
                token_a=token_a,
                token_b=token_b,
                hedge_ratio=hedge_ratio,
                spread_mean=spread,
                spread_std=max(abs(spread) * 0.02, 0.001),
                last_spread=spread,
                last_z=0.0,
                half_life_h=half_life_h or 24.0,
                liquidity_a=liquidity_a,
                liquidity_b=liquidity_b,
                price_a=price_a,
                price_b=price_b,
                cointegration_score=cointegration_score or 0.6,
                sample_count=1,
            )
        else:
            st = self.pairs[key]
            # EWMA mean & variance
            prev_mean = st.spread_mean
            st.spread_mean = (1 - ewma_alpha) * prev_mean + ewma_alpha * spread
            dev = spread - st.spread_mean
            st.spread_std = math.sqrt(
                (1 - ewma_alpha) * (st.spread_std ** 2) + ewma_alpha * (dev ** 2)
            )
            st.spread_std = max(st.spread_std, 1e-6)
            st.last_spread = spread
            st.sample_count += 1
            st.hedge_ratio = hedge_ratio
            st.price_a = price_a
            st.price_b = price_b
            st.liquidity_a = liquidity_a or st.liquidity_a
            st.liquidity_b = liquidity_b or st.liquidity_b
            if half_life_h is not None:
                st.half_life_h = half_life_h
            if cointegration_score is not None:
                st.cointegration_score = cointegration_score

        st.last_z = compute_z(st.last_spread, st.spread_mean, st.spread_std)
        st.updated_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        self.pairs[key] = st
        self.save()
        return st

    def signal_for(
        self,
        token_a: str,
        token_b: str,
        cfg: Optional[StatArbConfig] = None,
    ) -> Signal:
        key = self._key(token_a, token_b)
        if key not in self.pairs:
            return Signal("WAIT", token_a, 0.2, "STATARB", "pair not tracked")
        st = self.pairs[key]
        return statistical_arbitrage(
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
            cfg=cfg,
        )

    def all_signals(self, cfg: Optional[StatArbConfig] = None) -> list[Signal]:
        return [self.signal_for(p.token_a, p.token_b, cfg) for p in self.pairs.values()]
