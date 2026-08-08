"""Unit tests — run: python -m lia.guardian.test_spiral"""
from __future__ import annotations

from lia.guardian.spiral import (
    PolicyLimits,
    guardian_gate,
    sol_perps_allowed,
    spiral_score,
)


def test_spiral_increases_with_leverage_and_compound():
    low = spiral_score(1.0, 0.1, 0.0, 0.5)
    high = spiral_score(3.0, 0.1, 0.0, 1.0)
    assert high > low


def test_defense_blocks():
    v = guardian_gate(
        equity=1000,
        notional=500,
        ret_roe=0.05,
        drawdown=0.0,
        compound_intensity=0.0,
        mode="DEFENSE",
    )
    assert not v.allow and v.reason == "defense_mode"


def test_equity_floor():
    v = guardian_gate(
        equity=10,
        notional=5,
        ret_roe=0.0,
        drawdown=0.0,
        compound_intensity=0.0,
    )
    assert not v.allow and v.reason == "equity_floor"


def test_leverage_cap():
    v = guardian_gate(
        equity=100,
        notional=400,
        ret_roe=0.0,
        drawdown=0.0,
        compound_intensity=0.0,
        policy=PolicyLimits(L_max=1.5),
    )
    assert not v.allow and v.reason == "leverage_cap"


def test_spiral_score_block():
    v = guardian_gate(
        equity=100,
        notional=140,
        ret_roe=0.25,
        drawdown=0.0,
        compound_intensity=1.0,
        policy=PolicyLimits(L_max=2.0, S_max=0.2),
    )
    assert not v.allow and v.reason == "spiral_score"


def test_win_streak_under_lev():
    v = guardian_gate(
        equity=100,
        notional=120,
        ret_roe=0.02,
        drawdown=0.0,
        compound_intensity=0.2,
        consecutive_wins=5,
        policy=PolicyLimits(L_max=2.0, L_soft=1.0, W_max=3, S_max=0.99),
    )
    assert not v.allow and v.reason == "win_streak_under_leverage"


def test_ok_path():
    v = guardian_gate(
        equity=1000,
        notional=800,
        ret_roe=0.02,
        drawdown=0.01,
        compound_intensity=0.2,
        consecutive_wins=1,
    )
    assert v.allow and v.reason == "ok" and v.max_notional > 0


def test_sol_live_high_lev_blocked():
    v = sol_perps_allowed(live=True, requested_leverage=15.0)
    assert not v.allow and v.reason == "sol_live_leverage_cap"


def test_sol_paper_high_lev_tagged():
    v = sol_perps_allowed(live=False, requested_leverage=15.0)
    assert v.allow and v.reason == "sol_paper_high_lev_ok"


def main() -> None:
    tests = [
        test_spiral_increases_with_leverage_and_compound,
        test_defense_blocks,
        test_equity_floor,
        test_leverage_cap,
        test_spiral_score_block,
        test_win_streak_under_lev,
        test_ok_path,
        test_sol_live_high_lev_blocked,
        test_sol_paper_high_lev_tagged,
    ]
    for t in tests:
        t()
        print("OK", t.__name__)
    print(f"{len(tests)}/{len(tests)} passed")


if __name__ == "__main__":
    main()
