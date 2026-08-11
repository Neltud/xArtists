"""
PreFlightValidator — Guardian gate before any risk notional (FAST PATH).
Guardian BEFORE Brain. VaR + fractional Kelly + kill-switch + death-spiral.
Prefer deny/resize over allow when unsure. No I/O in validate().

Kill-switch: ARMED --trip(soft)--> TRIPPED --trip(hard)--> KILLED
Reset: via KillResetCircuit (request → confirm) — never auto on live.
"""
from __future__ import annotations

import os
import time
from dataclasses import dataclass
from enum import Enum
from typing import Optional

from lia.guardian.math_core import (
    death_spiral_detected,
    kelly_fraction,
    parametric_var,
    position_size_usd,
    spiral_score,
)

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
    DEATH_SPIRAL = "DEATH_SPIRAL"
    LEVERAGE = "LEVERAGE"


@dataclass
class KillSwitch:
    state: KillState = KillState.ARMED
    reason: KillReason = KillReason.NONE
    detail: str = ""
    tripped_at: float = 0.0

    def trip(self, reason: KillReason, detail: str = "", hard: bool = False) -> None:
        self.reason = reason
        self.detail = detail
        self.tripped_at = time.time()
        self.state = KillState.KILLED if hard else KillState.TRIPPED

    def reset(self) -> None:
        """Raw arm — prefer confirm_kill_reset / KillResetCircuit."""
        self.state = KillState.ARMED
        self.reason = KillReason.NONE
        self.detail = ""
        self.tripped_at = 0.0


@dataclass
class PreFlightConfig:
    max_dd: float = 0.12
    equity_floor_usd: float = 1.0
    loss_streak_kill: int = 5
    var_limit_pct: float = 0.02
    max_live_leverage: float = 1.5
    max_pct: float = 0.20
    s_max: float = 0.35
    l_soft: float = 1.0
    w_max: int = 3


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
    size_increasing: bool = False


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
    ret_roe: float = 0.0


@dataclass
class PreFlightResult:
    allow: bool
    action: str
    notional_usd: float
    reason: str
    kelly_f: float = 0.0
    var_usd: float = 0.0
    spiral: float = 0.0
    kill_state: str = "ARMED"
    latency_hint_ms: float = 0.0


class PreFlightValidator:
    """O(1) pure math validator. Instantiate once per process; reuse kill state."""

    def __init__(self, cfg: Optional[PreFlightConfig] = None) -> None:
        self.cfg = cfg or PreFlightConfig()
        self.kill = KillSwitch()

    def validate(self, order: ProposedOrder, book: PortfolioSnapshot) -> PreFlightResult:
        t0 = time.perf_counter()
        cfg = self.cfg

        if self.kill.state == KillState.KILLED:
            return self._res(False, "KILL", 0.0, f"killed:{self.kill.reason.value}", t0)

        if self.kill.state == KillState.TRIPPED:
            return self._res(False, "BLOCK", 0.0, f"tripped:{self.kill.reason.value}", t0)

        floor = max(cfg.equity_floor_usd, book.floor_usd)
        if book.equity_usd < floor:
            self.kill.trip(KillReason.EQUITY_FLOOR, f"eq={book.equity_usd}", hard=True)
            return self._res(False, "KILL", 0.0, "equity_floor", t0)

        if abs(book.drawdown) >= cfg.max_dd:
            self.kill.trip(KillReason.DRAWDOWN, f"dd={book.drawdown}", hard=True)
            return self._res(False, "KILL", 0.0, "drawdown", t0)

        if book.consecutive_losses >= cfg.loss_streak_kill:
            self.kill.trip(KillReason.LOSS_STREAK, str(book.consecutive_losses))
            return self._res(False, "BLOCK", 0.0, "loss_streak", t0)

        if book.mode.upper() in ("DEFENSE", "RISK_OFF"):
            return self._res(False, "BLOCK", 0.0, "defense_mode", t0)

        if order.live or LIVE:
            if order.chain in ("sol", "hl", "hyperliquid", "solana") and order.leverage > cfg.max_live_leverage:
                self.kill.trip(KillReason.LEVERAGE, f"L={order.leverage}")
                return self._res(False, "BLOCK", 0.0, "leverage_cap", t0)

        lev_req = order.notional_usd / max(book.equity_usd, 1e-9)
        s = spiral_score(lev_req, book.ret_roe, book.drawdown, book.compound_intensity)
        ds, ds_reason = death_spiral_detected(
            lev=lev_req,
            spiral=s,
            consecutive_wins=book.consecutive_wins,
            compound_intensity=book.compound_intensity,
            size_increasing=order.size_increasing,
            s_max=cfg.s_max,
            l_soft=cfg.l_soft,
            w_max=cfg.w_max,
        )
        if ds:
            self.kill.trip(KillReason.DEATH_SPIRAL, ds_reason)
            return self._res(False, "KILL", 0.0, ds_reason, t0, spiral=s)

        p = max(0.5, min(0.9, order.signal_confidence))
        kf = kelly_fraction(p, max(0.5, order.signal_edge))
        sized = position_size_usd(
            book.equity_usd, p, max(0.5, order.signal_edge), max_pct=cfg.max_pct
        )
        notional = min(order.notional_usd, sized, book.equity_usd * cfg.max_pct)
        if notional <= 0:
            return self._res(False, "BLOCK", 0.0, "size_zero", t0, kelly_f=kf, spiral=s)

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
            return self._res(False, "BLOCK", 0.0, "dust_after_resize", t0, kelly_f=kf, var_usd=var, spiral=s)

        return self._res(
            True, action, round(notional, 4), reason, t0, kelly_f=kf, var_usd=var, spiral=s
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
        spiral: float = 0.0,
        kill: Optional[str] = None,
    ) -> PreFlightResult:
        return PreFlightResult(
            allow=allow,
            action=action,
            notional_usd=notional,
            reason=reason,
            kelly_f=kelly_f,
            var_usd=var_usd,
            spiral=spiral,
            kill_state=kill or self.kill.state.value,
            latency_hint_ms=round((time.perf_counter() - t0) * 1000, 4),
        )

    def request_kill_reset(self, operator_id: str, note: str = ""):
        """Step 1 for hard kills. Returns ResetResult."""
        from lia.guardian.kill_reset import KillResetCircuit

        if not hasattr(self, "_reset_circuit"):
            self._reset_circuit = KillResetCircuit()
        return self._reset_circuit.request_reset(
            operator_id=operator_id,
            state=self.kill.state.value,
            reason=self.kill.reason.value,
            tripped_at=self.kill.tripped_at,
            note=note,
        )

    def confirm_kill_reset(
        self,
        operator_id: str,
        post_mortem_ref: str = "",
        token: str = "",
    ):
        """Step 2 — if authorized, arms the switch. Returns ResetResult."""
        from lia.guardian.kill_reset import KillResetCircuit, apply_reset_to_kill_switch

        if not hasattr(self, "_reset_circuit"):
            self._reset_circuit = KillResetCircuit()
        result = self._reset_circuit.confirm_reset(
            operator_id=operator_id,
            state=self.kill.state.value,
            reason=self.kill.reason.value,
            tripped_at=self.kill.tripped_at,
            post_mortem_ref=post_mortem_ref,
            token=token,
        )
        apply_reset_to_kill_switch(self.kill, result)
        return result


# re-export math helpers for tests
from lia.guardian.math_core import kelly_fraction as kelly_fraction  # noqa: E402
from lia.guardian.math_core import parametric_var as parametric_var  # noqa: E402
