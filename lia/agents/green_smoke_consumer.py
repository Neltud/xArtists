"""
GreenSmokeConsumer — bias LIA decisions with top GreenSmoke agents (>=80% accuracy)
+ Dynamic trailing stops (lia.risk.trailing_stop)
Never sole execute signal. Cap max_external_weight 0.30.
"""
from __future__ import annotations

import json
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Optional

_ROOT = Path(__file__).resolve().parents[2]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

try:
    from lia.risk.trailing_stop import DynamicTrailingStopManager
except ImportError:
    DynamicTrailingStopManager = None  # type: ignore

MIN_ACCURACY = 0.80


def _norm(v: Any) -> float:
    try:
        x = float(v or 0)
    except (TypeError, ValueError):
        return 0.0
    if x > 1.0:
        x = x / 100.0
    return max(0.0, min(1.0, x))


@dataclass
class AgentSignal:
    agent_id: str
    reputation: float
    bias: str
    confidence: float
    accuracy: float = 0.0
    source: str = "greensmoke"


class GreenSmokeConsumer:
    def __init__(
        self,
        min_reputation: float = MIN_ACCURACY,
        max_external_weight: float = 0.3,
        trailing_state_path: str = "data/lia_trailing_state.json",
    ):
        self.min_reputation = min_reputation
        self.max_external_weight = max_external_weight
        self.trailing: Any = None
        if DynamicTrailingStopManager is not None:
            self.trailing = DynamicTrailingStopManager(state_path=trailing_state_path)
            self.trailing.load()

    def load_signals(
        self,
        path: str = "data/greensmoke_top.json",
        forecasts_path: str = "data/greensmoke_forecasts.json",
    ) -> list[AgentSignal]:
        rows: list[dict[str, Any]] = []
        for p in (path, forecasts_path):
            fp = Path(p)
            if not fp.is_file():
                fp = _ROOT / p
            if not fp.is_file():
                continue
            try:
                raw = json.loads(fp.read_text(encoding="utf-8"))
            except (json.JSONDecodeError, OSError):
                continue
            agents = raw.get("agents") or []
            if isinstance(agents, dict):
                for aid, a in agents.items():
                    if isinstance(a, dict):
                        a = {**a, "id": a.get("id") or aid}
                        rows.append(a)
            elif isinstance(agents, list):
                rows.extend([a for a in agents if isinstance(a, dict)])

        out: list[AgentSignal] = []
        seen: set[str] = set()
        for a in rows:
            aid = str(a.get("id") or a.get("name") or "unknown")
            if aid in seen:
                continue
            seen.add(aid)
            acc = _norm(
                a.get("accuracy")
                or a.get("accuracy_pct")
                or a.get("hit_rate")
                or a.get("reputation")
                or a.get("confidence_avg")
                or 0
            )
            rep = _norm(a.get("reputation") or acc)
            if acc < self.min_reputation and rep < self.min_reputation:
                continue
            out.append(
                AgentSignal(
                    agent_id=aid,
                    reputation=max(rep, acc),
                    accuracy=acc,
                    bias=str(a.get("bias") or a.get("signal") or "WAIT").upper(),
                    confidence=_norm(a.get("confidence") or a.get("confidence_avg") or acc),
                )
            )
        out.sort(key=lambda s: (s.accuracy, s.reputation), reverse=True)
        return out[:10]

    def regime_bias(self, signals: list[AgentSignal]) -> dict[str, Any]:
        if not signals:
            return {
                "bias": "WAIT",
                "score": 0.0,
                "weight": 0.0,
                "n": 0,
                "min_accuracy": self.min_reputation,
            }
        score = 0.0
        wsum = 0.0
        for s in signals:
            w = max(s.accuracy, s.reputation) * s.confidence
            delta = 1.0 if s.bias == "BUY" else (-1.0 if s.bias == "SELL" else 0.0)
            score += w * delta
            wsum += w
        norm = score / wsum if wsum else 0.0
        bias = "BUY" if norm > 0.25 else ("SELL" if norm < -0.25 else "WAIT")
        weight = min(self.max_external_weight, abs(norm) * self.max_external_weight)
        return {
            "bias": bias,
            "score": norm,
            "weight": weight,
            "n": len(signals),
            "min_accuracy": self.min_reputation,
            "elite_ids": [s.agent_id for s in signals[:5]],
        }

    def blend_with_lia(
        self, lia_decision: str, lia_confidence: float, gs: dict[str, Any]
    ) -> dict[str, Any]:
        if gs.get("n", 0) == 0 or gs.get("weight", 0) <= 0:
            return {"decision": lia_decision, "confidence": lia_confidence, "source": "lia_only"}
        if gs["bias"] == lia_decision:
            conf = min(0.95, lia_confidence + gs["weight"] * 0.2)
            return {"decision": lia_decision, "confidence": conf, "source": "lia+gs_agree"}
        if lia_decision == "SELL" and lia_confidence >= 0.6:
            return {
                "decision": "SELL",
                "confidence": lia_confidence,
                "source": "lia_sell_protected",
            }
        if lia_decision == "WAIT" or gs["bias"] == "WAIT":
            return {
                "decision": lia_decision if lia_confidence >= 0.55 else "WAIT",
                "confidence": lia_confidence * 0.9,
                "source": "mixed_wait",
            }
        if lia_confidence >= 0.75:
            return {
                "decision": lia_decision,
                "confidence": lia_confidence * 0.85,
                "source": "lia_override",
            }
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

    def tick_price(
        self, token: str, price: float, atr: Optional[float] = None
    ) -> list[dict[str, Any]]:
        if not self.trailing:
            return []
        results = self.trailing.on_price_by_token(token, price, atr)
        self.trailing.persist()
        return results


if __name__ == "__main__":
    c = GreenSmokeConsumer()
    sigs = c.load_signals()
    print("n_elite", len(sigs), c.regime_bias(sigs))
