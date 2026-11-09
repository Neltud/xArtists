"""Durable paper mandate ledger.

Issues a signed, single-use authorization and refuses a second consume.
This module never authorizes a chain broadcast, a Paybox charge, or LIA Ops.
`live_authorized` is stripped on issue and consume always returns executable=False.
"""
from __future__ import annotations

import hashlib
import hmac
import json
from typing import Any


SIGNED_FIELDS = (
    "mandate_id",
    "subject",
    "scope",
    "asset",
    "max_amount",
    "currency",
    "nonce",
    "issued_at",
    "expires_at",
)
SCOPES = frozenset({"BUY_PACK", "STATUS", "DISCOVERY"})


def _canonical(mandate: dict[str, Any]) -> bytes:
    body = {key: mandate[key] for key in SIGNED_FIELDS}
    return json.dumps(body, sort_keys=True, separators=(",", ":")).encode("utf-8")


def _sign(secret: bytes, mandate: dict[str, Any]) -> str:
    return hmac.new(secret, _canonical(mandate), hashlib.sha256).hexdigest()


class MandateLedger:
    def __init__(self, secret: bytes) -> None:
        if not isinstance(secret, (bytes, bytearray)) or len(secret) < 8:
            raise ValueError("mandate secret must be at least 8 bytes")
        self._secret = bytes(secret)
        self._open: dict[str, dict[str, Any]] = {}
        self._used: set[str] = set()

    def issue(
        self,
        *,
        mandate_id: str,
        subject: str,
        scope: str,
        asset: str,
        max_amount: str,
        currency: str,
        nonce: str,
        issued_at: int,
        ttl_seconds: int,
    ) -> dict[str, Any]:
        if scope not in SCOPES:
            raise ValueError("scope is not paper-allowed")
        if not isinstance(issued_at, int) or not isinstance(ttl_seconds, int):
            raise ValueError("timestamps must be integers")
        if ttl_seconds <= 0 or ttl_seconds > 900:
            raise ValueError("ttl must be 1..900 seconds")
        if not mandate_id or not nonce or not subject:
            raise ValueError("mandate_id, subject and nonce are required")
        mandate: dict[str, Any] = {
            "mandate_id": str(mandate_id),
            "subject": str(subject),
            "scope": scope,
            "asset": str(asset),
            "max_amount": str(max_amount),
            "currency": str(currency),
            "nonce": str(nonce),
            "issued_at": issued_at,
            "expires_at": issued_at + ttl_seconds,
            "paper": True,
            "live_authorized": False,
        }
        mandate["signature"] = _sign(self._secret, mandate)
        self._open[mandate["mandate_id"]] = dict(mandate)
        return dict(mandate)

    def consume(self, presented: dict[str, Any], *, now: int) -> dict[str, Any]:
        mandate_id = str(presented.get("mandate_id") or "")
        base = {
            "mandate_id": mandate_id,
            "executable": False,
            "live_authorized": False,
            "paper": True,
        }
        stored = self._open.get(mandate_id)
        if stored is None and mandate_id in self._used:
            return {**base, "status": "REPLAY"}
        if stored is None:
            return {**base, "status": "UNKNOWN"}
        if mandate_id in self._used:
            return {**base, "status": "REPLAY"}
        expected = _sign(self._secret, stored)
        given = str(presented.get("signature") or "")
        signed_ok = hmac.compare_digest(expected, given)
        # Any mutation of a signed field, or a forged live flag, fails closed.
        tampered = any(presented.get(key) != stored.get(key) for key in SIGNED_FIELDS)
        if presented.get("live_authorized") is True or presented.get("paper") is False:
            tampered = True
        if (not signed_ok) or tampered or given != stored.get("signature"):
            return {**base, "status": "BAD_SIGNATURE"}
        if not isinstance(now, int) or now >= int(stored["expires_at"]):
            return {**base, "status": "EXPIRED"}
        self._used.add(mandate_id)
        self._open.pop(mandate_id, None)
        return {**base, "status": "PAPER_CONSUMED", "scope": stored["scope"], "asset": stored["asset"]}
