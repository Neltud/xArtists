"""Hard agent constraints — LIA trades tokens only, never NFTs/RWA physical."""
from __future__ import annotations

from typing import Any

ALLOWED_TOKEN_TYPES = frozenset({"EGLD", "ESDT", "WEGLD", "STABLE", "TOKEN"})
FORBIDDEN_ASSET_TYPES = frozenset({"NFT", "SFT", "META_ESDT_NFT", "RWA_PHYSICAL", "RWA_NFT"})


def assert_tradable_asset(
    *,
    target_asset_type: str | None = None,
    token_id: str | None = None,
) -> dict[str, Any]:
    t = (target_asset_type or "TOKEN").upper().strip()
    if t in FORBIDDEN_ASSET_TYPES or t.endswith("_NFT"):
        return {
            "ok": False,
            "action": "ABORT_TRADE",
            "reason": "Agent restricted from holding NFTs",
            "target_asset_type": t,
        }
    # Heuristic: MultiversX NFT ids often contain "-" with nonce path — still allow TRO/USDC/WEGLD
    tid = (token_id or "").upper()
    if tid and any(x in tid for x in ("NFT", "SFT")) and not tid.startswith(("TRO", "USDC", "WEGLD")):
        return {
            "ok": False,
            "action": "ABORT_TRADE",
            "reason": "Agent restricted from holding NFTs",
            "token_id": token_id,
        }
    return {"ok": True, "action": "ALLOW", "target_asset_type": t}


def filter_intent(intent: dict[str, Any]) -> dict[str, Any]:
    check = assert_tradable_asset(
        target_asset_type=str(intent.get("asset_type") or intent.get("target_asset_type") or "TOKEN"),
        token_id=str(intent.get("token") or intent.get("token_id") or ""),
    )
    if not check["ok"]:
        return {**intent, "status": "ABORTED", "abort": check}
    return intent
