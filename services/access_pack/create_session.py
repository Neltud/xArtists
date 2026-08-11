"""Create Stripe Checkout Session for Access Pack — server-side price."""
from __future__ import annotations

import os
from typing import Any

from services.access_pack.catalog import get_pack


def create_checkout_session(
    *,
    pack_id: str,
    buyer_address: str,
    success_url: str,
    cancel_url: str,
) -> dict[str, Any]:
    if not buyer_address.startswith("erd1"):
        raise ValueError("buyer_address must be erd1…")
    pack = get_pack(pack_id)
    secret = os.environ.get("STRIPE_SECRET_KEY")
    if not secret:
        # Dev stub — no network
        return {
            "id": "cs_test_stub",
            "url": None,
            "mode": "stub",
            "pack_id": pack["id"],
            "amount_cents": pack["price_cents"],
            "buyer_address": buyer_address,
            "note": "Set STRIPE_SECRET_KEY for real session",
        }

    import stripe  # type: ignore

    stripe.api_key = secret
    session = stripe.checkout.Session.create(
        mode="payment",
        success_url=success_url + "?session_id={CHECKOUT_SESSION_ID}",
        cancel_url=cancel_url,
        line_items=[
            {
                "price_data": {
                    "currency": "eur",
                    "unit_amount": pack["price_cents"],
                    "product_data": {
                        "name": f"xArtists Access Pack — {pack['name']}",
                        "description": (
                            "Access pass (membership NFT). Paper trading view only. "
                            "Not an investment product. Model C."
                        ),
                    },
                },
                "quantity": 1,
            }
        ],
        metadata={
            "pack_id": pack["id"],
            "buyer_address": buyer_address,
            "model": "C",
            "product": "xartists_access_pack",
        },
        payment_intent_data={
            "metadata": {
                "pack_id": pack["id"],
                "buyer_address": buyer_address,
            }
        },
    )
    return {
        "id": session.id,
        "url": session.url,
        "mode": "live_or_test",
        "pack_id": pack["id"],
        "amount_cents": pack["price_cents"],
        "buyer_address": buyer_address,
    }
