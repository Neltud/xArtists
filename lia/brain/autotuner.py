"""Adjust simulation params from predicted vs actual PnL (simple adaptive step)."""
from __future__ import annotations

from copy import deepcopy
from typing import Any


class LIAAutoTuner:
    def __init__(self, initial_params: dict[str, Any], learning_rate: float = 0.05):
        self.params = deepcopy(initial_params)
        self.learning_rate = learning_rate
        self.error_history: list[float] = []

    def update_parameters(
        self,
        predicted_ev: float,
        actual_pl: float,
        actual_delay: float,
        actual_gas: float,
    ) -> dict[str, Any]:
        err = actual_pl - predicted_ev
        self.error_history.append(err)

        if actual_pl < predicted_ev:
            self.params["volatility"] = float(self.params.get("volatility", 0.01)) * (
                1 + self.learning_rate
            )

        bd = self.params.get("bridge_delay") or (2.0, 10.0)
        current_min, current_max = float(bd[0]), float(bd[1])
        new_max = (current_max + actual_delay) / (1 + self.learning_rate)
        self.params["bridge_delay"] = (current_min, max(new_max, current_min + 0.1))

        bias = float(self.params.get("gas_bias", 0.05))
        self.params["gas_bias"] = (bias + actual_gas) / 2
        return dict(self.params)

    def get_current_simulation_params(self) -> dict[str, Any]:
        return dict(self.params)
