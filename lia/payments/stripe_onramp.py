"""
Stripe Checkout / PaymentIntent session for fiat → later on-chain buy.

Secrets (Vellum / backend only):
  STRIPE_SECRET_KEY
  STRIPE_PUBLISHABLE_KEY (frontend)
  STRIPE_WEBHOOK_SECRET

Never put secret key in the dApp bundle. This module builds intent records
and Checkout URL placeholders; real Stripe API calls happen in backend
when keys are present.
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
SESSIONS = _ROOT / "data" / "stripe_sessions.json"


@dataclass
class StripeSession:
    session_id: str
    product: str  # nft | tro | agent_nft
    amount_cents: int
    currency: str
    user_address: str
    target: dict[str, Any]
    status: str
    created_at: float
    checkout_url: str = ""
    stripe_session_id: str = ""
    meta: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def create_checkout_intent(
    *,
    product: str,
    amount_cents: int,
    user_address: str,
    target: Optional[dict[str, Any]] = None,
    currency: str = "eur",
    success_url: str = "",
    cancel_url: str = "",
) -> StripeSession:
    if product not in ("nft", "tro", "agent_nft"):
        raise ValueError("product must be nft|tro|agent_nft")
    if amount_cents < 50:
        raise ValueError("amount_cents min 50 (0.50)")
    if not user_address.startswith("erd1"):
        raise ValueError("erd1 user_address required")

    sid = f"stripe-{uuid.uuid4().hex[:12]}"
    secret = os.environ.get("STRIPE_SECRET_KEY", "")
    success = success_url or os.environ.get(
        "STRIPE_SUCCESS_URL", "https://neltud.github.io/xArtists/agents?fiat=success"
    )
    cancel = cancel_url or os.environ.get(
        "STRIPE_CANCEL_URL", "https://neltud.github.io/xArtists/agents?fiat=cancel"
    )

    session = StripeSession(
        session_id=sid,
        product=product,
        amount_cents=int(amount_cents),
        currency=currency.lower(),
        user_address=user_address,
        target=target or {},
        status="created",
        created_at=time.time(),
        meta={"success_url": success, "cancel_url": cancel},
    )

    if secret.startswith("sk_"):
        # Live API path — optional dependency; document for backend worker
        session.meta["mode"] = "api_ready"
        session.checkout_url = _try_stripe_checkout(session, secret, success, cancel)
        if session.checkout_url:
            session.status = "checkout_open"
    else:
        session.meta["mode"] = "placeholder"
        session.meta["warning"] = "STRIPE_SECRET_KEY not set — no live Checkout"
        # Safe placeholder for UI wiring tests
        q = urlencode(
            {
                "session_id": sid,
                "product": product,
                "amount_cents": amount_cents,
                "address": user_address,
            }
        )
        session.checkout_url = f"https://checkout.stripe.com/placeholder?{q}"
        session.status = "needs_secret"

    _save(session)
    return session


def _try_stripe_checkout(
    session: StripeSession, secret: str, success: str, cancel: str
) -> str:
    """Minimal HTTPS call to Stripe Checkout Sessions API without extra deps."""
    try:
        import urllib.request

        boundary = "----xArtistsStripe"
        fields = {
            "mode": "payment",
            "success_url": success + "&session_id={CHECKOUT_SESSION_ID}",
            "cancel_url": cancel,
            "client_reference_id": session.session_id,
            "metadata[product]": session.product,
            "metadata[user_address]": session.user_address,
            "metadata[xartists_session]": session.session_id,
            "line_items[0][price_data][currency]": session.currency,
            "line_items[0][price_data][unit_amount]": str(session.amount_cents),
            "line_items[0][price_data][product_data][name]": f"xArtists {session.product}",
            "line_items[0][quantity]": "1",
        }
        body = urlencode(fields).encode()
        req = urllib.request.Request(
            "https://api.stripe.com/v1/checkout/sessions",
            data=body,
            headers={
                "Authorization": f"Bearer {secret}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode())
        session.stripe_session_id = str(data.get("id") or "")
        return str(data.get("url") or "")
    except Exception as e:
        session.meta["stripe_error"] = str(e)[:200]
        return ""


def mark_paid_from_webhook(session_id: str, stripe_event_id: str = "") -> dict[str, Any]:
    rows = _load()
    for r in rows:
        if r.get("session_id") == session_id or r.get("stripe_session_id") == session_id:
            r["status"] = "paid"
            r["meta"] = {
                **(r.get("meta") or {}),
                "paid_at": time.time(),
                "stripe_event_id": stripe_event_id,
            }
            _write(rows)
            return {
                "ok": True,
                "next": "onchain_fulfillment",
                "product": r.get("product"),
                "session": r,
            }
    return {"ok": False, "error": "session not found"}


def _save(s: StripeSession) -> None:
    rows = _load()
    rows.append(s.to_dict())
    _write(rows[-300:])


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
    s = create_checkout_intent(
        product="agent_nft",
        amount_cents=2500,
        user_address="erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4af",
        target={"agent_id": "xag-demo", "supply_cap": 100},
    )
    print(json.dumps(s.to_dict(), indent=2))
