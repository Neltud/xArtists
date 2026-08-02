"""
LIA Compound Engine — Circuit financier professionnel
====================================================
Objectif: enchaîner N trades à +1 % NET compounding.

Math:
  capital_n = capital_0 * (1.01) ** wins_net
  (1.01)^1000 ≈ 20_959×  — théorique ; réaliste = winrate × fees × liquidité

Règles dures:
  1. Stop-loss obligatoire à -1 % net (ou trailing plus serré une fois en profit)
  2. Take-profit cible +1 % NET après frais (DEX + gas + slippage)
  3. Surplus au-delà de la base compounding → yield (stake / LP / Hatom) — jamais TRO hold
  4. Vérification on-chain avant et après chaque exécution
  5. Streak persisté (wins / losses / cooldown)

Stratégies acceptées (metadata):
  - STATARB (pairs / z-score) — edge prioritaire
  - ARB, MR, MOM, UNIVERSAL_BRAIN, etc.

Accumulate: EGLD, WEGLD, WBTC, USDC uniquement.
TRO récupéré → redistribute (pool/stake/rewards/burn).
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
    WIN = "WIN"          # >= +1% net
    LOSS = "LOSS"        # hit -1% SL
    BREAKEVEN = "BE"     # fees ate the edge
    PARTIAL = "PARTIAL"  # partial TP then exit
    SKIP = "SKIP"
    ERROR = "ERROR"


@dataclass
class FeeModel:
    dex_fee_roundtrip: float = 0.006   # 0.3% * 2 hops
    gas_usd: float = 0.05
    max_slippage: float = 0.003        # 0.3%
    safety_buffer: float = 0.002       # 0.2%

    def required_gross_pct(self, notional_usd: float) -> float:
        """Gross move needed so that NET ≈ target after fees."""
        gas_pct = self.gas_usd / max(notional_usd, 0.01)
        return self.dex_fee_roundtrip + gas_pct + self.max_slippage + self.safety_buffer

    def net_from_gross(self, gross_pct: float, notional_usd: float) -> float:
        return gross_pct - self.required_gross_pct(notional_usd)


@dataclass
class CircuitConfig:
    target_net_pct: float = 0.01          # +1% net per win
    stop_loss_pct: float = 0.01           # -1% mandatory
    be_trigger_pct: float = 0.005         # move SL to BE after +0.5%
    trail_after_pct: float = 0.008        # start trailing after +0.8%
    trail_pct: float = 0.004              # trail 0.4% under HWM once active
    max_concurrent: int = 1               # serial for compounding purity
    risk_per_trade_pct: float = 0.02      # 2% of deployable capital at risk
    min_notional_usd: float = 5.0
    max_notional_usd: float = 500.0
    base_compound_fraction: float = 0.70  # 70% stays in compound loop
    surplus_fraction: float = 0.30        # 30% of profit → yield sleeve
    max_consecutive_losses: int = 3
    cooldown_sec_after_loss: int = 900
    cooldown_sec_after_win: int = 60
    goal_trades: int = 1000
    # StatArb may target a slightly flexible net band when z is extreme
    statarb_min_net_pct: float = 0.008
    statarb_max_net_pct: float = 0.015
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
    side: str  # LONG only for v1 circuit
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
    strategy: str = ""          # e.g. STATARB, MR, MOM
    meta: Optional[dict] = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


class CompoundCircuit:
    """
    Orchestrates the professional loop:
      SIGNAL → DECIDE → PRE_VERIFY → EXECUTE → POST_VERIFY → SETTLE → SURPLUS → (loop)
    Accepts any strategy including STATARB (metadata on ticket).
    """

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

    # ---------- persistence ----------
    def load(self) -> None:
        try:
            raw = json.loads(self.state_path.read_text(encoding="utf-8"))
            self.streak = StreakState.from_dict(raw.get("streak", raw))
            if raw.get("open_ticket"):
                ot = raw["open_ticket"]
                # backward-compat: strategy/meta may be absent
                ot.setdefault("strategy", "")
                ot.setdefault("meta", None)
                self.open_ticket = TradeTicket(**ot)
            self.phase = Phase(raw.get("phase", Phase.IDLE.value))
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

    # ---------- sizing ----------
    def size_notional(self, deployable_usd: float) -> float:
        risk_budget = deployable_usd * self.cfg.risk_per_trade_pct
        notional = risk_budget / max(self.cfg.stop_loss_pct, 0.001)
        notional = max(self.cfg.min_notional_usd, min(self.cfg.max_notional_usd, notional))
        notional = min(notional, deployable_usd * 0.25)
        return round(notional, 4)

    def levels(
        self,
        entry: float,
        notional_usd: float,
        strategy: str = "",
        z_abs: float = 0.0,
    ) -> tuple[float, float, float]:
        """Return (stop, target, gross_required). LONG only.

        For STATARB with extreme |z|, allow a slightly wider target band
        while still respecting fee-adjusted net floor.
        """
        target_net = self.cfg.target_net_pct
        if strategy == "STATARB" and z_abs >= 2.5:
            target_net = min(self.cfg.statarb_max_net_pct, target_net + 0.003)
        elif strategy == "STATARB":
            target_net = max(self.cfg.statarb_min_net_pct, target_net)

        gross = self.cfg.fee.required_gross_pct(notional_usd) + target_net
        stop = entry * (1 - self.cfg.stop_loss_pct)
        target = entry * (1 + gross)
        return stop, target, gross

    # ---------- guards ----------
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

    # ---------- lifecycle ----------
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
    ) -> Optional[TradeTicket]:
        ok, reason = self.can_open()
        if not ok:
            self.phase = Phase.COOLDOWN if reason == "COOLDOWN" else Phase.HALTED
            self.save()
            return None

        notional = self.size_notional(deployable_usd)
        if notional < self.cfg.min_notional_usd:
            return None

        z_abs = 0.0
        if meta and isinstance(meta.get("z"), (int, float)):
            z_abs = abs(float(meta["z"]))

        stop, target, gross = self.levels(entry, notional, strategy=strategy, z_abs=z_abs)
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
        )
        self.open_ticket = ticket
        self.phase = Phase.EXECUTE
        self.save()
        return ticket

    def on_tick(self, price: float) -> dict[str, Any]:
        """Update stops / detect TP or SL. Call every cycle."""
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

        action = "HOLD"
        if price <= t.stop:
            action = "STOP_LOSS"
        elif price >= t.target:
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

        gross_pct = (exit_price - t.entry) / t.entry
        net_pct = self.cfg.fee.net_from_gross(gross_pct, t.notional_usd)

        if forced_outcome:
            outcome = TradeOutcome(forced_outcome)
        elif net_pct >= self.cfg.target_net_pct * 0.9:
            outcome = TradeOutcome.WIN
        elif net_pct <= -self.cfg.stop_loss_pct * 0.9:
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

        self.streak.total_trades += 1
        self.streak.last_outcome = outcome.value
        self.streak.last_trade_id = t.id

        pnl_usd = t.notional_usd * net_pct
        if outcome == TradeOutcome.WIN:
            self.streak.wins += 1
            self.streak.consecutive_wins += 1
            self.streak.consecutive_losses = 0
            compound_add = pnl_usd * self.cfg.base_compound_fraction
            surplus_add = pnl_usd * self.cfg.surplus_fraction
            self.streak.compound_equity_usd += compound_add
            self.streak.yield_sleeve_usd += max(0.0, surplus_add)
            self.streak.cooldown_until = time.time() + self.cfg.cooldown_sec_after_win
        elif outcome == TradeOutcome.LOSS:
            self.streak.losses += 1
            self.streak.consecutive_losses += 1
            self.streak.consecutive_wins = 0
            self.streak.compound_equity_usd += pnl_usd
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
            self.phase = Phase.SURPLUS if outcome == TradeOutcome.WIN else Phase.COOLDOWN

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
            "streak": self.streak.to_dict(),
            "ticket": closed,
        }

    def projected_equity(self, start_usd: float, remaining_wins: Optional[int] = None) -> float:
        w = remaining_wins if remaining_wins is not None else max(0, self.cfg.goal_trades - self.streak.wins)
        r = 1 + self.cfg.target_net_pct * self.cfg.base_compound_fraction
        return start_usd * (r ** w)

    def health(self) -> dict[str, Any]:
        return {
            "phase": self.phase.value,
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
    c = CompoundCircuit()
    print(json.dumps(c.health(), indent=2))
    t = c.open_trade(
        token="WEGLD-bd4d79",
        entry=10.0,
        deployable_usd=100.0,
        pre_balance_usd=100.0,
        strategy="STATARB",
        meta={"z": -2.4},
    )
    print("opened", t.id if t else None)
    if t:
        print(c.on_tick(10.12))
        print(c.close_trade(exit_price=10.12, post_balance_usd=101.0))
