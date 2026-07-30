"""
LIA — Dynamic Trailing Stop
===========================
Modes:
  - percent : trail fixed % under HWM
  - atr     : trail = k * ATR (volatility adaptive)
  - hybrid  : max(percent, atr_distance) then tighten as profit grows

Features:
  - High-water mark (long) / low-water mark (short)
  - Break-even after +be_trigger_pct
  - Step tighten: trail shrinks as R-multiples increase
  - Partial take-profit levels
  - Persist / restore positions to JSON for Vellum + dashboard
"""
from __future__ import annotations

import json
import time
from dataclasses import asdict, dataclass, field
from enum import Enum
from typing import Any, Optional


class Side(str, Enum):
    LONG = "LONG"
    SHORT = "SHORT"


class TrailMode(str, Enum):
    PERCENT = "percent"
    ATR = "atr"
    HYBRID = "hybrid"


@dataclass
class PartialTP:
    pct_of_position: float  # e.g. 0.5 = close 50%
    at_r: float  # e.g. 1.0 = at 1R profit
    hit: bool = False


@dataclass
class DynamicPosition:
    id: str
    token: str
    side: Side
    entry: float
    size_usd: float
    size_remaining_pct: float = 1.0
    atr: float = 0.0
    trail_mode: TrailMode = TrailMode.HYBRID
    trail_pct: float = 0.08
    atr_mult: float = 2.0
    be_trigger_pct: float = 0.015  # move SL to BE after +1.5%
    be_done: bool = False
    # step tighten: at N R, use tighter trail
    step_r: list[float] = field(default_factory=lambda: [1.0, 2.0, 3.0])
    step_trail_pct: list[float] = field(default_factory=lambda: [0.06, 0.04, 0.025])
    partials: list[PartialTP] = field(default_factory=list)
    hwm: float = 0.0  # high water (long) / inverted for short via lwm
    lwm: float = 0.0
    stop: float = 0.0
    initial_stop: float = 0.0
    opened_at: float = field(default_factory=time.time)
    updated_at: float = field(default_factory=time.time)
    status: str = "OPEN"  # OPEN | STOPPED | CLOSED

    def __post_init__(self) -> None:
        if isinstance(self.side, str):
            self.side = Side(self.side)
        if isinstance(self.trail_mode, str):
            self.trail_mode = TrailMode(self.trail_mode)
        if self.hwm <= 0:
            self.hwm = self.entry
        if self.lwm <= 0:
            self.lwm = self.entry
        if self.initial_stop <= 0:
            self.initial_stop = self._raw_stop(self.entry)
        if self.stop <= 0:
            self.stop = self.initial_stop
        if not self.partials:
            self.partials = [
                PartialTP(0.5, 1.0),
                PartialTP(0.25, 2.0),
            ]

    def _trail_distance(self, price: float) -> float:
        pct_dist = price * self._effective_trail_pct()
        atr_dist = self.atr * self.atr_mult if self.atr > 0 else 0.0
        if self.trail_mode == TrailMode.PERCENT:
            return pct_dist
        if self.trail_mode == TrailMode.ATR:
            return atr_dist if atr_dist > 0 else pct_dist
        # hybrid: wider of the two early, then percent dominates as we tighten
        return max(pct_dist, atr_dist) if atr_dist > 0 else pct_dist

    def _r_multiple(self, price: float) -> float:
        risk = abs(self.entry - self.initial_stop)
        if risk <= 0:
            return 0.0
        if self.side == Side.LONG:
            return (price - self.entry) / risk
        return (self.entry - price) / risk

    def _effective_trail_pct(self) -> float:
        r = self._r_multiple(self.hwm if self.side == Side.LONG else self.lwm)
        pct = self.trail_pct
        for threshold, tighter in zip(self.step_r, self.step_trail_pct):
            if r >= threshold:
                pct = tighter
        return pct

    def _raw_stop(self, ref_price: float) -> float:
        dist = self._trail_distance(ref_price)
        if self.side == Side.LONG:
            return ref_price - dist
        return ref_price + dist

    def update_atr(self, atr: float) -> None:
        if atr > 0:
            self.atr = atr
            self.updated_at = time.time()

    def on_tick(self, price: float) -> dict[str, Any]:
        """
        Update HWM/LWM, stop, partials.
        Returns action dict: {action, stop, r, size_remaining_pct, partial_hit?}
        action: NONE | TIGHTEN | BREAK_EVEN | PARTIAL | STOP
        """
        if self.status != "OPEN":
            return {"action": "NONE", "status": self.status}

        events: list[str] = []

        if self.side == Side.LONG:
            if price > self.hwm:
                self.hwm = price
                new_stop = self._raw_stop(self.hwm)
                if new_stop > self.stop:
                    self.stop = new_stop
                    events.append("TIGHTEN")
            # break-even
            if not self.be_done and price >= self.entry * (1 + self.be_trigger_pct):
                if self.stop < self.entry:
                    self.stop = self.entry
                    self.be_done = True
                    events.append("BREAK_EVEN")
            hit_stop = price <= self.stop
        else:
            if price < self.lwm:
                self.lwm = price
                new_stop = self._raw_stop(self.lwm)
                if new_stop < self.stop:
                    self.stop = new_stop
                    events.append("TIGHTEN")
            if not self.be_done and price <= self.entry * (1 - self.be_trigger_pct):
                if self.stop > self.entry:
                    self.stop = self.entry
                    self.be_done = True
                    events.append("BREAK_EVEN")
            hit_stop = price >= self.stop

        r = self._r_multiple(price)
        partial_closed = 0.0
        for p in self.partials:
            if not p.hit and r >= p.at_r and self.size_remaining_pct > 0:
                p.hit = True
                partial_closed += p.pct_of_position
                self.size_remaining_pct = max(0.0, self.size_remaining_pct - p.pct_of_position)
                events.append("PARTIAL")

        self.updated_at = time.time()

        if hit_stop:
            self.status = "STOPPED"
            self.size_remaining_pct = 0.0
            return {
                "action": "STOP",
                "stop": self.stop,
                "r": r,
                "size_remaining_pct": 0.0,
                "events": events,
                "price": price,
            }

        action = events[-1] if events else "NONE"
        return {
            "action": action,
            "stop": self.stop,
            "r": r,
            "size_remaining_pct": self.size_remaining_pct,
            "partial_closed": partial_closed,
            "events": events,
            "price": price,
            "trail_pct_eff": self._effective_trail_pct(),
        }

    def to_dict(self) -> dict[str, Any]:
        d = asdict(self)
        d["side"] = self.side.value
        d["trail_mode"] = self.trail_mode.value
        return d

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "DynamicPosition":
        partials = [PartialTP(**p) if isinstance(p, dict) else p for p in d.get("partials", [])]
        data = {**d, "partials": partials}
        return cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})


