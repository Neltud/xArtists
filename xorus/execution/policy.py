"""Hard, fail-closed input policy for OneDex-assisted (unsigned) swaps.

This policy does NOT authorize autonomous execution. Token identifiers must be
verified and explicitly allowlisted before production use; ticker-only entries
are temporary beta conveniences, not on-chain asset verification.
"""
from __future__ import annotations

import re
from decimal import Decimal, InvalidOperation

from xorus.execution.types import PolicyDecision, SwapIntent


# Exactly matched symbols only. Do not accept token-id prefixes: anyone can
# issue a token whose identifier starts with "USDC-" or another trusted symbol.
# Production should replace symbols with independently verified full IDs.
ALLOWED_TOKENS: set[str] = {"EGLD", "WEGLD", "ONE", "USDC", "USDT", "WETH"}

MAX_AMOUNT_IN: dict[str, Decimal] = {
    "EGLD": Decimal("2"),
    "WEGLD": Decimal("2"),
    "ONE": Decimal("50000"),
    "USDC": Decimal("500"),
    "USDT": Decimal("500"),
    "WETH": Decimal("0.5"),
}
MAX_SLIPPAGE_BPS: int = 300

# Future autonomous budget, NOT ENFORCED here. No autonomous execution exists.
DAILY_BUDGET_USD: float = 0.0

# Public MultiversX addresses use bech32 (erd1 + 58 charset characters).
# This is a syntax check, not checksum/on-chain ownership proof.
_PUBLIC_ADDRESS = re.compile(r"erd1[023456789acdefghjklmnpqrstuvwxyz]{58}")


def check_intent(intent: SwapIntent) -> PolicyDecision:
    """Reject invalid or ambiguous intents before any network call."""
    if not isinstance(intent.token_in, str) or not isinstance(intent.token_out, str):
        return PolicyDecision(False, "token identifier must be a string")
    token_in = intent.token_in.strip().upper()
    token_out = intent.token_out.strip().upper()

    if token_in not in ALLOWED_TOKENS or token_out not in ALLOWED_TOKENS:
        return PolicyDecision(False, "tokens must match explicit ALLOWED_TOKENS entries")
    if token_in == token_out:
        return PolicyDecision(False, "token_in and token_out must differ")

    if (isinstance(intent.max_slippage_bps, bool)
            or not isinstance(intent.max_slippage_bps, int)
            or not 0 <= intent.max_slippage_bps <= MAX_SLIPPAGE_BPS):
        return PolicyDecision(False, "max_slippage_bps outside permitted range")

    if not isinstance(intent.amount_in, str):
        return PolicyDecision(False, "amount_in must be a decimal string")
    try:
        amount = Decimal(intent.amount_in.strip())
    except (InvalidOperation, ValueError):
        return PolicyDecision(False, "invalid amount_in")
    if not amount.is_finite() or amount <= 0:
        return PolicyDecision(False, "amount_in must be finite and positive")
    max_amount = MAX_AMOUNT_IN.get(token_in)
    if max_amount is None or amount > max_amount:
        return PolicyDecision(False, f"amount_in exceeds MAX_AMOUNT_IN for {token_in}")

    if not isinstance(intent.sender, str) or not _PUBLIC_ADDRESS.fullmatch(intent.sender):
        return PolicyDecision(False, "sender must be a syntactically valid public erd1 address")

    return PolicyDecision(
        True, "ok",
        limits_applied={
            "max_slippage_bps": MAX_SLIPPAGE_BPS,
            "max_amount": str(max_amount),
            "allowed_tokens": sorted(ALLOWED_TOKENS),
            "autonomous_execution": False,
        },
    )
