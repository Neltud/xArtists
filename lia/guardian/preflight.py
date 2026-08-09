"""
PreFlightValidator — Guardian gate before any risk notional (FAST PATH).
VaR + fractional Kelly + kill-switch. Prefer deny/resize over allow when unsure.
"""
from __future__ import annotations

import os
import time
from dataclasses import dataclass
from enum import Enum
from typing import Optional

LIVE = os.getenv("LIA_LIVE_TRADING", "0") == "1"


class KillState(str, Enum):
    ARMED = "ARMED"
    TRIPPED = "TRIPPED"
    KILLED = "KILLED"


class KillReason(str, Enum):
    NONE = "NONE"
    DRAWDOWN = "DRAWDOWN"
    EQUITY_FLOOR = "EQUITY_FLOOR"
    LOSS_STREAK = "LOSS_STREAK"
    MANUAL = "MANUAL"
    VAR = "VAR"


@dataclass
class KillSwitch:
    state: KillState = KillState.ARMED
    reason: KillReason = KillReason.NONE
    detail: str = ""

    def trip(self, reason: KillReason, detail: str = "", hard: bool = False) -> None:
        self.reason = reason
        self.detail = detail
        self.state = KillState.KILLED if hard else KillState.TRIPPED

    def reset(self) -> None:
        self.state = KillState.ARMED
        self.reason = KillReason.NONE
        self.detail = ""


def parametric_var(notional: float, vol: float, z: float = 1.65, leverage: float = 1.0) -> float:
    return abs(notional) * abs(vol) * z * max(leverage, 1.0)


def kelly_fraction(p: float, b: float, fraction: float = 0.25) -> float:
    p = max(0.0, min(1.0, p))
    if b <= 0:
        return 0.0
    f = (p * (b + 1.0) - 1.0) / b
    return max(0.0, f * fraction)


def position_size_usd(
    equity: float,
    p: float,
    b: float = 1.5,
    max_pct: float = 0.2,
    stop_pct: float = 0.01,
) -> float:
    f = kelly_fraction(p, b)
    by_kelly = equity * f
    by_stop = equity * max_pct
    if stop_pct > 0:
        by_stop = min(by_stop, equity * 0.01 / stop_pct * 0.25)
    return max(0.0, min(by_kelly, by_stop, equity * max_pct))


@dataclass
class ProposedOrder:
    side: str
    symbol: str
    notional_usd: float
    signal_confidence: float = 0.5
    signal_edge: float = 1.5
    live: bool = False
    chain: str = "mvx"
    leverage: float = 1.0


@dataclass
class PortfolioSnapshot:
    equity_usd: float = 100.0
    drawdown: float = 0.0
    consecutive_wins: int = 0
    consecutive_losses: int = 0
    realized_vol: float = 0.02
    compound_intensity: float = 0.4
    mode: str = "COMPOUND"
    floor_usd: float = 1.0


@dataclass
class PreFlightResult:
    allow: bool
    action: str
    notional_usd: float
    reason: str
    kelly_f: float = 0.0
    var_usd: float = 0.0
    kill_state: str = KillState.ARMED.value
    latency_hint_ms: float = 0.0


@dataclass
class PreFlightConfig:
    max_dd: float = 0.12
    var_limit_pct: float = 0.03
    max_live_leverage: float = 1.5
    loss_streak_kill: int = 8


class PreFlightValidator:
    def __init__(self, config: Optional[PreFlightConfig] = None, kill: Optional[KillSwitch] = None):
        self.config = config or PreFlightConfig()
        self.kill = kill or KillSwitch()

    def validate(self, order: ProposedOrder, book: PortfolioSnapshot) -> PreFlightResult:
        t0 = time.perf_counter()
        cfg = self.config

        if self.kill.state in (KillState.TRIPPED, KillState.KILLED):
            return self._res(
                False, "KILL", 0.0, f"kill_switch:{self.kill.reason.value}", t0, kill=self.kill.state.value
            )

        if book.equity_usd < book.floor_usd:
            self.kill.trip(KillReason.EQUITY_FLOOR, "below floor", hard=True)
            return self._res(False, "KILL", 0.0, "equity_floor", t0, kill=self.kill.state.value)

        if abs(book.drawdown) >= cfg.max_dd:
            self.kill.trip(KillReason.DRAWDOWN, f"dd={book.drawdown}")
            return self._res(False, "KILL", 0.0, "drawdown", t0, kill=self.kill.state.value)

        if book.consecutive_losses >= cfg.loss_streak_kill:
            self.kill.trip(KillReason.LOSS_STREAK, str(book.consecutive_losses))
            return self._res(False, "BLOCK", 0.0, "loss_streak", t0, kill=self.kill.state.value)

        if book.mode.upper() == "DEFENSE":
            return self._res(False, "BLOCK", 0.0, "defense_mode", t0)

        if order.live or LIVE:
            if order.chain in ("sol", "hl", "hyperliquid") and order.leverage > cfg.max_live_leverage:
                return self._res(False, "BLOCK", 0.0, "leverage_cap", t0)

        p = max(0.5, min(0.9, order.signal_confidence))
        kf = kelly_fraction(p, max(0.5, order.signal_edge))
        sized = position_size_usd(book.equity_usd, p, max(0.5, order.signal_edge))
        notional = min(order.notional_usd, sized, book.equity_usd * 0.2)
        if notional <= 0:
            return self._res(False, "BLOCK", 0.0, "size_zero", t0, kelly_f=kf)

        var = parametric_var(notional, book.realized_vol or 0.02, leverage=order.leverage)
        var_limit = book.equity_usd * cfg.var_limit_pct
        action = "ALLOW"
        reason = "ok"
        if var > var_limit and var_limit > 0:
            scale = var_limit / var
            notional *= scale
            action = "RESIZE"
            reason = "var_cap"
            var = parametric_var(notional, book.realized_vol or 0.02, leverage=order.leverage)

        if notional < 1.0:
            return self._res(False, "BLOCK", 0.0, "dust_after_resize", t0, kelly_f=kf, var_usd=var)

        return self._res(
            True, action, round(notional, 4), reason, t0, kelly_f=kf, var_usd=var, kill=self.kill.state.value
        )

    def _res(
        self,
        allow: bool,
        action: str,
        notional: float,
        reason: str,
        t0: float,
        *,
        kelly_f: float = 0.0,
        var_usd: float = 0.0,
        kill: str = "ARMED",
    ) -> PreFlightResult:
        return PreFlightResult(
            allow=allow,
            action=action,
            notional_usd=notional,
            reason=reason,
            kelly_f=kelly_f,
            var_usd=var_usd,
            kill_state=kill,
            latency_hint_ms=round((time.perf_counter() - t0) * 1000, 4),
        )