class DynamicTrailingStopManager:
    def __init__(self, state_path: str = "data/lia_trailing_state.json"):
        self.positions: dict[str, DynamicPosition] = {}
        self.state_path = state_path

    def open(
        self,
        *,
        id: str,
        token: str,
        entry: float,
        size_usd: float,
        side: str = "LONG",
        atr: float = 0.0,
        trail_pct: float = 0.08,
        atr_mult: float = 2.0,
        trail_mode: str = "hybrid",
        be_trigger_pct: float = 0.015,
    ) -> DynamicPosition:
        pos = DynamicPosition(
            id=id,
            token=token,
            side=Side(side),
            entry=entry,
            size_usd=size_usd,
            atr=atr,
            trail_pct=trail_pct,
            atr_mult=atr_mult,
            trail_mode=TrailMode(trail_mode),
            be_trigger_pct=be_trigger_pct,
        )
        self.positions[id] = pos
        return pos

    def on_price(self, id: str, price: float, atr: Optional[float] = None) -> dict[str, Any]:
        pos = self.positions.get(id)
        if not pos:
            return {"action": "NONE", "error": "unknown position"}
        if atr is not None:
            pos.update_atr(atr)
        result = pos.on_tick(price)
        result["id"] = id
        result["token"] = pos.token
        if result.get("action") == "STOP":
            # keep record until persist; mark stopped
            pass
        return result

    def on_price_by_token(self, token: str, price: float, atr: Optional[float] = None) -> list[dict[str, Any]]:
        out = []
        for pid, pos in list(self.positions.items()):
            if pos.token == token and pos.status == "OPEN":
                out.append(self.on_price(pid, price, atr))
        return out

    def snapshot(self) -> list[dict[str, Any]]:
        return [p.to_dict() for p in self.positions.values()]

    def persist(self) -> None:
        payload = {
            "updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "positions": self.snapshot(),
        }
        with open(self.state_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)

    def load(self) -> None:
        try:
            with open(self.state_path, "r", encoding="utf-8") as f:
                raw = json.load(f)
            self.positions = {}
            for d in raw.get("positions", []):
                pos = DynamicPosition.from_dict(d)
                self.positions[pos.id] = pos
        except FileNotFoundError:
            self.positions = {}


def demo() -> None:
    mgr = DynamicTrailingStopManager(state_path="/tmp/lia_trail_demo.json")
    mgr.open(id="t1", token="TRO-94c925", entry=0.000065, size_usd=20, atr=0.000002, trail_pct=0.08)
    prices = [0.000066, 0.000068, 0.000070, 0.000069, 0.000067, 0.000064]
    for px in prices:
        r = mgr.on_price("t1", px)
        print(px, r)
    mgr.persist()
    print("snapshot", mgr.snapshot())


if __name__ == "__main__":
    demo()
