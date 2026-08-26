"""Meta-LIA swarm orchestration (Predator / Harvester allocation — paper)."""
from __future__ import annotations

import random
from typing import Any


class MetaLIA:
    def __init__(self, capital_pool: float = 1_000_000.0, seed: int | None = None):
        self.agents: list[dict[str, Any]] = []
        self.capital_pool = capital_pool
        self._rng = random.Random(seed)
        self.log: list[str] = []

    def orchestrate(self, market_volatility: float | None = None) -> dict[str, Any]:
        vol = (
            market_volatility
            if market_volatility is not None
            else self._rng.uniform(0, 1)
        )
        if vol > 0.7:
            primary, secondary = "Predator", "Harvester"
        else:
            primary, secondary = "Harvester", "Predator"
        self._deploy_agent_type(primary)
        self._scale_back_agent_type(secondary)
        return {
            "volatility": vol,
            "primary": primary,
            "secondary": secondary,
            "capital_pool": self.capital_pool,
            "log": list(self.log[-8:]),
            "paper": True,
        }

    def _deploy_agent_type(self, agent_type: str) -> None:
        self.log.append(f"deploy/scale_up:{agent_type}")
        self.agents.append({"type": agent_type, "weight": 1.0})

    def _scale_back_agent_type(self, agent_type: str) -> None:
        self.log.append(f"scale_back:{agent_type}")
