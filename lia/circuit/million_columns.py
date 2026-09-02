"""
Course au million — 10 colonnes verticales × 1000 trades ~+1%.
Stratégies complémentaires ; math honnête (WR <100% allonge le path).
"""
from __future__ import annotations

import json
import math
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Optional

_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_STATE = _ROOT / "data" / "lia_million_columns.json"
GOAL_MULT = 20_959.0
TARGET_TRADES = 1000
NET_PCT = 0.01


@dataclass
class ColumnSpec:
    id: str
    label: str
    start_usd: float
    strategy: str
    risk_pct: float
    max_trades_per_day: int
    notes: str = ""


COLUMN_SPECS: list[ColumnSpec] = [
    ColumnSpec("C01", "Micro bootstrap", 3.0, "MEAN_REV", 0.02, 40, "small size high frequency paper"),
    ColumnSpec("C02", "Momentum core", 10.0, "MOMENTUM", 0.015, 20, "trend + GSN"),
    ColumnSpec("C03", "Micro-arb sleeve", 15.0, "MICRO_ARB", 0.01, 80, "only if spread>fees; else idle"),
    ColumnSpec("C04", "Yield ballast", 25.0, "YIELD", 0.005, 5, "Hatom/stable — slow compound"),
    ColumnSpec("C05", "Statarb / MR", 50.0, "MEAN_REV", 0.012, 15, "VWAP mean reversion"),
    ColumnSpec("C06", "Compound engine", 100.0, "COMPOUND", 0.02, 12, "circuit 1% target"),
    ColumnSpec("C07", "Weekly swing", 200.0, "MOMENTUM", 0.01, 3, "low frequency"),
    ColumnSpec("C08", "Defense reserve", 500.0, "DEFENSE", 0.0, 0, "no new risk when RISK_OFF"),
    ColumnSpec("C09", "Scale-up book", 1_000.0, "COMPOUND", 0.015, 10, "after C01–C06 proofs"),
    ColumnSpec("C10", "Preserve / harvest", 5_000.0, "HARVEST", 0.008, 5, "lock-heavy near path goal"),
]


@dataclass
class ColumnState:
    id: str
    equity_usd: float
    trades: int = 0
    wins: int = 0
    losses: int = 0
    consecutive_losses: int = 0
    realized_pnl: float = 0.0
    halted: bool = False
    halt_reason: str = ""
    last_trade_ts: float = 0.0

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "ColumnState":
        keys = set(cls.__dataclass_fields__.keys())
        return cls(**{k: v for k, v in d.items() if k in keys})


def pure_wins_to_mult(mult: float = GOAL_MULT, net_pct: float = NET_PCT) -> int:
    return int(math.ceil(math.log(mult) / math.log(1.0 + net_pct)))


def expected_trades(
    winrate: float, start: float = 1.0, goal_mult: float = GOAL_MULT, net_pct: float = NET_PCT
) -> int:
    if winrate <= 0.5:
        return 10**9
    edge = (2 * winrate - 1) * net_pct
    if edge <= 0:
        return 10**9
    return int(math.ceil(math.log(goal_mult) / math.log(1.0 + edge)))


def init_columns(specs: Optional[list[ColumnSpec]] = None) -> dict[str, ColumnState]:
    specs = specs or COLUMN_SPECS
    return {s.id: ColumnState(id=s.id, equity_usd=s.start_usd) for s in specs}


def load_state(path: Path = DEFAULT_STATE) -> dict[str, Any]:
    if not path.exists():
        cols = init_columns()
        return {
            "updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "target_trades_per_column": TARGET_TRADES,
            "net_pct": NET_PCT,
            "goal_mult_approx": GOAL_MULT,
            "pure_wins_for_mult": pure_wins_to_mult(),
            "columns": {k: v.to_dict() for k, v in cols.items()},
            "specs": [asdict(s) for s in COLUMN_SPECS],
        }
    return json.loads(path.read_text(encoding="utf-8"))


