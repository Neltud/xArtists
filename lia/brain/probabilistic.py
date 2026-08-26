"""Monte-Carlo EV engine for trade viability (stdlib — no numpy required)."""
from __future__ import annotations

import math
import random
from dataclasses import dataclass
from typing import Tuple


@dataclass
class EVResult:
    expected_value: float
    probability_of_profit: float
    max_loss: float
    is_viable: bool

    def to_dict(self) -> dict:
        return {
            "expected_value": self.expected_value,
            "probability_of_profit": self.probability_of_profit,
            "max_loss": self.max_loss,
            "is_viable": self.is_viable,
        }


class LIAProbabilisticEngine:
    def __init__(self, confidence_threshold: float = 0.75, seed: int | None = None):
        self.confidence_threshold = confidence_threshold
        self._rng = random.Random(seed)

    def simulate_trade_outcome(
        self,
        amount: float,
        price_diff: float,
        bridge_delay_range: Tuple[float, float],
        volatility: float,
        iterations: int = 1000,
        gas_mu: float = 0.0,
        gas_sigma: float = 0.2,
    ) -> EVResult:
        outcomes: list[float] = []
        lo, hi = bridge_delay_range
        for _ in range(iterations):
            delay = self._rng.uniform(lo, hi)
            # Brownian-like price impact during delay
            price_impact = self._rng.gauss(0.0, volatility * math.sqrt(max(delay, 1e-9)))
            actual_price_diff = price_diff + price_impact
            # lognormal gas approx
            gas_cost = math.exp(self._rng.gauss(gas_mu, gas_sigma))
            profit = (amount * actual_price_diff) - gas_cost
            outcomes.append(profit)

        ev = sum(outcomes) / len(outcomes)
        prob_profit = sum(1 for x in outcomes if x > 0) / len(outcomes)
        max_loss = min(outcomes)
        viable = prob_profit >= self.confidence_threshold and ev > 0
        return EVResult(ev, prob_profit, max_loss, viable)


if __name__ == "__main__":
    eng = LIAProbabilisticEngine(0.70, seed=42)
    r = eng.simulate_trade_outcome(10000, 0.02, (2, 10), 0.01)
    print(r.to_dict())
