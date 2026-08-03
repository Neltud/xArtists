"""Three parallel LIA paper series — default $10 start each."""
from __future__ import annotations

import math
import time
from dataclasses import dataclass, field
from typing import Any, Optional

from apps_frontend_shim = None  # noqa — keep pure python

from lia.board.positions import fetch_wallet_snapshot  # type: ignore


@dataclass
class SeriesConfig:
    id: str
    name: str
    strategy: str  # momentum | yield | arb
    start_usd: float = 10.0
    trades_per_day: float = 5.0
    win_rate: float = 0.55
    gain_pct: float = 0.01
    loss_pct: float = 0.008


DEFAULT_SERIES = [
    SeriesConfig("A", "Series A — Momentum/MR", "momentum", win_rate=0.55),
    SeriesConfig("B", "Series B — Yield-first", "yield", win_rate=0.52, gain_pct=0.006, loss_pct=0.004),
    SeriesConfig("C", "Series C — Micro-arb", "arb", win_rate=0.58, gain_pct=0.004, loss_pct=0.003),
]


def simulate_series(cfg: SeriesConfig, *, days: int = 30) -> dict[str, Any]:
    trades = int(cfg.trades_per_day * days)
    wins = int(round(trades * cfg.win_rate))
    losses = trades - wins
    end = cfg.start_usd * ((1 + cfg.gain_pct) ** wins) * ((1 - cfg.loss_pct) ** losses)
    return {
        "id": cfg.id,
        "name": cfg.name,
        "strategy": cfg.strategy,
        "start_usd": cfg.start_usd,
        "days": days,
        "trades": trades,
        "wins": wins,
        "losses": losses,
        "win_rate": cfg.win_rate,
        "end_usd": round(end, 4),
        "multiple": round(end / cfg.start_usd, 4) if cfg.start_usd else 0,
        "equity_note": "paper simulation — not live balances",
    }


def run_three_series(
    *,
    start_usd: float = 10.0,
    days: int = 30,
    configs: Optional[list[SeriesConfig]] = None,
) -> dict[str, Any]:
    cfgs = configs or [
        SeriesConfig(c.id, c.name, c.strategy, start_usd=start_usd, win_rate=c.win_rate, gain_pct=c.gain_pct, loss_pct=c.loss_pct)
        for c in DEFAULT_SERIES
    ]
    series = [simulate_series(c, days=days) for c in cfgs]
    return {
        "updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "start_each_usd": start_usd,
        "horizon_days": days,
        "series": series,
        "combined_end_usd": round(sum(s["end_usd"] for s in series), 4),
        "combined_start_usd": round(start_usd * len(series), 4),
    }
