"""Anti compound-death-spiral + leverage caps (Guardian before Brain).

Live Solana perps 10x–20x are reject-by-default. MVX micro + RWA escrow
only proceed when guardian_gate.allow is True.
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class GuardianVerdict:
    allow: bool
    reason: str
    max_notional: float
    spiral_score: float
    effective_leverage: float


@dataclass(frozen=True)
class PolicyLimits:
    """Defaults tuned for paper + future live micro (not high-leverage SOL)."""

    L_max: float = 1.5
    L_soft: float = 1.0
    S_max: float = 0.35
    W_max: int = 3
    equity_floor_usd: float = 50.0
    # Hard policy: live SOL perps leverage above this is forbidden
    sol_live_lev_max: float = 1.5
    sol_high_lev_paper_only: float = 10.0


def spiral_score(
    lev: float,
    ret_roe: float,
    drawdown: float,
    compound_intensity: float,
) -> float:
    """Score feedback risk when sizing scales with wins under leverage.

    compound_intensity ∈ [0, 1]: fraction of profits re-risked.
    """
    intensity = max(0.0, min(1.0, compound_intensity))
    lev = max(0.0, lev)
    upside = max(0.0, ret_roe) * intensity * lev
    downside = max(0.0, -drawdown) * 2.0 * lev
    return upside + downside


def sol_perps_allowed(
    *,
    live: bool,
    requested_leverage: float,
    policy: PolicyLimits | None = None,
) -> GuardianVerdict:
    """SOL perps: live high leverage always blocked; paper may simulate."""
    p = policy or PolicyLimits()
    lev = max(0.0, requested_leverage)
    if live and lev > p.sol_live_lev_max:
        return GuardianVerdict(
            allow=False,
            reason="sol_live_leverage_cap",
            max_notional=0.0,
            spiral_score=lev,
            effective_leverage=lev,
        )
    if (not live) and lev >= p.sol_high_lev_paper_only:
        # Paper OK but tagged — caller must not promote to live without policy change
        return GuardianVerdict(
            allow=True,
            reason="sol_paper_high_lev_ok",
            max_notional=0.0,
            spiral_score=0.0,
            effective_leverage=lev,
        )
    return GuardianVerdict(
        allow=True,
        reason="ok",
        max_notional=0.0,
        spiral_score=0.0,
        effective_leverage=lev,
    )


def guardian_gate(
    *,
    equity: float,
    notional: float,
    ret_roe: float,
    drawdown: float,
    compound_intensity: float,
    consecutive_wins: int = 0,
    mode: str = "COMPOUND",
    policy: PolicyLimits | None = None,
) -> GuardianVerdict:
    """Primary gate before size increase, compound, or RWA allocation from PnL."""
    p = policy or PolicyLimits()
    mode_u = (mode or "").upper()

    if mode_u in ("DEFENSE", "RISK_OFF"):
        return GuardianVerdict(
            False, "defense_mode", 0.0, 0.0, 0.0
        )

    if equity < p.equity_floor_usd:
        return GuardianVerdict(
            False, "equity_floor", 0.0, 0.0, 0.0
        )

    lev = notional / max(equity, 1e-9)
    if lev > p.L_max:
        return GuardianVerdict(
            False,
            "leverage_cap",
            equity * p.L_max,
            spiral_score(lev, ret_roe, drawdown, compound_intensity),
            lev,
        )

    s = spiral_score(lev, ret_roe, drawdown, compound_intensity)
    if s >= p.S_max:
        return GuardianVerdict(
            False, "spiral_score", equity * p.L_soft, s, lev
        )

    if lev > p.L_soft and consecutive_wins >= p.W_max:
        return GuardianVerdict(
            False, "win_streak_under_leverage", equity * p.L_soft, s, lev
        )

    cap_lev = p.L_soft if compound_intensity > 0.5 else p.L_max
    max_n = equity * min(p.L_max, cap_lev)
    return GuardianVerdict(True, "ok", max_n, s, lev)
