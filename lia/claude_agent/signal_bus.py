"""
SignalBus — composite signals with per-source weight caps.

Canonical caps (repo truth):
  social_intel: 0.15  (lia/signals/social_intel.py weight_cap)
  green_smoke:  0.30
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from lia.claude_agent.pyramids_adapter import signal_source_caps


@dataclass
class BusSignal:
    source: str
    bias: str  # BUY | SELL | WAIT
    confidence: float
    weight: float = 1.0
    rumor_flag: bool = False
    meta: Dict[str, Any] = field(default_factory=dict)


class SignalBus:
    def __init__(self, source_weight_caps: Optional[Dict[str, float]] = None):
        self.source_weight_caps = source_weight_caps or signal_source_caps()
        self._signals: List[BusSignal] = []

    def add(self, sig: BusSignal) -> None:
        cap = self.source_weight_caps.get(sig.source)
        w = float(sig.weight)
        if cap is not None:
            w = min(w, cap)
        self._signals.append(
            BusSignal(sig.source, sig.bias, sig.confidence, w, sig.rumor_flag, sig.meta)
        )

    def add_social_from_bias(self, social: Dict[str, Any]) -> None:
        """Plug SocialBias.to_dict() directly."""
        self.add(
            BusSignal(
                source="social_intel",
                bias=str(social.get("bias") or "WAIT"),
                confidence=float(social.get("confidence") or 0),
                weight=float(social.get("weight") or 0),
                rumor_flag=bool(social.get("rumor_flag")),
            )
        )

    def composite(self) -> Dict[str, Any]:
        if not self._signals:
            return {"bias": "WAIT", "confidence": 0.0, "weight": 0.0, "n": 0}
        # rumor blocks BUY upgrade
        if any(s.rumor_flag and s.bias == "BUY" for s in self._signals):
            for s in self._signals:
                if s.bias == "BUY":
                    s.bias = "WAIT"
        score = 0.0
        wsum = 0.0
        for s in self._signals:
            delta = 1.0 if s.bias == "BUY" else (-1.0 if s.bias == "SELL" else 0.0)
            score += s.weight * s.confidence * delta
            wsum += s.weight
        norm = score / wsum if wsum else 0.0
        bias = "BUY" if norm > 0.2 else ("SELL" if norm < -0.2 else "WAIT")
        return {
            "bias": bias,
            "confidence": round(min(0.9, abs(norm)), 4),
            "weight": round(min(1.0, wsum), 4),
            "n": len(self._signals),
            "caps": self.source_weight_caps,
            "sources": [
                {"source": s.source, "bias": s.bias, "w": s.weight, "rumor": s.rumor_flag}
                for s in self._signals
            ],
        }


if __name__ == "__main__":
    bus = SignalBus()
    bus.add(BusSignal("social_intel", "BUY", 0.8, weight=0.5))  # capped to 0.15
    bus.add(BusSignal("green_smoke", "BUY", 0.7, weight=0.3))
    print(bus.composite())
