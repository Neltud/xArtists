"""Treasury revenue flow monitor — triggers evolution proposals on high fee events."""
from __future__ import annotations

from typing import Any


class LIAEconomyMonitor:
    def __init__(self, treasury_address: str, evolution_threshold: float = 1000.0):
        self.treasury_address = treasury_address
        self.evolution_threshold = evolution_threshold
        self.revenue_history: list[dict[str, Any]] = []

    def monitor_revenue_flow(self, incoming_fee: float, fee_type: str) -> dict[str, Any]:
        evt = {"fee": incoming_fee, "type": fee_type}
        self.revenue_history.append(evt)
        out: dict[str, Any] = {"event": evt, "evolution_proposed": False}
        if incoming_fee > self.evolution_threshold:
            out["evolution_proposed"] = True
            out["proposal"] = self.trigger_evolution_proposal(incoming_fee)
        return out

    def trigger_evolution_proposal(self, amount: float) -> dict[str, Any]:
        return {
            "reason": "high_revenue_flow",
            "amount": amount,
            "suggestion": "accelerate_module_deploy_or_agent_mutation",
            "paper": True,
        }
