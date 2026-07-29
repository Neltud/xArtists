"""
PerformanceTracker — Vellum Workflows node that tracks LIA trading performance.

Responsibilities:
  - Log every trade (entry/exit, token, amount, P&L, fees)
  - Compute rolling winrate (last 50 closed trades)
  - Track max drawdown
  - Maintain a JSON-serialisable structure that can be saved to data/lia_performance.json
"""
import json
import os
from typing import Any

from vellum.workflows import BaseNode

DEFAULT_PERF_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "data",
    "lia_performance.json",
)
ROLLING_WINDOW = 50


class PerformanceTracker(BaseNode):
    """Tracks and persists LIA trading performance metrics."""

    # Node inputs
    trade: dict[str, Any] | None = None
    """A completed trade to record: {type: entry|exit, token, amount_usd, pnl_usd, fees_usd, price, ts}"""
    performance_path: str = DEFAULT_PERF_PATH
    initial_state: dict[str, Any] | None = None
    """Optional pre-loaded state (e.g. read from disk upstream)."""

    class Outputs(BaseNode.Outputs):
        winrate_pct: float
        total_trades: int
        winning_trades: int
        losing_trades: int
        total_pnl_usd: float
        total_fees_usd: float
        max_drawdown_pct: float
        profit_factor: float
        trades: list[dict[str, Any]]
        performance_json: dict[str, Any]

    class Display(BaseNode.Display):
        icon = "vellum:icon:function"
        color = "green"

    def run(self) -> "PerformanceTracker.Outputs":
        state = self._load_state()
        trade = self.trade or {}

        # Append trade if provided
        if trade:
            trade = dict(trade)
            state.setdefault("trades", []).append(trade)
            if trade.get("type") == "exit" and "pnl_usd" in trade:
                state.setdefault("closed_trades", []).append(trade)

        metrics = self._compute_metrics(state)
        state.update(metrics)
        state["version"] = state.get("version", 1)
        state.setdefault("updated_at", None)

        # Persist to disk (best-effort)
        try:
            os.makedirs(os.path.dirname(self.performance_path), exist_ok=True)
            with open(self.performance_path, "w") as fh:
                json.dump(state, fh, indent=2)
        except Exception as e:
            print(f"[PerformanceTracker] Could not write {self.performance_path}: {e}")

        self._log("INFO", f"📈 Performance: WR={metrics['winrate_pct']:.1f}% | Trades={metrics['total_trades']} | PnL=${metrics['total_pnl_usd']:.2f}")

        return self.Outputs(
            winrate_pct=metrics["winrate_pct"],
            total_trades=metrics["total_trades"],
            winning_trades=metrics["winning_trades"],
            losing_trades=metrics["losing_trades"],
            total_pnl_usd=metrics["total_pnl_usd"],
            total_fees_usd=metrics["total_fees_usd"],
            max_drawdown_pct=metrics["max_drawdown_pct"],
            profit_factor=metrics["profit_factor"],
            trades=state.get("trades", []),
            performance_json=state,
        )

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    def _load_state(self) -> dict[str, Any]:
        if self.initial_state:
            return dict(self.initial_state)
        try:
            with open(self.performance_path, "r") as fh:
                return json.load(fh)
        except (FileNotFoundError, json.JSONDecodeError, OSError):
            return {"trades": [], "closed_trades": []}

    @staticmethod
    def _compute_metrics(state: dict[str, Any]) -> dict[str, Any]:
        closed = state.get("closed_trades", [])
        # Rolling window (last N closed trades)
        window = closed[-ROLLING_WINDOW:]

        pnls = [float(t.get("pnl_usd", 0) or 0) for t in window]
        wins = [p for p in pnls if p > 0]
        losses = [p for p in pnls if p < 0]

        total_closed = len(window)
        winning = len(wins)
        losing = len(losses)
        winrate = (winning / total_closed * 100) if total_closed else 0.0

        gross_profit = sum(wins)
        gross_loss = abs(sum(losses))
        profit_factor = (gross_profit / gross_loss) if gross_loss > 0 else (float("inf") if gross_profit > 0 else 0.0)

        # Max drawdown over closed-trade equity curve
        max_dd = 0.0
        peak = 0.0
        equity = 0.0
        for p in pnls:
            equity += p
            peak = max(peak, equity)
            if peak > 0:
                dd = (peak - equity) / peak * 100
                max_dd = max(max_dd, dd)

        total_pnl = sum(float(t.get("pnl_usd", 0) or 0) for t in state.get("trades", []) if t.get("type") == "exit")
        total_fees = sum(float(t.get("fees_usd", 0) or 0) for t in state.get("trades", []))

        return {
            "winrate_pct": round(winrate, 2),
            "total_trades": len(state.get("trades", [])),
            "closed_trades_count": total_closed,
            "winning_trades": winning,
            "losing_trades": losing,
            "total_pnl_usd": round(total_pnl, 2),
            "total_fees_usd": round(total_fees, 2),
            "max_drawdown_pct": round(max_dd, 2),
            "profit_factor": round(profit_factor, 4) if profit_factor != float("inf") else float("inf"),
            "rolling_window": ROLLING_WINDOW,
        }

    def _log(self, severity: str, message: str) -> None:
        self._context.emit_log_event(severity=severity, message=message)
