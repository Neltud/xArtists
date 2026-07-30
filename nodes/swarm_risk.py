"""RiskAgent — veto on critical HF / circuit breaker."""
from typing import Any
from vellum.workflows import BaseNode

class RiskBrain(BaseNode):
    hatom_health_factor: float = 999.0
    circuit_breaker_active: bool = False
    leverage_risk: str = "LOW"
    egld_balance: float = 0.0

    class Outputs(BaseNode.Outputs):
        agent: str
        decision: str
        confidence: int
        reasoning: str
        actions: list[dict[str, Any]]

    def run(self) -> "RiskBrain.Outputs":
        hf = float(self.hatom_health_factor or 999)
        actions: list[dict[str, Any]] = []
        if self.circuit_breaker_active:
            return self.Outputs(agent="RiskAgent", decision="BLOCK", confidence=95, reasoning="Circuit breaker", actions=[])
        if hf < 1.5 or str(self.leverage_risk).upper() == "EXTREME":
            actions.append({"type": "DELEVERAGE", "reason": f"HF={hf:.2f}"})
            return self.Outputs(agent="RiskAgent", decision="BLOCK", confidence=98, reasoning=f"HF={hf:.2f} critical", actions=actions)
        if hf < 1.8:
            return self.Outputs(agent="RiskAgent", decision="DELEVERAGE", confidence=85, reasoning=f"HF={hf:.2f} low", actions=actions)
        if float(self.egld_balance or 0) < 0.02:
            return self.Outputs(agent="RiskAgent", decision="BLOCK", confidence=70, reasoning="EGLD gas too low", actions=[])
        return self.Outputs(agent="RiskAgent", decision="PASS", confidence=60, reasoning=f"Risk OK HF={hf:.2f}", actions=[])
