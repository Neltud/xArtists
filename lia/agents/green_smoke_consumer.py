"""
GreenSmokeConsumer — bias LIA decisions with top GreenSmoke agents
+ Dynamic trailing stops (lia.risk.trailing_stop)
"""
from __future__ import annotations

import json
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Optional

# Allow running from repo root
_ROOT = Path(__file__).resolve().parents[2]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

try:
    from lia.risk.trailing_stop import DynamicTrailingStopManager
except ImportError:
    DynamicTrailingStopManager = None  # type: ignore


@dataclass
class AgentSignal:
    agent_id: str
    reputation: float
    bias: str
    confidence: float
    source: str = "greensmoke"


class GreenSmokeConsumer:
    def __init__(
        self,
        min_reputation: float = 0.6,
        max_external_weight: float = 0.3,
        trailing_state_path: str = "data/lia_trailing_state.json",
    ):
        self.min_reputation = min_reputation
        self.max_external_weight = max_external_weight
        self.trailing: Any = None
        if DynamicTrailingStopManager is not None:
            self.trailing = DynamicTrailingStopManager(state_path=trailing_state_path)
            self.trailing.load()

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
        if gs["n"] == 0 or gs["weight"] <= 0:
            return {"decision": lia_decision, "confidence": lia_confidence, "source": "lia_only"}
        if gs["bias"] == lia_decision:
            conf = min(0.95, lia_confidence + gs["weight"] * 0.2)
            return {"decision": lia_decision, "confidence": conf, "source": "lia+gs_agree"}
        if lia_decision == "WAIT" or gs["bias"] == "WAIT":
            return {
                "decision": lia_decision if lia_confidence >= 0.55 else "WAIT",
                "confidence": lia_confidence * 0.9,
                "source": "mixed_wait",
            }
        if lia_confidence >= 0.75:
            return {"decision": lia_decision, "confidence": lia_confidence * 0.85, "source": "lia_override"}
        return {"decision": "WAIT", "confidence": 0.4, "source": "conflict_wait"}

    def open_trail(
        self,
        *,
        trade_id: str,
        token: str,
        entry: float,
        size_usd: float,
        side: str = "LONG",
        atr: float = 0.0,
        trail_pct: float = 0.08,
    ) -> Optional[dict[str, Any]]:
        if not self.trailing:
            return None
        pos = self.trailing.open(
            id=trade_id,
            token=token,
            entry=entry,
            size_usd=size_usd,
            side=side,
            atr=atr,
            trail_pct=trail_pct,
            trail_mode="hybrid",
        )
        self.trailing.persist()
        return pos.to_dict()

    def tick_price(self, token: str, price: float, atr: Optional[float] = None) -> list[dict[str, Any]]:
        if not self.trailing:
            return []
        results = self.trailing.on_price_by_token(token, price, atr)
        self.trailing.persist()
        return results


if __name__ == "__main__":
    c = GreenSmokeConsumer()
    print(c.regime_bias(c.load_signals()))
    if c.trailing:
        c.open_trail(trade_id="demo-1", token="TRO-94c925", entry=0.000065, size_usd=15, atr=0.000002)
        print(c.tick_price("TRO-94c925", 0.000070))
