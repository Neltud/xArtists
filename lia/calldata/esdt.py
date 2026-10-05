"""ESDT / plain transfer data builders — uses precision normalizer."""
from __future__ import annotations

from lia.utils.precision import normalize_for_token


def _token_hex(token_id: str) -> str:
    return token_id.encode("ascii").hex()


def _amount_hex(amount_atomic: int) -> str:
    if amount_atomic < 0:
        raise ValueError("amount_atomic must be >= 0")
    h = format(int(amount_atomic), "x")
    return h if len(h) % 2 == 0 else "0" + h


def build_esdt_transfer(token_id: str, amount_atomic: int) -> str:
    """ESDTTransfer@token@amount — TX receiver = destination."""
    return f"ESDTTransfer@{_token_hex(token_id)}@{_amount_hex(amount_atomic)}"


def build_esdt_transfer_human(token_id: str, amount: float) -> str:
    """Human amount → atomic via token decimals, then ESDTTransfer."""
    atomic = normalize_for_token(amount, token_id)
    return build_esdt_transfer(token_id, atomic)


def build_egld_transfer_data() -> str:
    return ""
