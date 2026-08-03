"""
LIA Compound Engine — Circuit financier professionnel (paramètres optimisés)
Objectif: enchaîner N trades à +1 % NET compounding avec winrate maximal.

Calibrage compétent:
  - Risk par trade plus serré (1.5 %)
  - Trailing / BE plus réactifs
  - Halt après 2 pertes consécutives
  - Cooldown post-win court (45 s) pour multi-cycles/jour
  - 75 % des gains restent en compound
LIA Compound Engine — Circuit financier professionnel
Objectif: enchaîner N trades à +1 % NET compounding.

TP modes (CircuitConfig.tp_mode):
  fixed  — single target for +1% net (legacy)
  log    — logarithmic scale-out (default, capital protection)
  exp    — exponential targets + runner
  ladder — R-multiple partials

Integrated via lia.circuit.tp_mode + take_profit_curves.
"""
from __future__ import annotations

import json
import time
import uuid
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
    gas_usd: float = 0.04
    max_slippage: float = 0.0025
    safety_buffer: float = 0.0015
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
    stop_loss_pct: float = 0.009          # légèrement plus serré que 1 %
    be_trigger_pct: float = 0.004         # BE plus tôt
    trail_after_pct: float = 0.006        # trailing plus tôt
    trail_pct: float = 0.0035             # trailing plus serré
    max_concurrent: int = 1
    risk_per_trade_pct: float = 0.015     # 1.5 % du capital déployable
    min_notional_usd: float = 5.0
    max_notional_usd: float = 400.0
    max_deployable_pct: float = 0.22      # jamais > 22 % déployable
    base_compound_fraction: float = 0.75  # plus de capital reste en compound
    surplus_fraction: float = 0.25
    max_consecutive_losses: int = 2       # halt plus strict
    cooldown_sec_after_loss: int = 1200   # 20 min après perte
    cooldown_sec_after_win: int = 45      # multi-cycles possibles
    goal_trades: int = 1000
    statarb_min_net_pct: float = 0.0085
    statarb_max_net_pct: float = 0.014
    stop_loss_pct: float = 0.01
    be_trigger_pct: float = 0.005
    trail_after_pct: float = 0.008
    trail_pct: float = 0.004
    max_concurrent: int = 1
    risk_per_trade_pct: float = 0.02
    min_notional_usd: float = 5.0
    max_notional_usd: float = 500.0
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
    consecutive_wins: int = 0
    consecutive_losses: int = 0
    total_trades: int = 0
    compound_equity_usd: float = 0.0
    yield_sleeve_usd: float = 0.0
    peak_equity_usd: float = 0.0
    last_outcome: str = ""
    last_trade_id: str = ""
    cooldown_until: float = 0.0
    halted: bool = False
    halt_reason: str = ""
    updated_at: str = ""

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "StreakState":
        return cls(**{k: v for k, v in d.items() if k in cls.__dataclass_fields__})


