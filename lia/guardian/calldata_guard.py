"""
Parse MultiversX tx data before sign — block NFT/SFT transfers (CRITICAL).
"""
from __future__ import annotations

from typing import Any

# Fungible allowlist (exact identifiers)
ALLOWED_FUNGIBLE = frozenset(
    {
        "EGLD",
        "WEGLD-BD4D79",
        "USDC-C76F1F",
        "TRO-94C925",
    }
)

NFT_HINTS = ("NFT", "SFT", "META")


def _hex_to_str(h: str) -> str:
    h = h.strip()
    if len(h) % 2:
        h = "0" + h
    try:
        return bytes.fromhex(h).decode("utf-8", errors="replace")
    except Exception:
        return ""


def inspect_tx_data(data: str | None) -> dict[str, Any]:
    """
    Returns {ok, reason, tokens[], is_nft_risk, function}.
    Empty data (plain EGLD transfer) → ok.
    """
    raw = (data or "").strip()
    if not raw:
        return {"ok": True, "reason": "native_egld", "tokens": [], "is_nft_risk": False, "function": ""}

    # plain ASCII function e.g. wrapEgld
    if "@" not in raw and raw.isascii() and raw.isalnum():
        return {"ok": True, "reason": "plain_function", "tokens": [], "is_nft_risk": False, "function": raw}

    parts = raw.split("@")
    head = parts[0]
    # head may be ASCII function or empty for ESDT
    func = head if head and not all(c in "0123456789abcdefABCDEF" for c in head) else _hex_to_str(head) or head

    upper_func = (func or "").upper()
    # Explicit NFT multi-transfer endpoints
    if any(
        x in upper_func
        for x in (
            "ESDTNFTTRANSFER",
            "MULTIEXDTNFTTRANSFER",
            "MULTIESDTNFTTRANSFER",
            "ESDTNFTCREATE",
            "ESDTNFTADDQUANTITY",
        )
    ):
        return {
            "ok": False,
            "reason": "NFT_ENDPOINT_BLOCKED",
            "tokens": [],
            "is_nft_risk": True,
            "function": func,
        }

    tokens: list[str] = []
    # ESDTTransfer@token_hex@amount_hex@...
    if upper_func in ("ESDTTRANSFER", "ESDTNFTTRANSFER", "") or raw.upper().startswith("ESDTTRANSFER"):
        if len(parts) >= 2:
            tok = _hex_to_str(parts[1]) or parts[1]
            tokens.append(tok)

    for tok in tokens:
        t = tok.upper()
        if any(h in t for h in NFT_HINTS) and t not in ALLOWED_FUNGIBLE:
            return {
                "ok": False,
                "reason": f"NFT_TOKEN_HINT:{tok}",
                "tokens": tokens,
                "is_nft_risk": True,
                "function": func,
            }
        # MultiversX NFT collections often TOKEN-xxxxxx with transfer of nonce —
        # fungible allowlist miss → block unknown ESDT not in allowlist for autonomous path
        if t and t not in ALLOWED_FUNGIBLE and "-" in t:
            # allow only known fungibles; unknown collection id = reject in autonomous mode
            return {
                "ok": False,
                "reason": f"TOKEN_NOT_ALLOWLISTED:{tok}",
                "tokens": tokens,
                "is_nft_risk": True,
                "function": func,
            }

    return {
        "ok": True,
        "reason": "pass",
        "tokens": tokens,
        "is_nft_risk": False,
        "function": func,
    }
