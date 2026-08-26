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
            price_impact = self._rng.gauss(0.0, volatility * math.sqrt(max(delay, 1e-9)))
            actual_price_diff = price_diff + price_impact
            gas_cost = math.exp(self._rng.gauss(gas_mu, gas_sigma))
            profit = (amount * actual_price_diff) - gas_cost
            outcomes.append(profit)

        ev = sum(outcomes) / len(outcomes)
        prob_profit = sum(1 for x in outcomes if x > 0) / len(outcomes)
        max_loss = min(outcomes)
        viable = prob_profit >= self.confidence_threshold and ev > 0
        return EVResult(ev, prob_profit, max_loss, viable)

    def calculate_ev(
        self,
        amount: float,
        price_diff: float,
        volatility: float,
        delay_range: Tuple[float, float],
        *,
        gas_cost: float | None = None,
        iterations: int = 1000,
    ) -> tuple[float, float]:
        """
        API alignée snippet ops: (expected_value, probability_of_profit).
        gas_cost fixe optionnel ; sinon lognormal interne.
        """
        if gas_cost is not None:
            outcomes: list[float] = []
            lo, hi = delay_range
            for _ in range(iterations):
                delay = self._rng.uniform(lo, hi)
                price_impact = self._rng.gauss(
                    0.0, volatility * math.sqrt(max(delay, 1e-9))
                )
                profit = (amount * (price_diff + price_impact)) - float(gas_cost)
                outcomes.append(profit)
            ev = sum(outcomes) / len(outcomes)
            p = sum(1 for x in outcomes if x > 0) / len(outcomes)
            return ev, p
        r = self.simulate_trade_outcome(
            amount, price_diff, delay_range, volatility, iterations=iterations
        )
        return r.expected_value, r.probability_of_profit


def calculate_ev(
    amount: float,
    price_diff: float,
    volatility: float,
    delay_range: Tuple[float, float],
    *,
    gas_cost: float = 0.0,
    iterations: int = 1000,
    seed: int | None = None,
) -> tuple[float, float]:
    """Module-level helper (Monte-Carlo, stdlib)."""
    eng = LIAProbabilisticEngine(seed=seed)
    return eng.calculate_ev(
        amount,
        price_diff,
        volatility,
        delay_range,
        gas_cost=gas_cost,
        iterations=iterations,
    )


if __name__ == "__main__":
    eng = LIAProbabilisticEngine(0.70, seed=42)
    r = eng.simulate_trade_outcome(10000, 0.02, (2, 10), 0.01)
    print(r.to_dict())
    print("calculate_ev", calculate_ev(10000, 0.02, 0.01, (2, 10), gas_cost=1.0, seed=42))
