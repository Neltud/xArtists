"""
Beta allowlist + caps for LIA live micro path.
Not a free multi-ESDT mandate — closed set only.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import FrozenSet

# --- Allowlist (exactly these rails) ---
EGLD_NATIVE = "EGLD"
USDC_MX = "USDC-c76f1f"
TRO_MX = "TRO-94c925"

ALLOWED_TOKENS: FrozenSet[str] = frozenset(
    {
        EGLD_NATIVE,
        USDC_MX.upper(),
        TRO_MX.upper(),
        "USDC-C76F1F",
        "TRO-94C925",
    }
)

# Canonical display forms
ALLOWLIST_CANONICAL = (EGLD_NATIVE, USDC_MX, TRO_MX)

# --- Caps ---
MAX_TRADE_USD = 15.0
MAX_DAILY_USD = 40.0
MAX_TRADES_PER_DAY = 3
MAX_MICRO_EGLD = 0.001
MIN_WALLET_EGLD_RESERVE = 0.05
MAX_TRADE_EQUITY_FRAC = 0.01  # 1% of equity if computed


@dataclass(frozen=True)
class GateResult:
    ok: bool
    reason: str


def normalize_token(token: str) -> str:
    t = (token or "").strip()
    if t.upper() in ("EGLD", "WEGLD", "WEGLD-BD4D79"):
        # Beta: native EGLD only for micro-proof; WEGLD treated as not in allowlist unless added later
        if t.upper() == "EGLD":
            return EGLD_NATIVE
    return t


def is_token_allowed(token: str) -> bool:
    t = normalize_token(token)
    if t == EGLD_NATIVE:
        return True
    return t.upper() in {x.upper() for x in ALLOWED_TOKENS}


def assert_token_allowed(token: str) -> GateResult:
    if is_token_allowed(token):
        return GateResult(True, "allowlist_ok")
    return GateResult(False, f"token_not_in_beta_allowlist:{token}")


def assert_trade_caps(
    *,
    size_usd: float,
    trades_today: int,
    daily_notional_usd: float,
    wallet_egld: float | None = None,
) -> GateResult:
    if size_usd <= 0:
        return GateResult(False, "size_usd_non_positive")
    if size_usd > MAX_TRADE_USD:
        return GateResult(False, f"size_usd_gt_max_{MAX_TRADE_USD}")
    if trades_today >= MAX_TRADES_PER_DAY:
        return GateResult(False, f"trades_today_ge_{MAX_TRADES_PER_DAY}")
    if daily_notional_usd + size_usd > MAX_DAILY_USD:
        return GateResult(False, f"daily_notional_gt_{MAX_DAILY_USD}")
    if wallet_egld is not None and wallet_egld < MIN_WALLET_EGLD_RESERVE:
        return GateResult(False, f"wallet_egld_below_reserve_{MIN_WALLET_EGLD_RESERVE}")
    return GateResult(True, "caps_ok")


def assert_micro_egld(amount_egld: float) -> GateResult:
    if amount_egld <= 0:
        return GateResult(False, "micro_egld_non_positive")
    if amount_egld > MAX_MICRO_EGLD:
        return GateResult(False, f"micro_egld_gt_{MAX_MICRO_EGLD}")
    return GateResult(True, "micro_egld_ok")


def beta_preflight(
    *,
    token: str,
    size_usd: float = 0.0,
    trades_today: int = 0,
    daily_notional_usd: float = 0.0,
    wallet_egld: float | None = None,
    micro_egld: float | None = None,
) -> GateResult:
    """Combine allowlist + caps for a Beta action."""
    a = assert_token_allowed(token)
    if not a.ok:
        return a
    if micro_egld is not None:
        m = assert_micro_egld(micro_egld)
        if not m.ok:
            return m
    if size_usd > 0:
        c = assert_trade_caps(
            size_usd=size_usd,
            trades_today=trades_today,
            daily_notional_usd=daily_notional_usd,
            wallet_egld=wallet_egld,
        )
        if not c.ok:
            return c
    return GateResult(True, "beta_preflight_ok")