@dataclass
class TradeTicket:
    id: str
    token: str
    side: str
    entry: float
    notional_usd: float
    stop: float
    target: float
    gross_required_pct: float
    opened_at: float
    status: str = "OPEN"
    hwm: float = 0.0
    trail_active: bool = False
    outcome: str = ""
    exit_price: float = 0.0
    net_pct: float = 0.0
    tx_open: str = ""
    tx_close: str = ""
    pre_balance_usd: float = 0.0
    post_balance_usd: float = 0.0
    strategy: str = ""
    meta: Optional[dict] = None
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
    if filtered.get("partial_events") is None:
        filtered["partial_events"] = []
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
                ot = raw["open_ticket"]
                ot.setdefault("strategy", "")
                ot.setdefault("meta", None)
                self.open_ticket = TradeTicket(**ot)
                self.open_ticket = _ticket_from_dict(raw["open_ticket"])
            self.phase = Phase(raw.get("phase", Phase.IDLE.value))
            if "tp_mode" in raw.get("config", {}):
                self.cfg.tp_mode = str(raw["config"]["tp_mode"])
        except FileNotFoundError:
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

    def append_ticket_history(self, ticket: TradeTicket) -> None:
        hist: list[dict[str, Any]] = []
        if self.tickets_path.exists():
            try:
                hist = json.loads(self.tickets_path.read_text(encoding="utf-8")).get("tickets", [])
            except json.JSONDecodeError:
                hist = []
        hist.append(ticket.to_dict())
        hist = hist[-2000:]
        self.tickets_path.write_text(
            json.dumps({"updated": self.streak.updated_at, "tickets": hist}, indent=2),
            encoding="utf-8",
        )

    def size_notional(self, deployable_usd: float) -> float:
        risk_budget = deployable_usd * self.cfg.risk_per_trade_pct
        notional = risk_budget / max(self.cfg.stop_loss_pct, 0.001)
        notional = max(self.cfg.min_notional_usd, min(self.cfg.max_notional_usd, notional))
        notional = min(notional, deployable_usd * self.cfg.max_deployable_pct)
        return round(notional, 4)

    def levels(
        self,
        entry: float,
        notional_usd: float,
        strategy: str = "",
        z_abs: float = 0.0,
    ) -> tuple[float, float, float]:
        target_net = self.cfg.target_net_pct
        if strategy == "STATARB" and z_abs >= 2.4:
            target_net = min(self.cfg.statarb_max_net_pct, target_net + 0.0025)
        elif strategy == "STATARB":
            target_net = max(self.cfg.statarb_min_net_pct, target_net)

        gross = self.cfg.fee.required_gross_pct(notional_usd) + target_net
        notional = min(notional, deployable_usd * 0.25)
        return round(notional, 4)

    def levels(self, entry: float, notional_usd: float) -> tuple[float, float, float]:
        gross = self.cfg.fee.required_gross_pct(notional_usd) + self.cfg.target_net_pct
        stop = entry * (1 - self.cfg.stop_loss_pct)
        target = entry * (1 + gross)
        return stop, target, gross

    def can_open(self) -> tuple[bool, str]:
        if self.streak.halted:
            return False, f"HALTED: {self.streak.halt_reason}"
        if time.time() < self.streak.cooldown_until:
            return False, "COOLDOWN"
        if self.open_ticket is not None:
            return False, "POSITION_OPEN"
        if self.streak.consecutive_losses >= self.cfg.max_consecutive_losses:
            self.streak.halted = True
            self.streak.halt_reason = f"{self.cfg.max_consecutive_losses} consecutive losses"
            self.save()
            return False, self.streak.halt_reason
        if self.streak.wins + self.streak.losses >= self.cfg.goal_trades:
            return False, "GOAL_REACHED"
        return True, "OK"

    def _attach_tp_plan(self, entry: float, gross: float) -> dict[str, Any]:
        try:
            from lia.circuit.tp_mode import make_plan

            return make_plan(entry, gross, self.cfg.tp_mode)
        except Exception as e:
            return {
                "plan": {
                    "mode": "fixed",
                    "entry": entry,
                    "runner_frac": 0.0,
                    "realized_frac": 0.0,
                    "levels": [
                        {
                            "index": 0,
                            "gross_pct": gross,
                            "price": entry * (1 + gross),
                            "size_frac": 1.0,
                            "hit": False,
                        }
                    ],
                },
                "validation": {"ok": True, "fallback": str(e)},
                "mode": "fixed",
            }

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

        z_abs = 0.0
        if meta and isinstance(meta.get("z"), (int, float)):
            z_abs = abs(float(meta["z"]))

        stop, target, gross = self.levels(entry, notional, strategy=strategy, z_abs=z_abs)
        stop, target, gross = self.levels(entry, notional)
        attached = self._attach_tp_plan(entry, gross)
        plan = attached.get("plan") or {}
        levels = plan.get("levels") or []
        if levels and self.cfg.tp_mode != "fixed":
            target = float(levels[-1]["price"])

        ticket = TradeTicket(
            id=f"c-{time.strftime('%Y%m%d')}-{uuid.uuid4().hex[:8]}",
            token=token,
            side="LONG",
            entry=entry,
            notional_usd=notional,
            stop=stop,
            target=target,
            gross_required_pct=gross,
            opened_at=time.time(),
            hwm=entry,
            tx_open=tx_open,
            pre_balance_usd=pre_balance_usd,
            strategy=strategy,
            meta=meta,
            tp_mode=str(attached.get("mode") or self.cfg.tp_mode),
            tp_plan=plan,
            size_remaining_pct=1.0,
            realized_pnl_usd=0.0,
            partial_events=[],
        )
        self.open_ticket = ticket
        self.phase = Phase.EXECUTE
        self.save()
        return ticket

    def on_tick(self, price: float) -> dict[str, Any]:
        t = self.open_ticket
        if not t or t.status != "OPEN":
            return {"action": "NONE"}

        if price > t.hwm:
            t.hwm = price

        if price >= t.entry * (1 + self.cfg.be_trigger_pct):
            be_stop = t.entry
            if be_stop > t.stop:
                t.stop = be_stop

        if price >= t.entry * (1 + self.cfg.trail_after_pct):
            t.trail_active = True

        if t.trail_active:
            trail_stop = t.hwm * (1 - self.cfg.trail_pct)
            if trail_stop > t.stop:
                t.stop = trail_stop

        partial_info: dict[str, Any] = {"action": "NONE"}
        if t.tp_plan and t.tp_mode != "fixed":
            try:
                from lia.circuit.tp_mode import tick_plan

                partial_info = tick_plan(t.tp_plan, price)
                t.tp_plan = partial_info.get("plan") or t.tp_plan
                if partial_info.get("action") == "PARTIAL_TP":
                    for hit in partial_info.get("newly_hit") or []:
                        frac = float(hit.get("size_frac") or 0)
                        lvl_price = float(hit.get("price") or price)
                        slice_gross = (lvl_price - t.entry) / t.entry if t.entry else 0.0
                        slice_net = self.cfg.fee.net_from_gross(slice_gross, t.notional_usd * frac)
                        slice_pnl = t.notional_usd * frac * slice_net
                        t.realized_pnl_usd += slice_pnl
                        t.size_remaining_pct = max(0.0, t.size_remaining_pct - frac)
                        t.partial_events.append(
                            {
                                "ts": time.time(),
                                "level": hit.get("index"),
                                "price": lvl_price,
                                "frac": frac,
                                "pnl_usd": round(slice_pnl, 6),
                            }
                        )
                        if slice_pnl > 0:
                            self.streak.compound_equity_usd += slice_pnl * self.cfg.base_compound_fraction
                            self.streak.yield_sleeve_usd += slice_pnl * self.cfg.surplus_fraction
            except Exception as e:
                partial_info = {"action": "NONE", "error": str(e)}

        action = "HOLD"
        if price <= t.stop:
            action = "STOP_LOSS"
        elif t.tp_mode == "fixed" and price >= t.target:
            action = "TAKE_PROFIT"
        elif t.size_remaining_pct <= 0.02:
            action = "TAKE_PROFIT"
            t.size_remaining_pct = 0.0
        elif partial_info.get("action") == "PARTIAL_TP":
            action = "PARTIAL_TP"
        elif price >= t.target and t.tp_mode != "fixed":
            action = "TAKE_PROFIT"

        self.save()
        return {
            "action": action,
            "ticket_id": t.id,
            "price": price,
            "stop": t.stop,
            "target": t.target,
            "hwm": t.hwm,
            "trail_active": t.trail_active,
            "strategy": t.strategy,
            "tp_mode": t.tp_mode,
            "size_remaining_pct": t.size_remaining_pct,
            "realized_pnl_usd": round(t.realized_pnl_usd, 6),
            "partial": partial_info,
        }

    def close_trade(
        self,
        *,
        exit_price: float,
        post_balance_usd: float,
        tx_close: str = "",
        forced_outcome: Optional[str] = None,
    ) -> dict[str, Any]:
        t = self.open_ticket
        if not t:
            return {"ok": False, "error": "no open ticket"}

        remaining = max(0.0, min(1.0, t.size_remaining_pct))
        gross_pct = (exit_price - t.entry) / t.entry if t.entry else 0.0
        net_pct_rem = self.cfg.fee.net_from_gross(gross_pct, t.notional_usd * max(remaining, 0.01))
        pnl_remaining = t.notional_usd * remaining * net_pct_rem
        total_pnl = t.realized_pnl_usd + pnl_remaining
        net_pct = total_pnl / t.notional_usd if t.notional_usd else 0.0

        if forced_outcome:
            outcome = TradeOutcome(forced_outcome)
        elif net_pct >= self.cfg.target_net_pct * 0.88:
        elif remaining < 0.98 and total_pnl > 0:
            outcome = TradeOutcome.PARTIAL if remaining > 0.02 else TradeOutcome.WIN
        elif net_pct >= self.cfg.target_net_pct * 0.9:
            outcome = TradeOutcome.WIN
        elif net_pct <= -self.cfg.stop_loss_pct * 0.88:
            outcome = TradeOutcome.LOSS
        elif abs(net_pct) < 0.002:
            outcome = TradeOutcome.BREAKEVEN
        else:
            outcome = TradeOutcome.WIN if net_pct > 0 else TradeOutcome.LOSS

        t.status = "CLOSED"
        t.exit_price = exit_price
        t.net_pct = round(net_pct, 6)
        t.outcome = outcome.value
        t.tx_close = tx_close
        t.post_balance_usd = post_balance_usd
        t.size_remaining_pct = 0.0

        self.streak.total_trades += 1
        self.streak.last_outcome = outcome.value
        self.streak.last_trade_id = t.id

        if outcome == TradeOutcome.WIN or (outcome == TradeOutcome.PARTIAL and total_pnl > 0):
            self.streak.wins += 1
            self.streak.consecutive_wins += 1
            self.streak.consecutive_losses = 0
            compound_add = pnl_usd * self.cfg.base_compound_fraction
            surplus_add = pnl_usd * self.cfg.surplus_fraction
            self.streak.compound_equity_usd += compound_add
            self.streak.yield_sleeve_usd += max(0.0, surplus_add)
            if pnl_remaining > 0:
                self.streak.compound_equity_usd += pnl_remaining * self.cfg.base_compound_fraction
                self.streak.yield_sleeve_usd += pnl_remaining * self.cfg.surplus_fraction
            self.streak.cooldown_until = time.time() + self.cfg.cooldown_sec_after_win
        elif outcome == TradeOutcome.LOSS:
            self.streak.losses += 1
            self.streak.consecutive_losses += 1
            self.streak.consecutive_wins = 0
            self.streak.compound_equity_usd += pnl_usd
            self.streak.compound_equity_usd += pnl_remaining
            self.streak.cooldown_until = time.time() + self.cfg.cooldown_sec_after_loss
        else:
            self.streak.consecutive_wins = 0
            self.streak.cooldown_until = time.time() + self.cfg.cooldown_sec_after_win

        eq = self.streak.compound_equity_usd + self.streak.yield_sleeve_usd
        self.streak.peak_equity_usd = max(self.streak.peak_equity_usd, eq)

        if self.streak.consecutive_losses >= self.cfg.max_consecutive_losses:
            self.streak.halted = True
            self.streak.halt_reason = "max consecutive losses"
            self.phase = Phase.HALTED
        else:
            self.phase = (
                Phase.SURPLUS
                if outcome in (TradeOutcome.WIN, TradeOutcome.PARTIAL) and total_pnl > 0
                else Phase.COOLDOWN
            )

        self.append_ticket_history(t)
        closed = t.to_dict()
        self.open_ticket = None
        self.save()

        return {
            "ok": True,
            "outcome": outcome.value,
            "net_pct": t.net_pct,
            "pnl_usd": round(pnl_usd, 4),
            "surplus_usd": round(pnl_usd * self.cfg.surplus_fraction, 4) if outcome == TradeOutcome.WIN else 0.0,
            "strategy": t.strategy,
            "pnl_usd": round(total_pnl, 4),
            "pnl_remaining_usd": round(pnl_remaining, 4),
            "realized_partials_usd": round(closed.get("realized_pnl_usd", 0), 4),
            "surplus_usd": round(max(0.0, total_pnl) * self.cfg.surplus_fraction, 4),
            "streak": self.streak.to_dict(),
            "ticket": closed,
        }

    def projected_equity(self, start_usd: float, remaining_wins: Optional[int] = None) -> float:
        w = remaining_wins if remaining_wins is not None else max(0, self.cfg.goal_trades - self.streak.wins)
        r = 1 + self.cfg.target_net_pct * self.cfg.base_compound_fraction
        return start_usd * (r**w)

    def health(self) -> dict[str, Any]:
        return {
            "phase": self.phase.value,
            "tp_mode": self.cfg.tp_mode,
            "streak": self.streak.to_dict(),
            "open": self.open_ticket.to_dict() if self.open_ticket else None,
            "can_open": self.can_open(),
            "win_rate": (
                round(self.streak.wins / self.streak.total_trades, 4)
                if self.streak.total_trades
                else None
            ),
            "progress_trades": f"{self.streak.wins + self.streak.losses}/{self.cfg.goal_trades}",
        }


if __name__ == "__main__":
    c = CompoundCircuit(CircuitConfig(tp_mode="log"))
    print(json.dumps(c.health(), indent=2))
    t = c.open_trade(
        token="WEGLD-bd4d79",
        entry=10.0,
        deployable_usd=100.0,
        pre_balance_usd=100.0,
    )
    print("opened", t.id if t else None, "tp_mode", t.tp_mode if t else None)
    if t:
        for px in (10.05, 10.12, 10.25, 10.40):
            print(px, c.on_tick(px))
        print(c.close_trade(exit_price=10.40, post_balance_usd=101.0))
