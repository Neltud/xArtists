"""Unit tests — PreFlightValidator (FAST PATH)."""
from __future__ import annotations

from lia.guardian.preflight import (
    KillState,
    KillReason,
    PortfolioSnapshot,
    PreFlightValidator,
    ProposedOrder,
    kelly_fraction,
    parametric_var,
)
from lia.guardian.math_core import death_spiral_detected, spiral_score


def test_kelly_and_var_math() -> None:
    assert kelly_fraction(0.55, 2.0) > 0
    assert kelly_fraction(0.4, 1.0) == 0.0
    assert parametric_var(10_000, 0.02) > 0


def test_allow_happy_path() -> None:
    v = PreFlightValidator()
    r = v.validate(
        ProposedOrder(side="BUY", symbol="WEGLD", notional_usd=50, leverage=1.0,
                      signal_confidence=0.6, signal_edge=1.5, live=False),
        PortfolioSnapshot(equity_usd=200, realized_vol=0.015, mode="COMPOUND"),
    )
    assert r.allow and r.action in ("ALLOW", "RESIZE")
    assert r.latency_hint_ms < 10.0


def test_kill_on_drawdown() -> None:
    v = PreFlightValidator()
    r = v.validate(
        ProposedOrder(side="BUY", symbol="WEGLD", notional_usd=50, live=False),
        PortfolioSnapshot(equity_usd=200, drawdown=-0.15),
    )
    assert not r.allow and r.action == "KILL"
    assert v.kill.state == KillState.KILLED


def test_sol_live_high_lev_blocked() -> None:
    v = PreFlightValidator()
    r = v.validate(
        ProposedOrder(side="BUY", symbol="SOL-PERP", notional_usd=100, leverage=10.0,
                      live=True, chain="sol", signal_confidence=0.7, signal_edge=2.0),
        PortfolioSnapshot(equity_usd=500, realized_vol=0.02),
    )
    assert not r.allow and r.reason == "leverage_cap"


def test_death_spiral_kills() -> None:
    v = PreFlightValidator()
    r = v.validate(
        ProposedOrder(side="BUY", symbol="WEGLD", notional_usd=400, leverage=2.0,
                      live=False, size_increasing=True, signal_confidence=0.7, signal_edge=2.0),
        PortfolioSnapshot(equity_usd=200, consecutive_wins=4, compound_intensity=0.9,
                          ret_roe=0.2, drawdown=0.0, mode="COMPOUND"),
    )
    assert not r.allow and r.action == "KILL"
    assert v.kill.reason == KillReason.DEATH_SPIRAL


def test_death_spiral_math_unit() -> None:
    s = spiral_score(2.0, 0.1, 0.0, 1.0)
    ds, _ = death_spiral_detected(
        lev=2.0, spiral=s, consecutive_wins=4, compound_intensity=0.9, size_increasing=True
    )
    assert ds


def test_defense_blocks() -> None:
    v = PreFlightValidator()
    r = v.validate(
        ProposedOrder(side="BUY", symbol="WEGLD", notional_usd=10),
        PortfolioSnapshot(equity_usd=100, mode="DEFENSE"),
    )
    assert not r.allow and r.reason == "defense_mode"


def test_latency_budget() -> None:
    v = PreFlightValidator()
    book = PortfolioSnapshot(equity_usd=1000, realized_vol=0.02)
    order = ProposedOrder(side="BUY", symbol="X", notional_usd=50, signal_confidence=0.6)
    for _ in range(100):
        r = v.validate(order, book)
    assert r.latency_hint_ms < 5.0
