"""Simulate annualized returns on 10 columns — includes losing columns.

Not a promise of return. Paper Monte-Carlo style path using core 1% TP doctrine
with realistic win-rate drag, fees, and forced loss regimes on some echelons.
"""
from __future__ import annotations

import json
import math
import random
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "data" / "compounding_annual_sim.json"

START = 1000.0
TRADES_PER_YEAR = 250  # ~1 trade/day active
CORE_TP = 0.01
CORE_SL = 0.005
FEE_RT = 0.003  # 30 bps
GAS = 0.04


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def simulate_column(
    eid: str,
    *,
    win_rate: float,
    stress: float,
    seed: int,
) -> dict:
    """stress > 0 worsens effective win_rate and widens SL hits."""
    rng = random.Random(seed)
    eq = START
    peak = START
    wins = losses = 0
    wr = max(0.25, min(0.70, win_rate - stress * 0.15))
    for _ in range(TRADES_PER_YEAR):
        size = max(eq * 0.05, 1.0)
        win = rng.random() < wr
        if win:
            gross = size * CORE_TP
            wins += 1
        else:
            gross = -size * (CORE_SL * (1.0 + stress))
            losses += 1
        net = gross - size * FEE_RT - GAS
        eq = max(0.0, eq + net)
        peak = max(peak, eq)
    total_ret = (eq / START) - 1.0
    # simple annualized = total over 1y sim horizon
    ann = total_ret
    max_dd = 0.0 if peak <= 0 else (peak - eq) / peak
    return {
        "id": eid,
        "start_usd": START,
        "end_usd": round(eq, 2),
        "trades": TRADES_PER_YEAR,
        "wins": wins,
        "losses": losses,
        "win_rate_effective": round(wr, 4),
        "stress": stress,
        "return_1y": round(ann, 4),
        "return_1y_pct": round(ann * 100, 2),
        "max_drawdown_approx": round(max_dd, 4),
        "lost_money": eq < START,
    }


def run(seed: int = 7) -> dict:
    # Columns 1-6 moderate; 7-8 stressed (likely loss); 9-10 strong
    profiles = [
        ("E1", 0.55, 0.0),
        ("E2", 0.54, 0.05),
        ("E3", 0.56, 0.0),
        ("E4", 0.52, 0.1),
        ("E5", 0.55, 0.0),
        ("E6", 0.53, 0.08),
        ("E7", 0.48, 0.35),  # loss regime
        ("E8", 0.47, 0.40),  # loss regime
        ("E9", 0.58, 0.0),
        ("E10", 0.57, 0.05),
    ]
    cols = []
    for i, (eid, wr, stress) in enumerate(profiles):
        cols.append(simulate_column(eid, win_rate=wr, stress=stress, seed=seed + i * 17))

    rets = [c["return_1y"] for c in cols]
    losers = [c["id"] for c in cols if c["lost_money"]]
    winners = [c["id"] for c in cols if not c["lost_money"]]
    avg = sum(rets) / len(rets)
    # portfolio equal-weight
    port_end = sum(c["end_usd"] for c in cols)
    port_ret = (port_end / (START * 10)) - 1.0

    payload = {
        "schema": "xartists.compounding.annual_sim.v1",
        "updated": _now(),
        "mode": "paper",
        "disclaimer": (
            "Simulation only. Includes losing columns. Not financial advice. "
            "Past/simulated paths != future results."
        ),
        "assumptions": {
            "core_tp_pct": 1.0,
            "core_sl_pct": 0.5,
            "trades_per_year": TRADES_PER_YEAR,
            "fee_rt": FEE_RT,
            "gas_usd": GAS,
            "size_pct_equity": 0.05,
            "forced_loss_columns": ["E7", "E8"],
        },
        "echelons": cols,
        "aggregate": {
            "avg_return_1y": round(avg, 4),
            "avg_return_1y_pct": round(avg * 100, 2),
            "portfolio_return_1y": round(port_ret, 4),
            "portfolio_return_1y_pct": round(port_ret * 100, 2),
            "portfolio_end_usd": round(port_end, 2),
            "winning_columns": winners,
            "losing_columns": losers,
            "n_losing": len(losers),
        },
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return payload


if __name__ == "__main__":
    p = run()
    a = p["aggregate"]
    print("annual_sim portfolio", a["portfolio_return_1y_pct"], "% losers", a["losing_columns"])
