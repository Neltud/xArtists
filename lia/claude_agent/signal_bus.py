"""
SignalBus — normalized signals for Claude advisor + LIA brains (read side).

- Confidence scale: always 0.0–1.0 (68 → 0.68)
- Default cap social_intel=0.15
- Stale signals excluded
- Social BUY/SELL/WAIT mapped to GreenSmoke-style ACCUMULATE/DISTRIBUTE/NEUTRAL

Claude is NOT a second executor: bus feeds proposals only (auto_execute=False).
"""
from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

VALID_CATEGORIES = {"crypto", "macro", "events", "politics", "weather", "social", "other"}
VALID_BIAS = {"RISK_ON", "RISK_OFF", "NEUTRAL", "ACCUMULATE", "DISTRIBUTE", "CONFLICTED"}

DEFAULT_SOURCE_WEIGHT_CAPS: Dict[str, float] = {
    "social_intel": 0.15,
    "green_smoke": 0.30,
}

# SocialIntel bias → GreenSmoke / bus vocabulary
_SOCIAL_BIAS_MAP = {
    "BUY": "ACCUMULATE",
    "SELL": "DISTRIBUTE",
    "WAIT": "NEUTRAL",
    "HOLD": "NEUTRAL",
    "SKIP": "NEUTRAL",
    "ACCUMULATE": "ACCUMULATE",
    "DISTRIBUTE": "DISTRIBUTE",
    "NEUTRAL": "NEUTRAL",
    "RISK_ON": "RISK_ON",
    "RISK_OFF": "RISK_OFF",
}


def map_social_bias(raw: Any) -> str:
    key = str(raw or "NEUTRAL").strip().upper()
    return _SOCIAL_BIAS_MAP.get(key, "NEUTRAL")


def normalize_confidence_0_1(raw_value: Any) -> float:
    try:
        value = float(raw_value)
    except (TypeError, ValueError):
        return 0.0
    if value > 1.0:
        value = value / 100.0
    return max(0.0, min(1.0, value))


class SignalError(Exception):
    pass


@dataclass
class Signal:
    source: str
    category: str
    bias: str
    confidence: float
    timestamp: float
    max_age_seconds: float
    detail: str = ""

    def __post_init__(self) -> None:
        if self.category not in VALID_CATEGORIES:
            raise SignalError(f"invalid category: {self.category!r}")
        if self.bias not in VALID_BIAS:
            raise SignalError(f"invalid bias: {self.bias!r}")
        if not (0.0 <= self.confidence <= 1.0):
            raise SignalError(f"confidence out of range: {self.confidence!r}")
        if self.max_age_seconds <= 0:
            raise SignalError(f"max_age_seconds must be > 0: {self.max_age_seconds!r}")

    def is_stale(self, now: Optional[float] = None) -> bool:
        now = time.time() if now is None else now
        return (now - self.timestamp) > self.max_age_seconds


@dataclass
class CompositeBias:
    category: str
    bias: str
    confidence: float
    agreement: float
    contributing_sources: List[str]
    conflicted: bool

    def to_dict(self) -> Dict[str, Any]:
        return {
            "category": self.category,
            "bias": self.bias,
            "confidence": self.confidence,
            "agreement": self.agreement,
            "contributing_sources": list(self.contributing_sources),
            "conflicted": self.conflicted,
        }


