"""ESDT / plain transfer data builders."""
from __future__ import annotations


def _token_hex(token_id: str) -> str:
    return token_id.encode("ascii").hex()


def _amount_hex(amount_atomic: int) -> str:
    if amount_atomic < 0:
        raise ValueError("amount_atomic must be >= 0")
    h = format(int(amount_atomic), "x")
    return h if len(h) % 2 == 0 else "0" + h


def build_esdt_transfer(token_id: str, amount_atomic: int) -> str:
    """
    ESDTTransfer@token@amount — TX receiver = destination wallet/SC.
    amount_atomic is the raw integer (e.g. 1e18 = 1 token with 18 decimals).
    """
    return f"ESDTTransfer@{_token_hex(token_id)}@{_amount_hex(amount_atomic)}"


def build_egld_transfer_data() -> str:
    """Empty data for native EGLD transfer (value field carries amount)."""
    return ""
