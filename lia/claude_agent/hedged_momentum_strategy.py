"""Signal-only hedged momentum (Polymarket-style mechanism). Unverified social claims."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

STRATEGY_ID = "hedged_momentum"


@dataclass
class MarketTick:
    market_id: str
    yes_probability: float
    timestamp: float


@dataclass
class HedgeSignal:
    action: str
    market_id: str
    confidence: float
    reason: str


class HedgedMomentumStrategy:
    strategy_id = STRATEGY_ID

    def __init__(
        self,
        entry_prob_threshold: float = 0.55,
        hedge_shift_threshold: float = 0.08,
        max_shift_for_late_entry: float = 0.25,
    ):
        if not (0.5 <= entry_prob_threshold <= 1.0):
            raise ValueError("entry_prob_threshold must be in [0.5, 1.0]")
        if hedge_shift_threshold <= 0:
            raise ValueError("hedge_shift_threshold must be > 0")
        self.entry_prob_threshold = entry_prob_threshold
        self.hedge_shift_threshold = hedge_shift_threshold
        self.max_shift_for_late_entry = max_shift_for_late_entry
        self._positions: dict = {}

    def reset(self):
        self._positions = {}

    def process_tick(self, tick: MarketTick, previous_tick: Optional[MarketTick]) -> HedgeSignal:
        pos = self._positions.get(tick.market_id)
        if pos is None:
            return self._maybe_open(tick)
        return self._maybe_hedge_or_hold(tick, pos)

    def _maybe_open(self, tick: MarketTick) -> HedgeSignal:
        p = tick.yes_probability
        if p >= self.entry_prob_threshold:
            self._positions[tick.market_id] = {"side": "YES", "entry_prob": p, "hedged": False}
            return HedgeSignal(
                "OPEN_YES", tick.market_id, min(100.0, (p - 0.5) * 200),
                f"YES probability {p:.2f} >= entry threshold {self.entry_prob_threshold}",
            )
        if p <= (1 - self.entry_prob_threshold):
            self._positions[tick.market_id] = {"side": "NO", "entry_prob": p, "hedged": False}
            return HedgeSignal(
                "OPEN_NO", tick.market_id, min(100.0, (0.5 - p) * 200),
                f"NO probability {1 - p:.2f} >= entry threshold {self.entry_prob_threshold}",
            )
        return HedgeSignal("HOLD", tick.market_id, 0.0, f"probability {p:.2f} too close to 50/50 — no edge yet")

    def _maybe_hedge_or_hold(self, tick: MarketTick, pos: dict) -> HedgeSignal:
        if pos["hedged"]:
            return HedgeSignal("HOLD", tick.market_id, 0.0, "already hedged both sides on this market")
        entry_p = pos["entry_prob"]
        shift = tick.yes_probability - entry_p
        if pos["side"] == "YES" and shift <= -self.hedge_shift_threshold:
            pos["hedged"] = True
            return HedgeSignal(
                "ADD_HEDGE_NO", tick.market_id, min(100.0, abs(shift) * 300),
                f"YES probability dropped {abs(shift):.2f} since entry — hedging with NO",
            )
        if pos["side"] == "NO" and shift >= self.hedge_shift_threshold:
            pos["hedged"] = True
            return HedgeSignal(
                "ADD_HEDGE_YES", tick.market_id, min(100.0, abs(shift) * 300),
                f"YES probability rose {shift:.2f} since NO entry — hedging with YES",
            )
        return HedgeSignal(
            "HOLD", tick.market_id, 0.0,
            f"shift {shift:+.2f} below hedge threshold {self.hedge_shift_threshold}",
        )

    def propose(self, context: dict) -> dict:
        tick = MarketTick(
            market_id=context["market_id"],
            yes_probability=context["yes_probability"],
            timestamp=context.get("timestamp", 0.0),
        )
        signal = self.process_tick(tick, context.get("previous_tick"))
        return {
            "action": signal.action,
            "confidence": signal.confidence,
            "market_id": signal.market_id,
            "reason": signal.reason,
        }
