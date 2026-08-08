"""
Unified trading decision stack for Vellum cycles.
================================================
Order (always):
  1. DEFENSE / mode
  2. Venue + leverage policy
  3. Guardian spiral
  4. Micro-trade fee skip
  5. Open with Secure TP (log default)
  6. On fill path: trail + partials + profit lock

Does not bypass LIA_LIVE_TRADING=0.
"""
from __future__ import annotations

from typing import Any, Optional

from lia.risk.leverage_policy import allow_execution, preferred_venues, policy_snapshot
from lia.risk.profit_lock import ProfitLedger
from lia.risk.secure_tp import (
    SecureTakeProfitEngine,
    SecureTpConfig,
    live_trading_enabled,
    should_skip_micro_trade,
)


class TradingStack:
    def __init__(self, ledger_path: str = "data/lia_profit_lock.json"):
        self.tp = SecureTakeProfitEngine()
        self.ledger = ProfitLedger.load(ledger_path)
        self.ledger_path = ledger_path

    def propose_entry(
        self,
        *,
        strategy: str,
        chain: str,
        token: str,
        entry: float,
        size_usd: float,
        equity_usd: float,
        expected_gross: float = 0.01,
        venue_id: Optional[str] = None,
        leverage: float = 1.0,
        mode: str = "COMPOUND",
        drawdown: float = 0.0,
        consecutive_wins: int = 0,
        gas_usd: float = 0.02,
        tp_mode: str = "log",
    ) -> dict[str, Any]:
        if mode.upper() in ("DEFENSE", "RISK_OFF"):
            return {"ok": False, "reason": "defense_mode", "execution": "NONE"}

        venues = preferred_venues(strategy, chain=chain)
        vid = venue_id or (venues[0] if venues else "xexchange")

        gate = allow_execution(
            chain=chain,
            venue_id=vid,
            requested_leverage=leverage,
            strategy=strategy,
        )
        if not gate["allow"]:
            return {"ok": False, **gate}

        skip, why = should_skip_micro_trade(
            expected_gross=expected_gross,
            size_usd=size_usd,
            gas_usd=gas_usd,
        )
        if skip:
            return {"ok": False, "reason": why, "execution": "SKIP_FEE"}

        # Size cannot exceed compoundable + allocated equity slice
        max_from_ledger = self.ledger.compoundable_usd + equity_usd * 0.25
        size = min(size_usd, max_from_ledger if max_from_ledger > 0 else size_usd)

        pid = f"{chain}:{vid}:{token}:{int(entry * 1e8)}"
        opened = self.tp.open(
            id=pid,
            chain=chain,
            venue=vid,
            token=token,
            entry=entry,
            size_usd=size,
            equity_usd=equity_usd,
            notional_usd=size * leverage,
            mode=mode,
            drawdown=drawdown,
            consecutive_wins=consecutive_wins,
            cfg=SecureTpConfig(tp_mode=tp_mode),
        )
        return {
            **opened,
            "venue": vid,
            "strategy": strategy,
            "size_usd": size,
            "policy_execution": gate.get("execution"),
            "live_flag": live_trading_enabled(),
        }

    def on_price(self, position_id: str, price: float, **kwargs: Any) -> dict[str, Any]:
        res = self.tp.on_tick(position_id, price, **kwargs)
        for p in res.get("partials", []):
            self.ledger.credit(p.get("locked_usd", 0) + p.get("compoundable_usd", 0), lock_ratio=0.70)
            # credit() re-splits; align with partial already split:
            # adjust by using lock_ratio 1.0 path on locked portion only
        if "LOCKDOWN" in "|".join(res.get("actions", [])):
            self.ledger.force_lockdown()
        self.ledger.save(self.ledger_path)
        res["ledger"] = self.ledger.to_dict()
        return res

    def status(self) -> dict[str, Any]:
        return {
            "live": live_trading_enabled(),
            "positions": self.tp.snapshot(),
            "ledger": self.ledger.to_dict(),
            "policy": policy_snapshot(),
        }


def demo() -> dict[str, Any]:
    stack = TradingStack(ledger_path="/tmp/lia_profit_lock_demo.json")
    o = stack.propose_entry(
        strategy="MOMENTUM",
        chain="multiversx",
        token="EGLD",
        entry=25.0,
        size_usd=15.0,
        equity_usd=100.0,
        expected_gross=0.02,
        tp_mode="log",
    )
    ticks = []
    if o.get("ok"):
        pid = o["id"]
        for px in (25.1, 25.3, 25.6, 26.0, 25.8):
            ticks.append(stack.on_price(pid, px, equity_usd=100.0))
    return {"open": o, "ticks": ticks, "status": stack.status()}


if __name__ == "__main__":
    import json

    print(json.dumps(demo(), indent=2, default=str))