class SignalBus:
    def __init__(self, source_weight_caps: Optional[Dict[str, float]] = None):
        self._signals: Dict[tuple, Signal] = {}
        self.source_weight_caps = (
            dict(DEFAULT_SOURCE_WEIGHT_CAPS)
            if source_weight_caps is None
            else dict(source_weight_caps)
        )

    def _cap_for_source(self, source: str) -> Optional[float]:
        for prefix, cap in self.source_weight_caps.items():
            if source.startswith(prefix):
                return cap
        return None

    def publish(self, signal: Signal) -> None:
        self._signals[(signal.source, signal.category)] = signal

    def get_active_signals(
        self, category: Optional[str] = None, now: Optional[float] = None
    ) -> List[Signal]:
        now = time.time() if now is None else now
        out: List[Signal] = []
        for sig in self._signals.values():
            if category is not None and sig.category != category:
                continue
            if sig.is_stale(now):
                continue
            out.append(sig)
        return out

    def composite_bias(self, category: str, now: Optional[float] = None) -> CompositeBias:
        active = self.get_active_signals(category, now)
        if not active:
            return CompositeBias(category, "NEUTRAL", 0.0, 0.0, [], False)

        total_raw = sum(sig.confidence for sig in active)
        effective: Dict[str, float] = {}
        for sig in active:
            cap = self._cap_for_source(sig.source)
            if cap is not None and total_raw > 0:
                effective[sig.source] = min(sig.confidence, cap * total_raw)
            else:
                effective[sig.source] = sig.confidence

        weights: Dict[str, float] = {}
        for sig in active:
            weights[sig.bias] = weights.get(sig.bias, 0.0) + effective[sig.source]

        total_weight = sum(weights.values())
        ranked = sorted(weights.items(), key=lambda kv: kv[1], reverse=True)
        top_bias, top_weight = ranked[0]
        agreement = top_weight / total_weight if total_weight > 0 else 0.0

        conflicted = False
        if len(ranked) > 1 and ranked[1][1] >= top_weight * 0.85:
            conflicted = True

        return CompositeBias(
            category=category,
            bias="CONFLICTED" if conflicted else top_bias,
            confidence=(top_weight / len(active)) if not conflicted else 0.0,
            agreement=agreement,
            contributing_sources=[s.source for s in active],
            conflicted=conflicted,
        )

    def prune_stale(self, now: Optional[float] = None) -> int:
        now = time.time() if now is None else now
        stale = [k for k, sig in self._signals.items() if sig.is_stale(now)]
        for k in stale:
            del self._signals[k]
        return len(stale)

    def add_social_from_bias(
        self,
        data: Any,
        category: str = "social",
        max_age_seconds: float = 3600.0,
        now: Optional[float] = None,
    ) -> Optional[Signal]:
        """Accept SocialBias.to_dict() — maps BUY/SELL/WAIT → ACCUMULATE/DISTRIBUTE/NEUTRAL."""
        now = time.time() if now is None else now
        if not isinstance(data, dict):
            return None

        bias = map_social_bias(
            data.get("bias") or data.get("label") or data.get("signal") or "NEUTRAL"
        )
        confidence = normalize_confidence_0_1(
            data.get("confidence", data.get("score", data.get("strength", 0)))
        )
        # Honor social weight field as additional dampener (already <= 0.15 from SocialIntel)
        w = data.get("weight")
        if w is not None:
            try:
                confidence = min(confidence, float(w) / 0.15 * confidence) if float(w) < 0.15 else confidence
            except (TypeError, ValueError):
                pass

        ts = data.get("timestamp", data.get("ts", data.get("updated", now)))
        try:
            timestamp = float(ts)
        except (TypeError, ValueError):
            timestamp = now

        detail = str(data.get("detail") or data.get("reason") or data.get("summary") or "")
        if data.get("rumor_flag"):
            detail = (detail + " | rumor_flag").strip(" |")
            if bias == "ACCUMULATE":
                bias = "NEUTRAL"

        try:
            signal = Signal(
                source="social_intel",
                category=category,
                bias=bias,
                confidence=confidence,
                timestamp=timestamp,
                max_age_seconds=max_age_seconds,
                detail=detail,
            )
        except SignalError:
            return None

        self.publish(signal)
        return signal

    def composite(self, now: Optional[float] = None) -> Dict[str, CompositeBias]:
        now = time.time() if now is None else now
        cats = {sig.category for sig in self.get_active_signals(now=now)}
        return {cat: self.composite_bias(cat, now=now) for cat in sorted(cats)}


if __name__ == "__main__":
    bus = SignalBus()
    bus.add_social_from_bias({"bias": "BUY", "confidence": 0.8, "weight": 0.12})
    print({k: v.to_dict() for k, v in bus.composite().items()})
