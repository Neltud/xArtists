"""Unit tests — PreFlightValidator (FAST PATH)."""
from __future__ import annotations

import time
from lia.guardian.preflight import (
    KillState,
    KillSwitch,
    KillReason,
    PortfolioSnapshot,
    PreFlightValidator,
    ProposedOrder,
    kelly_fraction,
    parametric_var,
)


def test_kelly_and_var_math() -> None:
    assert kelly_fraction(0.55, 2.0) > 0
    assert kelly_fraction(0.4, 1.0) == 0.0
    v = parametric_var(10_000, 0.02)
    assert v > 0


def test_allow_happy_path() -> None:
    v = PreFlightValidator()
    r = v.validate(
        ProposedOrder(
            side="BUY",
            symbol="WEGLD",
            notional_usd=50,
            leverage=1.0,
            signal_confidence=0.6,
            signal_edge=1.5,
            live=False,
        ),
        PortfolioSnapshot(equity_usd=200, realized_vol=0.015, mode="COMPOUND"),
    )
    assert r.allow
    assert r.action in ("ALLOW", "RESIZE")
    assert r.latency_hint_ms < 10.0


def test_kill_on_drawdown() -> None:
    v = PreFlightValidator()
    r = v.validate(
        ProposedOrder(side="BUY", symbol="WEGLD", notional_usd=50, live=False),
        PortfolioSnapshot(equity_usd=200, drawdown=-0.15),
    )
    assert not r.allow
    assert r.action == "KILL"
    assert v.kill.state == KillState.KILLED


def test_sol_live_high_lev_killed() -> None:
    v = PreFlightValidator()
    r = v.validate(
        ProposedOrder(
            side="BUY",
            symbol="SOL-PERP",
            notional_usd=100,
            leverage=15.0,
            chain="sol",
            live=True,
            signal_confidence=0.9,
            signal_edge=2.0,
        ),
        PortfolioSnapshot(equity_usd=500),
    )
    assert not r.allow
    assert "sol" in r.reason or r.action == "KILL"


def test_ops_reset_path() -> None:
    kill = KillSwitch()
    kill.trip(KillReason.DRAWDOWN, hard=True)
    assert kill.state == KillState.KILLED
    kill.reset()
    assert kill.state == KillState.RESET_PENDING
    v = PreFlightValidator(kill=kill)
    r = v.validate(
        ProposedOrder(
            side="BUY",
            symbol="WEGLD",
            notional_usd=40,
            signal_confidence=0.7,
            signal_edge=1.5,
        ),
        PortfolioSnapshot(equity_usd=300, realized_vol=0.01),
    )
    assert r.allow
    assert kill.state == KillState.ARMED


def test_latency_budget() -> None:
    v = PreFlightValidator()
    book = PortfolioSnapshot(equity_usd=1000, realized_vol=0.02)
    order = ProposedOrder(
        side="BUY",
        symbol="WEGLD",
        notional_usd=100,
        signal_confidence=0.55,
        signal_edge=1.2,
    )
    t0 = time.perf_counter()
    for _ in range(200):
        v.validate(order, book)
    elapsed_ms = (time.perf_counter() - t0) * 1000
    assert elapsed_ms < 2000


if __name__ == "__main__":
    test_kelly_and_var_math()
    test_allow_happy_path()
    test_kill_on_drawdown()
    test_sol_live_high_lev_killed()
    test_ops_reset_path()
    test_latency_budget()
    print("preflight tests OK")
