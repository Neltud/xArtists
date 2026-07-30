"""YieldAgent — idle USDC to Hatom supply."""
from typing import Any
from vellum.workflows import BaseNode

class YieldBrain(BaseNode):
    strategy_name: str = "YieldAgent"
    usdc_balance: float = 0.0
    hatom_health_factor: float = 999.0
    gs_regime: str = "NEUTRAL"
    min_usdc_supply: float = 5.0
    supply_pct: float = 0.5

    class Outputs(BaseNode.Outputs):
        agent: str
        decision: str
        confidence: int
        reasoning: str
        actions: list[dict[str, Any]]

    def run(self) -> "YieldBrain.Outputs":
        usdc = float(self.usdc_balance or 0)
        hf = float(self.hatom_health_factor or 999)
        regime = str(self.gs_regime or "NEUTRAL").upper()
        actions: list[dict[str, Any]] = []
        decision, confidence, reasoning = "WAIT", 55, "No idle capital for yield"
        if hf < 1.8:
            decision, confidence, reasoning = "WAIT", 80, f"HF={hf:.2f} too low"
        elif usdc >= self.min_usdc_supply:
            amount = round(max(0, min(usdc * self.supply_pct, usdc - 1.0)), 2)
            if amount >= 2.0:
                decision = "YIELD"
                confidence = 85 if regime == "RISK_OFF" else 75
                reasoning = f"USDC idle ${usdc:.2f} -> Hatom supply ${amount:.2f}"
                actions.append({"type": "HATOM_SUPPLY", "amount_usd": amount, "reason": reasoning})
        return self.Outputs(agent="YieldAgent", decision=decision, confidence=confidence, reasoning=reasoning, actions=actions)
