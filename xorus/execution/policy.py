"""Hard policy gates for OneDex execution under xOrus.

All limits are code-enforced. The model proposes; policy decides.
Strict allowlist + numeric hygiene (audit 2026-11-17).
"""
from __future__ import annotations

import math
from typing import Any

from xorus.execution.types import PolicyDecision, SwapIntent


# --- Hard limits (tune in one place) -----------------------------------------

# Tokens the agent is allowed to touch.
# Exact ticker OR exact full MultiversX identifier only.
# Empty set = refuse everything until configured.
ALLOWED_TOKENS: set[str] = {
    "EGLD",
    "WEGLD",
    "ONE",
    "USDC",
    "USDT",
    "WETH",
    # add verified tickers or full identifiers only, e.g. "ONE-f9954f"
}

# Maximum input amount per trade (human units, approximate).
# Keyed by exact ticker (upper) or base of identifier.
MAX_AMOUNT_IN: dict[str, float] = {
    "EGLD": 2.0,
    "WEGLD": 2.0,
    "ONE": 50_000.0,
    "USDC": 500.0,
    "USDT": 500.0,
    "WETH": 0.5,
}

# Max slippage in basis points (100 = 1%).
MAX_SLIPPAGE_BPS: int = 300  # 3% hard ceiling for assisted mode

# Daily notional budget in USD (rough). 0 = disabled.
DAILY_BUDGET_USD: float = 1_000.0


def _normalize(token: str) -> str:
    return (token or "").strip().upper()


def _is_allowed_token(tok: str, allowed: set[str]) -> bool:
    """Strict: exact match only (ticker or full identifier). No prefix wildcards."""
    if not tok:
        return False
    if tok in allowed:
        return True
    # Full identifier listed exactly (e.g. ONE-F9954F in allowlist)
    return False


def _parse_amount(raw: Any) -> float | None:
    """Reject non-finite, non-positive, or non-numeric amounts."""
    if raw is None:
        return None
    if isinstance(raw, bool):
        return None
    try:
        if isinstance(raw, str):
            s = raw.strip().replace(",", "")
            if not s or s.lower() in ("nan", "inf", "+inf", "-inf"):
                return None
            amount = float(s)
        else:
            amount = float(raw)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(amount) or amount <= 0:
        return None
    return amount


def check_intent(intent: SwapIntent) -> PolicyDecision:
    """Return whether this intent is allowed under current hard limits."""
    tin = _normalize(intent.token_in)
    tout = _normalize(intent.token_out)

    allowed = {_normalize(t) for t in ALLOWED_TOKENS}

    if not _is_allowed_token(tin, allowed):
        return PolicyDecision(
            False,
            f"token_in '{intent.token_in}' not in ALLOWED_TOKENS (exact match required)",
        )
    if not _is_allowed_token(tout, allowed):
        return PolicyDecision(
            False,
            f"token_out '{intent.token_out}' not in ALLOWED_TOKENS (exact match required)",
        )

    if intent.max_slippage_bps is not None and intent.max_slippage_bps > MAX_SLIPPAGE_BPS:
        return PolicyDecision(
            False,
            f"max_slippage_bps {intent.max_slippage_bps} exceeds hard limit {MAX_SLIPPAGE_BPS}",
        )

    amount = _parse_amount(intent.amount_in)
    if amount is None:
        return PolicyDecision(
            False,
            f"invalid amount_in: {intent.amount_in!r} (must be finite number > 0)",
        )

    # Resolve max: prefer exact token key, else base of identifier (EGLD from EGLD-...)
    base = tin.split("-")[0]
    max_amt = MAX_AMOUNT_IN.get(tin) or MAX_AMOUNT_IN.get(base)
    if max_amt is not None and amount > max_amt:
        return PolicyDecision(
            False,
            f"amount_in {amount} exceeds MAX_AMOUNT_IN for {base} ({max_amt})",
        )

    sender = (intent.sender or "").strip()
    if not sender.startswith("erd1") or len(sender) < 62:
        return PolicyDecision(False, "sender must be a valid public erd1… address")

    return PolicyDecision(
        True,
        "ok",
        limits_applied={
            "max_slippage_bps": MAX_SLIPPAGE_BPS,
            "max_amount": max_amt,
            "allowed_tokens": sorted(ALLOWED_TOKENS),
            "match_mode": "exact",
        },
    )
