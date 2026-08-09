"""
CompoundCircuit — paper-first trade lifecycle for LIA (compact production).
Phases: IDLE → open → on_tick TP/SL → close → settle compound/surplus.
"""
from __future__ import annotations

import json
import time
from dataclasses import asdict, dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Optional


class Phase(str, Enum):
    IDLE = "IDLE"
    SIGNAL = "SIGNAL"
    DECIDE = "DECIDE"
    PRE_VERIFY = "PRE_VERIFY"
    EXECUTE = "EXECUTE"
    POST_VERIFY = "POST_VERIFY"
    SETTLE = "SETTLE"
    SURPLUS = "SURPLUS"
    COOLDOWN = "COOLDOWN"
    HALTED = "HALTED"


class TradeOutcome(str, Enum):
    WIN = "WIN"
    LOSS = "LOSS"
    BREAKEVEN = "BE"
    PARTIAL = "PARTIAL"
    SKIP = "SKIP"
    ERROR = "ERROR"


@dataclass
class FeeModel:
    dex_fee_roundtrip: float = 0.006
    gas_usd: float = 0.05
    max_slippage: float = 0.003
    safety_buffer: float = 0.002

    def required_gross_pct(self, notional_usd: float) -> float:
        gas_pct = self.gas_usd / max(notional_usd, 0.01)
        return self.dex_fee_roundtrip + gas_pct + self.max_slippage + self.safety_buffer

    def net_from_gross(self, gross_pct: float, notional_usd: float) -> float:
        return gross_pct - self.required_gross_pct(notional_usd)


@dataclass
class CircuitConfig:
    target_net_pct: float = 0.01
    stop_loss_pct: float = 0.01
    be_trigger_pct: float = 0.005
    trail_after_pct: float = 0.008
    trail_pct: float = 0.004
    max_concurrent: int = 1
    risk_per_trade_pct: float = 0.02
    min_notional_usd: float = 5.0
    max_notional_usd: float = 500.0
    max_deployable_pct: float = 0.22
    base_compound_fraction: float = 0.70
    surplus_fraction: float = 0.30
    max_consecutive_losses: int = 3
    cooldown_sec_after_loss: int = 900
    cooldown_sec_after_win: int = 60
    goal_trades: int = 1000
    tp_mode: str = "log"
    fee: FeeModel = field(default_factory=FeeModel)


@dataclass
class StreakState:
    wins: int = 0
    losses: int = 0
    consecutive_losses: int = 0
    consecutive_wins: int = 0
    total_pnl_usd: float = 0.0
    compound_usd: float = 0.0
    surplus_usd: float = 0.0
    halted: bool = False
    halt_reason: str = ""
    cooldown_until: float = 0.0
    updated_at: str = ""

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "StreakState":
        keys = set(cls.__dataclass_fields__.keys())
        return cls(**{k: v for k, v in d.items() if k in keys})


@dataclass
class TradeTicket:
    token: str
    entry: float
    notional_usd: float
    stop: float
    target: float
    opened_at: float
    pre_balance_usd: float = 0.0
    tx_open: str = ""
    strategy: str = ""
    meta: Optional[dict] = None
    peak: float = 0.0
    tp_mode: str = "fixed"
    tp_plan: Optional[dict[str, Any]] = None
    size_remaining_pct: float = 1.0
    realized_pnl_usd: float = 0.0
    partial_events: list = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def _ticket_from_dict(d: dict[str, Any]) -> TradeTicket:
    keys = set(TradeTicket.__dataclass_fields__.keys())
    filtered = {k: v for k, v in d.items() if k in keys}
    filtered.setdefault("partial_events", [])
    return TradeTicket(**filtered)


