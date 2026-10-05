"""
Backtest engine — replay strategies on synthetic or JSON history.
Paper only. Output: per-strategy win rate, max DD, profit factor.

  PYTHONPATH=. python -m lia.brain.backtest
  PYTHONPATH=. python -m lia.brain.backtest --days 7
"""
from __future__ import annotations

import argparse
import json
import math
import random
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from lia.brain.position_sizing import size_position
from lia.brain.strategies import STRATEGIES, action_for, select_strategy

ROOT = Path(__file__).resolve().parents[2]


@dataclass
class Bar:
    ts: str
    sentiment: float
    volatility: float
    trend: str
    distance: float
    confidence: float


def synthesize_bars(days: int = 7, bars_per_day: int = 24) -> list[Bar]:
    bars: list[Bar] = []
    n = days * bars_per_day
    for i in range(n):
        day_frac = i / max(1, bars_per_day)
        sent = math.sin(day_frac / days * math.pi * 2) * 0.2 + random.uniform(-0.05, 0.05)
        vol = 0.25 + abs(sent) * 0.5 + random.uniform(0, 0.05)
        trend = "UP" if sent > 0.08 else "DOWN" if sent < -0.08 else "SIDEWAYS"
        bars.append(
            Bar(
                ts=f"bar-{i}",
                sentiment=round(sent, 4),
                volatility=round(vol, 4),
                trend=trend,
                distance=abs(sent),
                confidence=max(0.4, min(0.85, 0.55 + sent * 0.5)),
            )
        )
    return bars


def load_bars_json(path: Path) -> list[Bar]:
    raw = json.loads(path.read_text(encoding="utf-8"))
    items = raw if isinstance(raw, list) else raw.get("bars") or []
    out: list[Bar] = []
    for x in items:
        if not isinstance(x, dict):
            continue
        sent = float(x.get("sentiment") or 0)
        out.append(
            Bar(
                ts=str(x.get("ts") or ""),
                sentiment=sent,
                volatility=float(x.get("volatility") or 0.35),
                trend=str(x.get("trend") or ("UP" if sent > 0.08 else "DOWN" if sent < -0.08 else "SIDEWAYS")),
                distance=float(x.get("distance") or abs(sent)),
                confidence=float(x.get("confidence") or 0.5),
            )
        )
    return out


def _max_dd(pnls: list[float]) -> float:
    eq = 0.0
    peak = 0.0
    dd = 0.0
    for p in pnls:
        eq += p
        peak = max(peak, eq)
        if peak > 0:
            dd = max(dd, (peak - eq) / max(peak, 1e-9))
    return dd


def run_backtest(bars: list[Bar]) -> dict[str, Any]:
    # Force each strategy by evaluating action_for on every bar with fixed strat from select
    # Also aggregate "selector" path
    per: dict[str, dict[str, Any]] = {}

    def sim_path(force_id: str | None) -> dict[str, Any]:
        pnls: list[float] = []
        wins = 0
        losses = 0
        for b in bars:
            if force_id:
                sid = force_id
                reason = "forced"
            else:
                sid, reason = select_strategy(
                    sentiment=(b.sentiment + 1) / 2,
                    volatility=b.volatility,
                    trend=b.trend,
                    distance=b.distance,
                    confidence=b.confidence,
                )
            act = action_for(sid, trend=b.trend, distance=b.distance)  # type: ignore
            if act in ("STAKE", "COMPOUND"):
                act = "BUY"
            if act == "FLATTEN":
                act = "SELL"
            if act in ("HOLD", "MICRO_PROOF"):
                pnls.append(-0.01)
                continue
            sz = size_position(
                equity_usd=1000.0,
                confidence=b.confidence,
                volatility=b.volatility,
                max_usd=15.0,
            )
            edge = b.confidence * 0.4 - b.volatility * 0.5
            if act == "BUY":
                pnl = edge * sz.size_usd * 0.02 + random.uniform(-0.1, 0.15)
            else:
                pnl = (-edge) * sz.size_usd * 0.015 + random.uniform(-0.12, 0.1)
            pnls.append(pnl)
            if pnl > 0:
                wins += 1
            else:
                losses += 1
        gross_win = sum(p for p in pnls if p > 0)
        gross_loss = abs(sum(p for p in pnls if p < 0))
        pf = (gross_win / gross_loss) if gross_loss > 1e-9 else None
        return {
            "trades": wins + losses,
            "win_rate": round(wins / (wins + losses), 4) if (wins + losses) else None,
            "pnl_usd": round(sum(pnls), 4),
            "max_drawdown": round(_max_dd(pnls), 4),
            "profit_factor": round(pf, 4) if pf is not None else None,
        }

    # Selector path
    per["SELECTOR"] = sim_path(None)
    for sid in STRATEGIES:
        if sid == "STRAT_MICRO_PROOF":
            continue
        per[sid] = sim_path(sid)

    return {
        "schema": "strategy_backtest/v1",
        "paper": True,
        "bars": len(bars),
        "strategies": per,
        "note": "Synthetic or JSON replay — not live performance",
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=int, default=7)
    ap.add_argument("--json", type=str, default="")
    args = ap.parse_args()
    if args.json:
        bars = load_bars_json(Path(args.json))
    else:
        bars = synthesize_bars(days=args.days)
    report = run_backtest(bars)
    out = ROOT / "data" / "strategy_backtest_report.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, indent=2), encoding="utf-8")
    pub = ROOT / "apps" / "frontend" / "public" / "data" / "strategy_backtest_report.json"
    try:
        pub.parent.mkdir(parents=True, exist_ok=True)
        pub.write_text(json.dumps(report, indent=2), encoding="utf-8")
    except OSError:
        pass
    print(json.dumps({"bars": report["bars"], "selector": report["strategies"].get("SELECTOR")}, indent=2))


if __name__ == "__main__":
    main()
