"""Hard policy gates for OneDex execution under xOrus.

All limits are code-enforced. The model proposes; policy decides.
"""
from __future__ import annotations

from typing import Any

from xorus.execution.types import PolicyDecision, SwapIntent


# --- Hard limits (tune in one place) -----------------------------------------

# Tokens the agent is allowed to touch (ticker or full identifier).
# Empty set = refuse everything until configured.
ALLOWED_TOKENS: set[str] = {
    "EGLD",
    "WEGLD",
    "ONE",
    "USDC",
    "USDT",
    "WETH",
    # add verified tickers only
}

# Maximum input amount per trade (human units, approximate).
# Keyed by token ticker (upper). Use conservative values.
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
    t = token.strip().upper()
    if "-" in t:  # identifier like ONE-f9954f → keep as-is for matching
        return t
    return t


def check_intent(intent: SwapIntent) -> PolicyDecision:
    """Return whether this intent is allowed under current hard limits."""
    tin = _normalize(intent.token_in)
    tout = _normalize(intent.token_out)

    # 1. Token allowlist
    allowed_tickers = {_normalize(t) for t in ALLOWED_TOKENS}
    # Accept either exact ticker or identifier that starts with an allowed ticker
    def is_allowed(tok: str) -> bool:
        if tok in allowed_tickers:
            return True
        base = tok.split("-")[0]
        return base in allowed_tickers

    if not is_allowed(tin):
        return PolicyDecision(False, f"token_in '{intent.token_in}' not in ALLOWED_TOKENS")
    if not is_allowed(tout):
        return PolicyDecision(False, f"token_out '{intent.token_out}' not in ALLOWED_TOKENS")

    # 2. Slippage
    if intent.max_slippage_bps > MAX_SLIPPAGE_BPS:
        return PolicyDecision(
            False,
            f"max_slippage_bps {intent.max_slippage_bps} exceeds hard limit {MAX_SLIPPAGE_BPS}",
        )

    # 3. Amount
    try:
        amount = float(intent.amount_in)
    except (TypeError, ValueError):
        return PolicyDecision(False, f"invalid amount_in: {intent.amount_in!r}")

    if amount <= 0:
        return PolicyDecision(False, "amount_in must be > 0")

    # Resolve max for this token (try base ticker)
    base = tin.split("-")[0]
    max_amt = MAX_AMOUNT_IN.get(base) or MAX_AMOUNT_IN.get(tin)
    if max_amt is not None and amount > max_amt:
        return PolicyDecision(
            False,
            f"amount_in {amount} exceeds MAX_AMOUNT_IN for {base} ({max_amt})",
        )

    # 4. Sender must look like a public MultiversX address
    if not intent.sender.startswith("erd1") or len(intent.sender) < 62:
        return PolicyDecision(False, "sender must be a valid public erd1… address")

    return PolicyDecision(
        True,
        "ok",
        limits_applied={
            "max_slippage_bps": MAX_SLIPPAGE_BPS,
            "max_amount": max_amt,
            "allowed_tokens": sorted(ALLOWED_TOKENS),
        },
    )
