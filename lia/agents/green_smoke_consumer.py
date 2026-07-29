"""
GreenSmokeConsumer — bias LIA decisions with top GreenSmoke agents
+ TrailingStopManager for open positions
"""
from __future__ import annotations

import json
import time
from dataclasses import dataclass, field
from typing import Any, Optional


@dataclass
class AgentSignal:
    agent_id: str
    reputation: float  # 0..1
    bias: str  # BUY | SELL | WAIT
    confidence: float
    source: str = "greensmoke"


@dataclass
class Position:
    token: str
    entry_price: float
    size_usd: float
    high_water: float
    trail_pct: float = 0.08  # 8% trailing
    stop_price: float = 0.0

    def __post_init__(self) -> None:
        if self.stop_price <= 0:
            self.stop_price = self.entry_price * (1 - self.trail_pct)
        self.high_water = max(self.high_water, self.entry_price)

    def update(self, price: float) -> Optional[str]:
        """Returns 'STOP' if trailing stop hit."""
        if price > self.high_water:
            self.high_water = price
            self.stop_price = self.high_water * (1 - self.trail_pct)
        if price <= self.stop_price:
            return "STOP"
        return None


class TrailingStopManager:
    def __init__(self) -> None:
        self.positions: dict[str, Position] = {}

    def open(self, token: str, entry: float, size_usd: float, trail_pct: float = 0.08) -> None:
        self.positions[token] = Position(
            token=token, entry_price=entry, size_usd=size_usd, high_water=entry, trail_pct=trail_pct
        )

    def on_price(self, token: str, price: float) -> Optional[str]:
        pos = self.positions.get(token)
        if not pos:
            return None
        action = pos.update(price)
        if action == "STOP":
            del self.positions[token]
        return action

    def snapshot(self) -> list[dict[str, Any]]:
        return [
            {
                "token": p.token,
                "entry": p.entry_price,
                "hwm": p.high_water,
                "stop": p.stop_price,
                "size_usd": p.size_usd,
            }
            for p in self.positions.values()
        ]


class GreenSmokeConsumer:
    """
    Fuse top-N GreenSmoke agent signals into LIA regime bias.
    Without live API: load from data/greensmoke_top.json if present.
    """

    def __init__(self, min_reputation: float = 0.6, max_external_weight: float = 0.3):
        self.min_reputation = min_reputation
        self.max_external_weight = max_external_weight
        self.trailing = TrailingStopManager()

    def load_signals(self, path: str = "data/greensmoke_top.json") -> list[AgentSignal]:
        try:
            with open(path, "r", encoding="utf-8") as f:
                raw = json.load(f)
            out: list[AgentSignal] = []
            for a in raw.get("agents", [])[:10]:
                rep = float(a.get("reputation", 0))
                if rep < self.min_reputation:
                    continue
                out.append(
                    AgentSignal(
                        agent_id=str(a.get("id", "unknown")),
                        reputation=rep,
                        bias=str(a.get("bias", "WAIT")).upper(),
                        confidence=float(a.get("confidence", 0.5)),
                    )
                )
            return out
        except FileNotFoundError:
            return []

    def regime_bias(self, signals: list[AgentSignal]) -> dict[str, Any]:
        if not signals:
            return {"bias": "WAIT", "score": 0.0, "weight": 0.0, "n": 0}
        score = 0.0
        wsum = 0.0
        for s in signals:
            w = s.reputation * s.confidence
            delta = 1.0 if s.bias == "BUY" else (-1.0 if s.bias == "SELL" else 0.0)
            score += w * delta
            wsum += w
        norm = score / wsum if wsum else 0.0
        bias = "BUY" if norm > 0.25 else ("SELL" if norm < -0.25 else "WAIT")
        weight = min(self.max_external_weight, abs(norm) * self.max_external_weight)
        return {"bias": bias, "score": norm, "weight": weight, "n": len(signals)}

    def blend_with_lia(self, lia_decision: str, lia_confidence: float, gs: dict[str, Any]) -> dict[str, Any]:
        """Blend internal LIA decision with GreenSmoke bias (capped weight)."""
        if gs["n"] == 0 or gs["weight"] <= 0:
            return {"decision": lia_decision, "confidence": lia_confidence, "source": "lia_only"}
        # Simple vote: if GS agrees, boost confidence; if conflicts, reduce size / WAIT
        if gs["bias"] == lia_decision:
            conf = min(0.95, lia_confidence + gs["weight"] * 0.2)
            return {"decision": lia_decision, "confidence": conf, "source": "lia+gs_agree"}
        if lia_decision == "WAIT" or gs["bias"] == "WAIT":
            return {"decision": lia_decision if lia_confidence >= 0.55 else "WAIT", "confidence": lia_confidence * 0.9, "source": "mixed_wait"}
        # Conflict: prefer WAIT unless LIA confidence very high
        if lia_confidence >= 0.75:
            return {"decision": lia_decision, "confidence": lia_confidence * 0.85, "source": "lia_override"}
        return {"decision": "WAIT", "confidence": 0.4, "source": "conflict_wait"}


if __name__ == "__main__":
    c = GreenSmokeConsumer()
    print(c.regime_bias(c.load_signals()))
