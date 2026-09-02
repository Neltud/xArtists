"""Common interface every trading brain implements."""
from dataclasses import dataclass
from typing import Protocol


@dataclass
class StrategyPerformance:
    strategy_id: str
    trades_count: int
    wins: int
    losses: int
    total_pnl_pct: float

    @property
    def winrate(self) -> float:
        if self.trades_count == 0:
            return 0.0
        return self.wins / self.trades_count

    @property
    def avg_pnl_per_trade(self) -> float:
        if self.trades_count == 0:
            return 0.0
        return self.total_pnl_pct / self.trades_count


class Strategy(Protocol):
    strategy_id: str

    def propose(self, context: dict) -> dict:
        ...
