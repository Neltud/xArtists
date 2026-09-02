"""
Fiat on-ramp (pay by card) → then buy NFT or $TRO on MultiversX.

Providers (config-driven, no secrets in repo):
  - MoonPay (widget / API)
  - xMoney (MultiversX ecosystem payments — configure when merchant IDs ready)
  - Generic redirect URL template

Flow:
  1. User chooses product: nft_listing | tro_amount | agent_pack
  2. create_onramp_session → redirect URL (MoonPay etc.)
  3. Webhook / return URL confirms fiat settlement (backend)
  4. Ops or automated buyer wallet completes on-chain buy (EGLD/USDC)

This module builds session intents only. API keys: Vellum / backend env.
"""
from __future__ import annotations

import json
import os
import time
import uuid
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Optional
from urllib.parse import urlencode

_ROOT = Path(__file__).resolve().parents[2]
SESSIONS = _ROOT / "data" / "fiat_onramp_sessions.json"

PROVIDERS = ("moonpay", "xmoney", "manual")


@dataclass
class OnrampIntent:
    session_id: str
    provider: str
    product: str  # nft | tro | agent
    amount_fiat: float
    fiat_currency: str
    target: dict[str, Any]  # listing_id / tro_amount / agent_id
    user_address: str
    status: str  # created | redirected | fiat_paid | onchain_pending | done | failed
    created_at: float
    redirect_url: str = ""
    meta: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def _moonpay_url(intent: OnrampIntent) -> str:
    """
    Public widget-style URL pattern. Production needs apiKey from env
    MOONPAY_API_KEY + signed URLs from backend.
    """
    api_key = os.environ.get("MOONPAY_API_KEY", "")
    base = os.environ.get("MOONPAY_BUY_URL", "https://buy.moonpay.com")
    params = {
        "apiKey": api_key or "PK_PLACEHOLDER",
        "currencyCode": "egld",
        "baseCurrencyCode": intent.fiat_currency.lower(),
        "baseCurrencyAmount": str(intent.amount_fiat),
        "walletAddress": intent.user_address,
        "externalTransactionId": intent.session_id,
    }
    if not api_key:
        intent.meta["warning"] = "MOONPAY_API_KEY missing — placeholder URL"
    return f"{base}?{urlencode(params)}"


def _xmoney_url(intent: OnrampIntent) -> str:
    """xMoney merchant payment — URL from env template when integrated."""
    template = os.environ.get("XMONEY_PAYMENT_URL_TEMPLATE", "")
    if not template:
        intent.meta["warning"] = "XMONEY_PAYMENT_URL_TEMPLATE not set"
        return f"https://xmoney.com/?ref=xartists&session={intent.session_id}"
    return template.format(
        session_id=intent.session_id,
        amount=intent.amount_fiat,
        currency=intent.fiat_currency,
        address=intent.user_address,
    )


def create_onramp_session(
    *,
    product: str,
    amount_fiat: float,
    user_address: str,
    target: Optional[dict[str, Any]] = None,
    provider: str = "moonpay",
    fiat_currency: str = "EUR",
) -> OnrampIntent:
    if provider not in PROVIDERS:
        raise ValueError(f"provider must be one of {PROVIDERS}")
    if product not in ("nft", "tro", "agent"):
        raise ValueError("product must be nft|tro|agent")
    if amount_fiat <= 0:
        raise ValueError("amount_fiat > 0")
    if not user_address.startswith("erd1"):
        raise ValueError("user_address must be erd1…")

    sid = f"fiat-{uuid.uuid4().hex[:12]}"
    intent = OnrampIntent(
        session_id=sid,
        provider=provider,
        product=product,
        amount_fiat=float(amount_fiat),
        fiat_currency=fiat_currency.upper(),
        target=target or {},
        user_address=user_address,
        status="created",
        created_at=time.time(),
    )
    if provider == "moonpay":
        intent.redirect_url = _moonpay_url(intent)
    elif provider == "xmoney":
        intent.redirect_url = _xmoney_url(intent)
    else:
        intent.redirect_url = ""
        intent.meta["manual"] = "Ops confirms bank transfer then runs on-chain"

    intent.status = "redirected" if intent.redirect_url else "created"
    _save(intent)
    return intent


def mark_fiat_paid(session_id: str) -> dict[str, Any]:
    rows = _load()
    for r in rows:
        if r.get("session_id") == session_id:
            r["status"] = "fiat_paid"
            r["meta"] = {**(r.get("meta") or {}), "fiat_paid_at": time.time()}
            _write(rows)
            return {"ok": True, "next": "onchain_buy", "session": r}
    return {"ok": False, "error": "not found"}


def onchain_followup_plan(session: dict[str, Any]) -> dict[str, Any]:
    """What LIA/ops should do after fiat is confirmed."""
    product = session.get("product")
    target = session.get("target") or {}
    if product == "tro":
        return {
            "action": "buy_tro_esdt",
            "token": "TRO-94c925",
            "hint": target.get("tro_amount") or "from fiat conversion EGLD",
            "dex": "xexchange_or_ashswap",
        }
    if product == "nft":
        return {
            "action": "buy_nft",
            "listing_id": target.get("listing_id"),
            "requires": "nft-marketplace codeHash non-null",
        }
    if product == "agent":
        return {
            "action": "buy_agent",
            "agent_id": target.get("agent_id"),
            "requires": "agents_marketplace deployed",
        }
    return {"action": "unknown"}


def _save(intent: OnrampIntent) -> None:
    rows = _load()
    rows.append(intent.to_dict())
    _write(rows[-200:])


def _load() -> list[dict[str, Any]]:
    if not SESSIONS.exists():
        return []
    try:
        return list(json.loads(SESSIONS.read_text(encoding="utf-8")).get("sessions") or [])
    except json.JSONDecodeError:
        return []


def _write(rows: list[dict[str, Any]]) -> None:
    SESSIONS.parent.mkdir(parents=True, exist_ok=True)
    SESSIONS.write_text(
        json.dumps({"updated": time.time(), "sessions": rows}, indent=2) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    s = create_onramp_session(
        product="tro",
        amount_fiat=50,
        user_address="erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4af",
        target={"tro_amount": 100},
        provider="moonpay",
    )
    print(json.dumps(s.to_dict(), indent=2))
    print(onchain_followup_plan(s.to_dict()))
