"""Simple multi-asset portfolio state + rebalance flag."""
from __future__ import annotations


class LIAPortfolioManager:
    def __init__(self) -> None:
        self.supported_assets = ["EGLD", "USDC", "TRO", "WBTC"]
        self.portfolio_composition: dict[str, float] = {}

    def update_portfolio_state(self, asset_name: str, amount: float) -> None:
        self.portfolio_composition[asset_name] = float(amount)

    def analyze_risk_exposure(self) -> float:
        total = sum(self.portfolio_composition.values()) or 1.0
        volatile = sum(
            v
            for k, v in self.portfolio_composition.items()
            if k.upper() not in ("USDC", "USDT", "DAI")
        )
        return volatile / total

    def plan_rebalance(self, target_volatility: float = 0.5) -> dict:
        cur = self.analyze_risk_exposure()
        need = cur > target_volatility
        return {
            "current_vol_proxy": cur,
            "target": target_volatility,
            "rebalance": need,
            "plan": "SELL_VOLATILE_TO_USDC" if need else "HOLD",
        }
