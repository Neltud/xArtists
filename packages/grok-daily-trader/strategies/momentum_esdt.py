"""ESDT momentum — buy / take-profit / stop. Any MultiversX ESDT with a price feed.

Example: buy HTM-f51d55, exit when +1.7% (or stop -1.0%).
Paper by default; live requires signed swap on ops host (not Vellum).
"""
from __future__ import annotations

from dataclasses import dataclass, field, asdict
from typing import Any


@dataclass
class Position:
    token: str
    entry_price_usd: float
    size_egld: float
    qty_token: float
    opened_ts: str


@dataclass
class MomentumConfig:
    take_profit_pct: float = 1.7  # +1.7%
    stop_loss_pct: float = 1.0  # -1.0%
    max_positions: int = 1
    min_notional_egld: float = 0.008
    # open a new "trading column" (parallel sleeve) above this liquid EGLD
    column_unlock_egld: float = 0.5
    max_columns: int = 3


@dataclass
class Column:
    id: str
    label: str
    budget_egld: float
    position: Position | None = None
    realized_pnl_egld: float = 0.0
    trades: list[dict[str, Any]] = field(default_factory=list)


def columns_for_equity(liquid_egld: float, cfg: MomentumConfig) -> list[Column]:
    """1 column at start; +1 column each time liquid crosses unlock multiples."""
    n = 1
    if liquid_egld >= cfg.column_unlock_egld:
        n = min(cfg.max_columns, 1 + int(liquid_egld // cfg.column_unlock_egld))
    budget = liquid_egld / n if n else 0.0
    return [
        Column(id=f"col_{i+1}", label=f"Sleeve {i+1}", budget_egld=round(budget, 6))
        for i in range(n)
    ]


def decide(
    *,
    token: str,
    price_usd: float,
    egld_usd: float,
    column: Column,
    cfg: MomentumConfig,
    bias: str = "WAIT",
    confidence: float = 0.5,
) -> dict[str, Any]:
    """Return action for one column. Does not sign TX."""
    if price_usd <= 0 or egld_usd <= 0:
        return {"action": "idle", "reason": "no_price"}

    pos = column.position
    if pos and pos.token == token:
        chg = (price_usd - pos.entry_price_usd) / pos.entry_price_usd * 100.0
        if chg >= cfg.take_profit_pct:
            return {
                "action": "sell",
                "token": token,
                "reason": f"take_profit_+{chg:.2f}%",
                "target_pct": cfg.take_profit_pct,
                "size_egld": pos.size_egld,
                "qty_token": pos.qty_token,
            }
        if chg <= -cfg.stop_loss_pct:
            return {
                "action": "sell",
                "token": token,
                "reason": f"stop_loss_{chg:.2f}%",
                "size_egld": pos.size_egld,
                "qty_token": pos.qty_token,
            }
        return {"action": "hold", "token": token, "pnl_pct": round(chg, 3)}

    # no position — buy only on constructive bias
    if bias in ("BUY", "LONG") and confidence >= 0.55:
        size = min(column.budget_egld * 0.9, column.budget_egld)
        if size < cfg.min_notional_egld:
            return {"action": "idle", "reason": "size_below_min"}
        qty = (size * egld_usd) / price_usd if price_usd else 0.0
        return {
            "action": "buy",
            "token": token,
            "reason": f"signal_{bias}_conf_{confidence:.2f}",
            "size_egld": round(size, 6),
            "qty_token_est": round(qty, 8),
            "entry_price_usd": price_usd,
        }

    return {"action": "idle", "reason": "wait_or_low_conf", "bias": bias, "confidence": confidence}


def apply_paper(column: Column, decision: dict[str, Any], ts: str) -> Column:
    """Mutate column state for paper fills (instant, no fee model beyond note)."""
    act = decision.get("action")
    if act == "buy" and column.position is None:
        column.position = Position(
            token=decision["token"],
            entry_price_usd=float(decision["entry_price_usd"]),
            size_egld=float(decision["size_egld"]),
            qty_token=float(decision.get("qty_token_est") or 0),
            opened_ts=ts,
        )
        column.trades.append({"ts": ts, **decision, "fill": "paper"})
    elif act == "sell" and column.position is not None:
        # mark realized as 0 unless caller adds mark price pnl
        column.trades.append({"ts": ts, **decision, "fill": "paper"})
        column.position = None
    return column


def snapshot_columns(cols: list[Column]) -> list[dict]:
    out = []
    for c in cols:
        d = {"id": c.id, "label": c.label, "budget_egld": c.budget_egld, "realized_pnl_egld": c.realized_pnl_egld}
        d["position"] = asdict(c.position) if c.position else None
        d["trades_n"] = len(c.trades)
        out.append(d)
    return out
