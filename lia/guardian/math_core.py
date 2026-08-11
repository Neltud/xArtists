"""
Guardian FAST PATH — pure math (no I/O, no LLM).
Target: full validate path << 10 ms.

VaR = |N| * σ * z * L  (z=1.65)
Kelly f* = (p(b+1)-1)/b ; f = max(0, κ*f*)  κ=0.25
Spiral S = max(0,r_roe)*I*L + 2*max(0,-DD)*L
Death spiral: S≥S_max OR (L>L_soft AND wins≥W_max AND I≥0.5) OR auto_compound_loop
"""
from __future__ import annotations

from typing import Tuple

Z_95 = 1.65
KAPPA = 0.25
S_MAX = 0.35
L_MAX = 1.5
L_SOFT = 1.0
W_MAX = 3
I_MIN = 0.5
MAX_PCT = 0.20
VAR_LIMIT_PCT = 0.02


def parametric_var(notional: float, vol: float, z: float = Z_95, leverage: float = 1.0) -> float:
    return abs(notional) * abs(vol) * z * max(leverage, 1.0)


def kelly_fraction(p: float, b: float, fraction: float = KAPPA) -> float:
    p = 0.0 if p < 0.0 else (1.0 if p > 1.0 else p)
    if b <= 0.0:
        return 0.0
    f_star = (p * (b + 1.0) - 1.0) / b
    return max(0.0, f_star * fraction)


def position_size_usd(
    equity: float,
    p: float,
    b: float = 1.5,
    max_pct: float = MAX_PCT,
    stop_pct: float = 0.01,
) -> float:
    if equity <= 0:
        return 0.0
    f = kelly_fraction(p, b)
    by_kelly = equity * f
    by_cap = equity * max_pct
    by_stop = by_cap
    if stop_pct > 0:
        by_stop = min(by_cap, equity * 0.01 / stop_pct * 0.25)
    return max(0.0, min(by_kelly, by_stop, by_cap))


def spiral_score(
    lev: float,
    ret_roe: float,
    drawdown: float,
    compound_intensity: float,
) -> float:
    intensity = 0.0 if compound_intensity < 0 else (1.0 if compound_intensity > 1 else compound_intensity)
    lev = max(0.0, lev)
    upside = max(0.0, ret_roe) * intensity * lev
    downside = max(0.0, -drawdown) * 2.0 * lev
    return upside + downside


def death_spiral_detected(
    *,
    lev: float,
    spiral: float,
    consecutive_wins: int,
    compound_intensity: float,
    size_increasing: bool = False,
    s_max: float = S_MAX,
    l_soft: float = L_SOFT,
    w_max: int = W_MAX,
    i_min: float = I_MIN,
) -> Tuple[bool, str]:
    if spiral >= s_max:
        return True, "spiral_score"
    if lev > l_soft and consecutive_wins >= w_max and compound_intensity >= i_min:
        return True, "win_streak_under_leverage"
    if size_increasing and lev > l_soft and consecutive_wins >= 2 and compound_intensity >= i_min:
        return True, "auto_compound_loop"
    return False, ""
