"""
Unified trading decision stack for Vellum cycles.
================================================
Order (always):
  1. DEFENSE / mode
  2. Venue + leverage policy
  3. Guardian spiral
  4. Slippage guard + micro-trade fee skip
  5. Open with Secure TP (log default) + dynamic trail
  6. On fill path: trail + partials + profit lock
  7. Optional: cross-chain arb scan (signals / paper)

Does not bypass LIA_LIVE_TRADING=0.
"""
from __future__ import annotations

from typing import Any, Optional

from lia.circuit.cross_chain_arb import run_cross_chain_arb_cycle
from lia.risk.dynamic_trail import DynamicTrailService
from lia.risk.leverage_policy import allow_execution, preferred_venues, policy_snapshot
from lia.risk.profit_lock import ProfitLedger
from lia.risk.secure_tp import (
    SecureTakeProfitEngine,
    SecureTpConfig,
    live_trading_enabled,
    should_skip_micro_trade,
)
from lia.risk.slippage import guard_quote, recommended_slippage_bps


class TradingStack:
    def __init__(
        self,
        ledger_path: str = "data/lia_profit_lock.json",
        trail_path: str = "data/lia_trailing_state.json",
    ):
        self.tp = SecureTakeProfitEngine()
        self.ledger = ProfitLedger.load(ledger_path)
        self.ledger_path = ledger_path
        self.trail = DynamicTrailService(state_path=trail_path)

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
        atr: float = 0.0,
        atr_pct: float = 0.0,
        max_slippage_bps: Optional[int] = None,
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

        slip = guard_quote(
            mid=entry,
            side="buy",
            notional_usd=size_usd,
            venue_id=vid,
            max_slippage_bps=max_slippage_bps,
            atr_pct=atr_pct,
        )
        if not slip["ok"]:
            return {"ok": False, "reason": "slippage_cap", "slippage": slip}

        # Reduce expected gross by buy slippage for fee check
        adj_gross = expected_gross - slip["slippage_pct"]
        skip, why = should_skip_micro_trade(
            expected_gross=max(adj_gross, 0.0),
            size_usd=size_usd,
            gas_usd=gas_usd,
        )
        if skip:
            return {"ok": False, "reason": why, "execution": "SKIP_FEE", "slippage": slip}

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
            atr=atr,
            cfg=SecureTpConfig(tp_mode=tp_mode),
        )
        if opened.get("ok"):
            self.trail.open_long(
                id=pid,
                token=token,
                entry=entry,
                size_usd=size,
                atr=atr,
                venue_id=vid,
            )
        return {
            **opened,
            "venue": vid,
            "strategy": strategy,
            "size_usd": size,
            "limit_price": slip["fill_price"],
            "slippage_bps": slip["slippage_bps"],
            "policy_execution": gate.get("execution"),
            "live_flag": live_trading_enabled(),
        }

    def on_price(self, position_id: str, price: float, **kwargs: Any) -> dict[str, Any]:
        venue_id = kwargs.pop("venue_id", "xexchange")
        atr = kwargs.get("atr")
        trail_res = self.trail.mark(position_id, price, atr=atr, venue_id=venue_id)
        res = self.tp.on_tick(position_id, price, **kwargs)
        res["trail_service"] = trail_res

        for p in res.get("partials", []):
            locked = float(p.get("locked_usd") or 0)
            comp = float(p.get("compoundable_usd") or 0)
            self.ledger.locked_usd += locked
            self.ledger.compoundable_usd += comp
            self.ledger.lifetime_realized_net += locked + comp

        if trail_res.get("action") == "STOP" and "realized_gross" in trail_res:
            # lock majority of stop exit if positive
            gross = float(trail_res["realized_gross"])
            # size unknown here — ledger already updated via secure_tp STOP path
            pass

        if any(str(a).startswith("LOCKDOWN") for a in res.get("actions", [])):
            self.ledger.force_lockdown()
        self.ledger.save(self.ledger_path)
        res["ledger"] = self.ledger.to_dict()
        return res

    def scan_cross_arb(
        self,
        *,
        sol_mid: Optional[float] = None,
        hl_mid: Optional[float] = None,
        force_paper: bool = True,
    ) -> dict[str, Any]:
        return run_cross_chain_arb_cycle(
            sol_mid=sol_mid, hl_mid=hl_mid, force_paper=force_paper
        )

    def status(self) -> dict[str, Any]:
        return {
            "live": live_trading_enabled(),
            "positions": self.tp.snapshot(),
            "trail": self.trail.snapshot(),
            "ledger": self.ledger.to_dict(),
            "policy": policy_snapshot(),
            "slippage_sample": recommended_slippage_bps(
                notional_usd=25, venue_id="xexchange"
            ),
        }


def demo() -> dict[str, Any]:
    stack = TradingStack(
        ledger_path="/tmp/lia_profit_lock_demo.json",
        trail_path="/tmp/lia_trail_demo.json",
    )
    o = stack.propose_entry(
        strategy="MOMENTUM",
        chain="multiversx",
        token="EGLD",
        entry=25.0,
        size_usd=15.0,
        equity_usd=100.0,
        expected_gross=0.02,
        tp_mode="log",
        atr=0.4,
        atr_pct=0.016,
    )
    ticks = []
    if o.get("ok"):
        pid = o["id"]
        for px in (25.1, 25.3, 25.6, 26.0, 25.8):
            ticks.append(stack.on_price(pid, px, equity_usd=100.0, venue_id="xexchange"))
    arb = stack.scan_cross_arb(sol_mid=30.0, force_paper=True)
    return {"open": o, "ticks": ticks, "arb": arb, "status": stack.status()}


if __name__ == "__main__":
    import json

    print(json.dumps(demo(), indent=2, default=str))
