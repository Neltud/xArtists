"""Structured paper intents for the public command bar.

EUR catalogue and EGLD chain snapshots are different adapters.
Neither adapter executes. Sales stay suspended.
Adversarial or live-trading phrasing is refused before any pack match.
"""
from __future__ import annotations

import re
from typing import Any


PACKS: dict[str, dict[str, str | int]] = {
    "pulse": {"name": "Pulse", "tier": "Gold", "eur": "110", "edition_cap": 333, "snapshot_egld": "1"},
    "yield": {"name": "Yield", "tier": "Silver", "eur": "75", "edition_cap": 500, "snapshot_egld": "5"},
    "sentinel": {"name": "Sentinel", "tier": "Platinum", "eur": "50", "edition_cap": 777, "snapshot_egld": "2.5"},
}
SNAPSHOT_AS_OF = "2026-11-08"
POSTURE: dict[str, Any] = {
    "probed_at": "2026-11-09T06:45:00Z",
    "source": "api.multiversx.com",
    "epoch": 2288,
    "rounds_passed": 79101,
    "rounds_per_epoch": 144000,
    "refresh_rate_ms": 600,
    "egld_usd": "2.96",
    "egld_market_cap_usd": "92171100",
    "egld_apr": "0.091141",
    "tro_id": "TRO-94c925",
    "tro_supply": "476224",
    "tro_accounts": 557,
    "tro_transactions": 2820,
    "site": "public",
    "trading": "suspended",
    "pack_sales": "suspended",
    "paybox": "fail-closed",
    "kr_review_window": "2026-11-16/2026-11-20",
    "allow_live_trading": False,
}

_REFUSE = re.compile(
    r"ignore\s+(all\s+)?(rules|gates|instructions|previous)"
    r"|go[\s-]*live"
    r"|live\s+trading"
    r"|broadcast"
    r"|claim\s*fees"
    r"|paybox[_\s-]*prod"
    r"|\bpem\b"
    r"|mnemonic"
    r"|private\s+key"
    r"|lia_live_trading\s*=\s*1"
    r"|sign\s+and\s+send"
    r"|\b(swap|bridge|stake)\b",
    re.IGNORECASE,
)
_PACK = re.compile(r"\b(pulse|yield|sentinel)\b", re.IGNORECASE)
_BUY = re.compile(r"\b(buy|achat|acheter|achete|achète|pack)\b", re.IGNORECASE)
_EUR = re.compile(r"(euro|eur|€|carte|fiat)", re.IGNORECASE)
_EGLD = re.compile(r"\begld\b", re.IGNORECASE)
_STATUS = re.compile(r"(statut|status|epoch|prix)", re.IGNORECASE)
_DISCOVERY = re.compile(r"(musée|musee|museum|galerie|gallery|visite)", re.IGNORECASE)


def _freeze_public(result: dict[str, Any]) -> dict[str, Any]:
    result["executable"] = False
    result["live_authorized"] = False
    return result


def quote_buy_pack(pack_id: str, rail: str) -> dict[str, Any]:
    pack = PACKS.get(pack_id)
    if pack is None:
        return _freeze_public({"intent": "UNKNOWN", "reason": "unknown_pack"})
    if rail not in {"EUR", "EGLD"}:
        rail = "UNSPECIFIED"
    return _freeze_public({
        "intent": "BUY_PACK",
        "pack": pack_id,
        "name": pack["name"],
        "tier": pack["tier"],
        "rail": rail,
        "catalogue_eur": pack["eur"] if rail == "EUR" else None,
        "snapshot_egld": pack["snapshot_egld"] if rail == "EGLD" else None,
        "snapshot_as_of": SNAPSHOT_AS_OF,
        "snapshot_is_executable_quote": False,
        "edition_cap": pack["edition_cap"],
        "sales": "suspended",
        "media_uri_verified": False,
        "paybox": "fail-closed",
        "reason": "sales_suspended",
    })


def classify_utterance(text: str) -> dict[str, Any]:
    raw = (text or "").strip()
    if not raw:
        return _freeze_public({"intent": "EMPTY", "reason": "empty"})
    if _REFUSE.search(raw):
        return _freeze_public({"intent": "REFUSE", "reason": "adversarial_or_live_request"})
    pack_match = _PACK.search(raw)
    if pack_match and _BUY.search(raw):
        rail = "EUR" if _EUR.search(raw) else "EGLD" if _EGLD.search(raw) else "UNSPECIFIED"
        return quote_buy_pack(pack_match.group(1).lower(), rail)
    if _STATUS.search(raw):
        return _freeze_public({"intent": "STATUS", "reason": "read_only_posture", "posture": dict(POSTURE)})
    if _DISCOVERY.search(raw):
        return _freeze_public({"intent": "DISCOVERY", "reason": "public_navigation"})
    return _freeze_public({"intent": "UNKNOWN", "reason": "unrecognised"})