def save_state(state: dict[str, Any], path: Path = DEFAULT_STATE) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    state["updated"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    path.write_text(json.dumps(state, indent=2) + "\n", encoding="utf-8")
    return path


def record_trade(
    state: dict[str, Any],
    column_id: str,
    *,
    win: bool,
    net_pct: float = NET_PCT,
    max_consec_loss: int = 5,
) -> dict[str, Any]:
    cols = state.setdefault("columns", {})
    raw = cols.get(column_id)
    if not raw:
        return {"ok": False, "error": "unknown column"}
    col = ColumnState.from_dict(raw)
    if col.halted:
        return {"ok": False, "error": col.halt_reason or "halted"}
    if col.trades >= TARGET_TRADES:
        col.halted = True
        col.halt_reason = "TARGET_TRADES_REACHED"
        cols[column_id] = col.to_dict()
        return {"ok": False, "error": "goal trades reached", "column": col.to_dict()}
    risk = next((s.risk_pct for s in COLUMN_SPECS if s.id == column_id), 0.01)
    notional = col.equity_usd * risk
    pnl = notional * net_pct if win else -notional * net_pct
    col.equity_usd = max(0.0, col.equity_usd + pnl)
    col.realized_pnl += pnl
    col.trades += 1
    col.last_trade_ts = time.time()
    if win:
        col.wins += 1
        col.consecutive_losses = 0
    else:
        col.losses += 1
        col.consecutive_losses += 1
        if col.consecutive_losses >= max_consec_loss:
            col.halted = True
            col.halt_reason = f"{max_consec_loss} consecutive losses"
    cols[column_id] = col.to_dict()
    return {"ok": True, "pnl": pnl, "column": col.to_dict()}


def portfolio_snapshot(state: Optional[dict[str, Any]] = None) -> dict[str, Any]:
    state = state or load_state()
    cols = state.get("columns") or {}
    total = sum(float(c.get("equity_usd") or 0) for c in cols.values())
    trades = sum(int(c.get("trades") or 0) for c in cols.values())
    wins = sum(int(c.get("wins") or 0) for c in cols.values())
    losses = sum(int(c.get("losses") or 0) for c in cols.values())
    return {
        "n_columns": len(COLUMN_SPECS),
        "start_sum_usd": sum(s.start_usd for s in COLUMN_SPECS),
        "equity_sum_usd": round(total, 4),
        "total_trades": trades,
        "wins": wins,
        "losses": losses,
        "winrate": round(wins / trades, 4) if trades else None,
        "target_trades_each": TARGET_TRADES,
        "pure_wins_for_20k_mult": pure_wins_to_mult(),
        "expected_trades_wr60": expected_trades(0.60),
        "expected_trades_wr55": expected_trades(0.55),
        "updated": state.get("updated"),
    }


def complementary_matrix() -> list[dict[str, Any]]:
    def comps(strategy: str) -> list[str]:
        m = {
            "MEAN_REV": ["MOMENTUM", "YIELD"],
            "MOMENTUM": ["MEAN_REV", "DEFENSE"],
            "MICRO_ARB": ["YIELD", "DEFENSE"],
            "YIELD": ["MOMENTUM", "COMPOUND"],
            "COMPOUND": ["DEFENSE", "HARVEST"],
            "DEFENSE": ["all — capital preservation"],
            "HARVEST": ["DEFENSE", "YIELD"],
        }
        return m.get(strategy, ["DEFENSE"])

    return [
        {
            "id": s.id,
            "strategy": s.strategy,
            "start_usd": s.start_usd,
            "role": s.notes,
            "complements": comps(s.strategy),
        }
        for s in COLUMN_SPECS
    ]


if __name__ == "__main__":
    st = load_state()
    save_state(st)
    print(json.dumps(portfolio_snapshot(st), indent=2))
