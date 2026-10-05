"""
Strategy Orchestrator — hysteresis + performance-weighted registry.
Prevents strategy oscillation (churn) across ticks.
"""
from __future__ import annotations

import json
import time
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from lia.brain.strategies import StrategyId, select_strategy

ROOT = Path(__file__).resolve().parents[2]
STATE_PATH = ROOT / "data" / "strategy_orchestrator.json"

# Require N consecutive raw picks before switch is accepted
DEFAULT_HYSTERESIS = 3


@dataclass
class OrchestratorState:
    active: StrategyId = "STRAT_YIELD_OPTIMIZER"
    pending: StrategyId | None = None
    pending_count: int = 0
    last_reason: str = "init"
    switch_reason: str = ""
    ticks: int = 0
    weights: dict[str, float] = field(default_factory=dict)


def _load() -> OrchestratorState:
    st = OrchestratorState()
    if not STATE_PATH.is_file():
        return st
    try:
        d = json.loads(STATE_PATH.read_text(encoding="utf-8"))
        st.active = d.get("active") or st.active  # type: ignore
        st.pending = d.get("pending")  # type: ignore
        st.pending_count = int(d.get("pending_count") or 0)
        st.last_reason = str(d.get("last_reason") or "")
        st.switch_reason = str(d.get("switch_reason") or "")
        st.ticks = int(d.get("ticks") or 0)
        st.weights = dict(d.get("weights") or {})
    except Exception:
        pass
    return st


def _save(st: OrchestratorState) -> None:
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "active": st.active,
        "pending": st.pending,
        "pending_count": st.pending_count,
        "last_reason": st.last_reason,
        "switch_reason": st.switch_reason,
        "ticks": st.ticks,
        "weights": st.weights,
        "updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    STATE_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    for dest in (
        ROOT / "apps" / "frontend" / "public" / "data" / "strategy_orchestrator.json",
        ROOT / "docs" / "data" / "strategy_orchestrator.json",
    ):
        try:
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        except OSError:
            pass


def update_weights_from_legs(legs: list[dict[str, Any]], *, half_life_h: float = 24.0) -> dict[str, float]:
    """Confidence weight from last ~24h shadow PnL per strategy."""
    now = time.time()
    scores: dict[str, float] = defaultdict(float)
    counts: dict[str, int] = defaultdict(int)
    for leg in legs:
        sid = str(leg.get("strategy") or "")
        if not sid:
            continue
        ts = leg.get("ts") or ""
        try:
            # 2026-10-05T12:00:00Z
            t = time.mktime(time.strptime(str(ts).replace("Z", ""), "%Y-%m-%dT%H:%M:%S"))
        except Exception:
            t = now
        age_h = max(0.0, (now - t) / 3600.0)
        if age_h > half_life_h * 1.5:
            continue
        decay = 0.5 ** (age_h / half_life_h)
        pnl = float(leg.get("pnl_usd_friction") or leg.get("pnl_usd") or 0)
        scores[sid] += pnl * decay
        counts[sid] += 1
    weights: dict[str, float] = {}
    for sid, sc in scores.items():
        # map score → weight 0.5..1.5
        w = 1.0 + max(-0.5, min(0.5, sc / 5.0))
        weights[sid] = round(w, 4)
    return weights


def orchestrate(
    *,
    sentiment: float = 0.0,
    volatility: float = 0.35,
    trend: str = "SIDEWAYS",
    distance: float = 0.0,
    confidence: float = 0.5,
    asset_state: str = "Liquid",
    liquidity: float = 0.5,
    hysteresis: int = DEFAULT_HYSTERESIS,
    legs: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """
    Raw select → hysteresis gate → optional weight bias note.
    Returns active strategy (stable) + switch metadata.
    """
    st = _load()
    if legs is not None:
        st.weights = update_weights_from_legs(legs)

    raw, raw_reason = select_strategy(
        sentiment=sentiment,
        volatility=volatility,
        trend=trend,
        distance=distance,
        confidence=confidence,
        asset_state=asset_state,
        liquidity=liquidity,
    )

    # Prefer higher-weight strategy only if raw equals it or weight strongly favors pending
    st.ticks += 1
    switched = False
    if raw == st.active:
        st.pending = None
        st.pending_count = 0
        st.last_reason = raw_reason
    else:
        if st.pending == raw:
            st.pending_count += 1
        else:
            st.pending = raw
            st.pending_count = 1
        need = max(1, int(hysteresis))
        # Faster switch if weight of pending >> active
        w_p = st.weights.get(str(raw), 1.0)
        w_a = st.weights.get(str(st.active), 1.0)
        if w_p > w_a * 1.25:
            need = max(1, need - 1)
        if st.pending_count >= need:
            st.switch_reason = (
                f"Switching from {st.active} to {raw} after {st.pending_count} ticks "
                f"({raw_reason}; w_pending={w_p:.2f} w_active={w_a:.2f})"
            )
            st.active = raw  # type: ignore
            st.pending = None
            st.pending_count = 0
            st.last_reason = raw_reason
            switched = True
        else:
            st.last_reason = (
                f"hold_{st.active}_pending_{raw}_{st.pending_count}/{need}|{raw_reason}"
            )

    _save(st)
    return {
        "active": st.active,
        "raw": raw,
        "reason": st.last_reason,
        "switch_reason": st.switch_reason if switched else "",
        "switched": switched,
        "pending": st.pending,
        "pending_count": st.pending_count,
        "weights": st.weights,
        "ticks": st.ticks,
    }
