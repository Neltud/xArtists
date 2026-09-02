"""Paper series: $10 starts — momentum, yield, arb, TP ladders, contrarian."""
from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Any, Optional

from lia.board.risk import DEFAULT_LIMITS


@dataclass
class SeriesConfig:
    id: str
    name: str
    strategy: str
    start_usd: float = 10.0
    trades_per_day: float = 5.0
    win_rate: float = 0.55
    gain_pct: float = 0.01
    loss_pct: float = 0.008


# Cap trades/day per series by global risk (never exceed max_trades_per_day share)
def _cap_tpd(x: float) -> float:
    return min(x, float(DEFAULT_LIMITS.max_trades_per_day) / 3.0)


DEFAULT_SERIES = [
    SeriesConfig("A", "Momentum/MR", "momentum", trades_per_day=_cap_tpd(5), win_rate=0.55),
    SeriesConfig(
        "B", "Yield-first", "yield", trades_per_day=_cap_tpd(2), win_rate=0.52, gain_pct=0.006, loss_pct=0.004
    ),
    SeriesConfig(
        "C", "Micro-arb", "arb", trades_per_day=_cap_tpd(8), win_rate=0.58, gain_pct=0.004, loss_pct=0.003
    ),
    SeriesConfig("TP1", "Take-profit +1%", "tp1", trades_per_day=_cap_tpd(5), win_rate=0.60, gain_pct=0.01, loss_pct=0.008),
    SeriesConfig("TP3", "Take-profit +3%", "tp3", trades_per_day=_cap_tpd(3), win_rate=0.48, gain_pct=0.03, loss_pct=0.012),
    SeriesConfig("TP5", "Take-profit +5%", "tp5", trades_per_day=_cap_tpd(2), win_rate=0.40, gain_pct=0.05, loss_pct=0.02),
    SeriesConfig(
        "CTR", "Contrarian", "contrarian", trades_per_day=_cap_tpd(4), win_rate=0.50, gain_pct=0.012, loss_pct=0.01
    ),
]


def simulate_series(cfg: SeriesConfig, *, days: int = 30) -> dict[str, Any]:
    trades = int(cfg.trades_per_day * days)
    wins = int(round(trades * cfg.win_rate))
    losses = trades - wins
    end = cfg.start_usd * ((1 + cfg.gain_pct) ** wins) * ((1 - cfg.loss_pct) ** losses)
    # equity path (weekly points)
    path = []
    eq = cfg.start_usd
    steps = max(1, days // 7)
    trades_per_step = max(1, trades // steps)
    for i in range(steps):
        w = int(round(trades_per_step * cfg.win_rate))
        l = trades_per_step - w
        eq = eq * ((1 + cfg.gain_pct) ** w) * ((1 - cfg.loss_pct) ** l)
        path.append({"week": i + 1, "equity": round(eq, 4)})
    return {
        "id": cfg.id,
        "name": cfg.name,
        "strategy": cfg.strategy,
        "start_usd": cfg.start_usd,
        "days": days,
        "trades": trades,
        "trades_per_day": cfg.trades_per_day,
        "wins": wins,
        "losses": losses,
        "win_rate": cfg.win_rate,
        "end_usd": round(end, 4),
        "multiple": round(end / cfg.start_usd, 4) if cfg.start_usd else 0,
        "equity_path": path,
        "equity_note": "paper simulation — not live balances",
    }


def run_three_series(
    *,
    start_usd: float = 10.0,
    days: int = 30,
    configs: Optional[list[SeriesConfig]] = None,
    include_all: bool = True,
) -> dict[str, Any]:
    base = configs or DEFAULT_SERIES
    if not include_all:
        base = [c for c in base if c.id in ("A", "B", "C")]
    cfgs = [
        SeriesConfig(
            c.id,
            c.name,
            c.strategy,
            start_usd=start_usd,
            trades_per_day=c.trades_per_day,
            win_rate=c.win_rate,
            gain_pct=c.gain_pct,
            loss_pct=c.loss_pct,
        )
        for c in base
    ]
    series = [simulate_series(c, days=days) for c in cfgs]
    return {
        "updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "start_each_usd": start_usd,
        "horizon_days": days,
        "risk_max_trades_per_day": DEFAULT_LIMITS.max_trades_per_day,
        "series": series,
        "combined_end_usd": round(sum(s["end_usd"] for s in series), 4),
        "combined_start_usd": round(start_usd * len(series), 4),
    }