class CompoundCircuit:
    def __init__(
        self,
        config: Optional[CircuitConfig] = None,
        state_path: str = "data/lia_compound_streak.json",
        tickets_path: str = "data/lia_compound_tickets.json",
    ):
        self.cfg = config or CircuitConfig()
        self.state_path = Path(state_path)
        self.tickets_path = Path(tickets_path)
        self.streak = StreakState()
        self.open_ticket: Optional[TradeTicket] = None
        self.phase = Phase.IDLE
        self.load()

    def load(self) -> None:
        try:
            raw = json.loads(self.state_path.read_text(encoding="utf-8"))
            self.streak = StreakState.from_dict(raw.get("streak", raw))
            if raw.get("open_ticket"):
                self.open_ticket = _ticket_from_dict(raw["open_ticket"])
            self.phase = Phase(raw.get("phase", Phase.IDLE.value))
            if "tp_mode" in raw.get("config", {}):
                self.cfg.tp_mode = str(raw["config"]["tp_mode"])
        except FileNotFoundError:
            pass
        except Exception:
            pass

    def save(self) -> None:
        self.streak.updated_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        payload = {
            "phase": self.phase.value,
            "streak": self.streak.to_dict(),
            "open_ticket": self.open_ticket.to_dict() if self.open_ticket else None,
            "config": {
                "target_net_pct": self.cfg.target_net_pct,
                "stop_loss_pct": self.cfg.stop_loss_pct,
                "goal_trades": self.cfg.goal_trades,
                "risk_per_trade_pct": self.cfg.risk_per_trade_pct,
                "base_compound_fraction": self.cfg.base_compound_fraction,
                "tp_mode": self.cfg.tp_mode,
            },
        }
        self.state_path.parent.mkdir(parents=True, exist_ok=True)
        self.state_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    def health(self) -> dict[str, Any]:
        return {
            "phase": self.phase.value,
            "open": self.open_ticket is not None,
            "wins": self.streak.wins,
            "losses": self.streak.losses,
            "consecutive_losses": self.streak.consecutive_losses,
            "total_pnl_usd": round(self.streak.total_pnl_usd, 6),
            "compound_usd": round(self.streak.compound_usd, 6),
            "surplus_usd": round(self.streak.surplus_usd, 6),
            "halted": self.streak.halted,
            "halt_reason": self.streak.halt_reason,
            "cooldown_until": self.streak.cooldown_until,
            "tp_mode": self.cfg.tp_mode,
        }

    def can_open(self) -> tuple[bool, str]:
        if self.streak.halted:
            return False, self.streak.halt_reason or "HALTED"
        if self.open_ticket is not None:
            return False, "ALREADY_OPEN"
        now = time.time()
        if now < float(self.streak.cooldown_until or 0):
            return False, "COOLDOWN"
        if self.streak.consecutive_losses >= self.cfg.max_consecutive_losses:
            self.streak.halted = True
            self.streak.halt_reason = f"{self.cfg.max_consecutive_losses} consecutive losses"
            self.save()
            return False, self.streak.halt_reason
        if self.streak.wins + self.streak.losses >= self.cfg.goal_trades:
            return False, "GOAL_REACHED"
        return True, "OK"

    def size_notional(self, deployable_usd: float) -> float:
        n = deployable_usd * self.cfg.risk_per_trade_pct / max(self.cfg.stop_loss_pct, 1e-6)
        n = min(n, deployable_usd * self.cfg.max_deployable_pct)
        n = max(0.0, min(n, self.cfg.max_notional_usd))
        if n < self.cfg.min_notional_usd:
            return 0.0
        return round(n, 4)

    def levels(
        self, entry: float, notional: float, strategy: str = "", z_abs: float = 0.0
    ) -> tuple[float, float, float]:
        gross = self.cfg.target_net_pct + self.cfg.fee.required_gross_pct(notional)
        if strategy.lower().startswith("stat") and z_abs > 1.5:
            gross = max(gross, 0.01)
        stop = entry * (1.0 - self.cfg.stop_loss_pct)
        target = entry * (1.0 + gross)
        return stop, target, gross

    def open_trade(
        self,
        *,
        token: str,
        entry: float,
        deployable_usd: float,
        pre_balance_usd: float,
        tx_open: str = "",
        strategy: str = "",
        meta: Optional[dict] = None,
        tp_mode: Optional[str] = None,
    ) -> Optional[TradeTicket]:
        ok, reason = self.can_open()
        if not ok:
            self.phase = Phase.COOLDOWN if reason == "COOLDOWN" else Phase.HALTED
            self.save()
            return None
        if tp_mode:
            self.cfg.tp_mode = tp_mode
        notional = self.size_notional(deployable_usd)
        if notional < self.cfg.min_notional_usd:
            return None
        stop, target, _gross = self.levels(entry, notional, strategy=strategy)
        ticket = TradeTicket(
            token=token,
            entry=entry,
            notional_usd=notional,
            stop=stop,
            target=target,
            opened_at=time.time(),
            pre_balance_usd=pre_balance_usd,
            tx_open=tx_open,
            strategy=strategy,
            meta=meta,
            peak=entry,
            tp_mode=self.cfg.tp_mode,
        )
        self.open_ticket = ticket
        self.phase = Phase.EXECUTE
        self.save()
        return ticket

    def on_tick(self, price: float) -> dict[str, Any]:
        t = self.open_ticket
        if not t:
            return {"event": "NO_TICKET"}
        t.peak = max(t.peak or t.entry, price)
        ret = (price - t.entry) / t.entry if t.entry else 0.0
        if price <= t.stop:
            return {"event": "STOP", "price": price, "ret": ret}
        if price >= t.target:
            return {"event": "TARGET", "price": price, "ret": ret}
        if ret >= self.cfg.trail_after_pct:
            trail_stop = t.peak * (1.0 - self.cfg.trail_pct)
            if price <= trail_stop:
                return {"event": "TRAIL", "price": price, "ret": ret, "trail_stop": trail_stop}
            if ret >= self.cfg.be_trigger_pct and t.stop < t.entry:
                t.stop = t.entry
        return {"event": "HOLD", "price": price, "ret": ret, "peak": t.peak}

    def close_trade(
        self,
        *,
        exit_price: float,
        tx_close: str = "",
        reason: str = "",
    ) -> dict[str, Any]:
        t = self.open_ticket
        if not t:
            return {"ok": False, "reason": "NO_TICKET"}
        ret = (exit_price - t.entry) / t.entry if t.entry else 0.0
        gross_pnl = t.notional_usd * ret * t.size_remaining_pct
        fee_drag = t.notional_usd * self.cfg.fee.required_gross_pct(t.notional_usd)
        net = gross_pnl - fee_drag * (1 if gross_pnl > 0 else 0.5)

        if net > 0:
            outcome = TradeOutcome.WIN
            self.streak.wins += 1
            self.streak.consecutive_wins += 1
            self.streak.consecutive_losses = 0
            self.streak.compound_usd += net * self.cfg.base_compound_fraction
            self.streak.surplus_usd += net * self.cfg.surplus_fraction
            self.streak.cooldown_until = time.time() + self.cfg.cooldown_sec_after_win
        elif net < 0:
            outcome = TradeOutcome.LOSS
            self.streak.losses += 1
            self.streak.consecutive_losses += 1
            self.streak.consecutive_wins = 0
            self.streak.cooldown_until = time.time() + self.cfg.cooldown_sec_after_loss
        else:
            outcome = TradeOutcome.BREAKEVEN

        self.streak.total_pnl_usd += net
        t.realized_pnl_usd += net
        result = {
            "ok": True,
            "outcome": outcome.value,
            "net_pnl_usd": round(net, 6),
            "gross_pnl_usd": round(gross_pnl, 6),
            "ret": round(ret, 6),
            "reason": reason,
            "tx_close": tx_close,
            "token": t.token,
            "strategy": t.strategy,
        }
        self.open_ticket = None
        self.phase = Phase.SETTLE
        if self.streak.consecutive_losses >= self.cfg.max_consecutive_losses:
            self.streak.halted = True
            self.streak.halt_reason = "max consecutive losses"
            self.phase = Phase.HALTED
        else:
            self.phase = Phase.COOLDOWN
        self.save()
        return result
