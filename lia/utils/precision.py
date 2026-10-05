"""
Universal decimal normalizer — used by sizing + calldata.
Prevents ESDT amount bugs (e.g. TRO=6 vs EGLD=18).
"""
from __future__ import annotations

from typing import Mapping

# Known mainnet / protocol tokens
_DECIMALS: dict[str, int] = {
    "EGLD": 18,
    "WEGLD-BD4D79": 18,
    "WEGLD-bd4d79": 18,
    "USDC-C76F1F": 6,
    "USDC-c76f1f": 6,
    "TRO-94C925": 6,
    "TRO-94c925": 6,
}


def token_decimals(token_id: str, *, default: int = 18) -> int:
    t = (token_id or "").strip()
    if t.upper() == "EGLD":
        return 18
    if t in _DECIMALS:
        return _DECIMALS[t]
    up = t.upper()
    for k, v in _DECIMALS.items():
        if k.upper() == up:
            return v
    return default


def normalize_for_token(
    amount: float,
    token_decimals_or_id: int | str,
    *,
    round_mode: str = "down",
) -> int:
    """
    Convert human amount → atomic integer for chain.
    round_mode: down (safe for spends) | nearest
    """
    if isinstance(token_decimals_or_id, str):
        dec = token_decimals(token_decimals_or_id)
    else:
        dec = int(token_decimals_or_id)
    if dec < 0 or dec > 18:
        raise ValueError(f"invalid decimals {dec}")
    scale = 10**dec
    raw = float(amount) * scale
    if round_mode == "nearest":
        atomic = int(round(raw))
    else:
        atomic = int(raw)  # floor toward zero for positive amounts
    if atomic < 0:
        raise ValueError("negative atomic amount")
    return atomic


def atomic_to_human(atomic: int, token_id: str) -> float:
    dec = token_decimals(token_id)
    return int(atomic) / (10**dec)


def register_decimals(mapping: Mapping[str, int]) -> None:
    for k, v in mapping.items():
        _DECIMALS[str(k)] = int(v)
