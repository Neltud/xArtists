"""
Stripe webhook → verified mint queue for Access Pack membership NFT.

SECURITY:
  - Always verify Stripe-Signature on raw body
  - Idempotent on session.id
  - Buyer address + pack_id + amount from session metadata / amount_total
  - Never mint on unverified events

Run behind HTTPS. Secrets via env only.
"""
from __future__ import annotations

import hashlib
import json
import os
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Optional

from services.access_pack.catalog import PACK_CATALOG, get_pack

ROOT = Path(__file__).resolve().parents[2]
RECEIPTS = ROOT / "data" / "mint_receipts"
IDEMPOTENCY = ROOT / "data" / "stripe_idempotency.json"


@dataclass
class MintJob:
    stripe_session_id: str
    pack_id: str
    buyer_address: str
    amount_cents: int
    currency: str
    status: str  # paid | minting | minted | failed
    tx_hash: Optional[str] = None
    nft_identifier: Optional[str] = None
    error: Optional[str] = None
    created_at: float = field(default_factory=time.time)
    updated_at: float = field(default_factory=time.time)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def _load_idem() -> dict[str, Any]:
    if IDEMPOTENCY.exists():
        return json.loads(IDEMPOTENCY.read_text(encoding="utf-8"))
    return {"sessions": {}}


def _save_idem(data: dict[str, Any]) -> None:
    IDEMPOTENCY.parent.mkdir(parents=True, exist_ok=True)
    IDEMPOTENCY.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def _save_receipt(job: MintJob) -> Path:
    RECEIPTS.mkdir(parents=True, exist_ok=True)
    # filename safe
    safe = hashlib.sha256(job.stripe_session_id.encode()).hexdigest()[:16]
    path = RECEIPTS / f"{safe}_{job.pack_id}.json"
    path.write_text(json.dumps(job.to_dict(), indent=2) + "\n", encoding="utf-8")
    return path


def verify_and_parse_stripe_event(
    payload: bytes,
    sig_header: str,
    webhook_secret: str,
) -> dict[str, Any]:
    """
    Prefer stripe library in production:
      import stripe
      event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    Fallback below is a structural stub that REFUSES if secret missing.
    """
    if not webhook_secret or webhook_secret.startswith("sk_"):
        raise ValueError("WEBHOOK_SECRET required (whsec_…) — refusing event")
    try:
        import stripe  # type: ignore

        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
        return event if isinstance(event, dict) else event.to_dict()  # type: ignore
    except ImportError as e:
        raise RuntimeError(
            "Install stripe package for production webhook verify: pip install stripe"
        ) from e
    except Exception as e:
        raise ValueError(f"Stripe signature verification failed: {e}") from e


def handle_checkout_completed(session: dict[str, Any]) -> MintJob:
    """Process a verified checkout.session object."""
    session_id = session.get("id") or ""
    if not session_id:
        raise ValueError("session.id missing")

    idem = _load_idem()
    if session_id in idem.get("sessions", {}):
        # already processed — return stored snapshot
        prev = idem["sessions"][session_id]
        return MintJob(**prev) if isinstance(prev, dict) and "pack_id" in prev else MintJob(
            stripe_session_id=session_id,
            pack_id="unknown",
            buyer_address="",
            amount_cents=0,
            currency="eur",
            status="minted",
            error="idempotent_replay",
        )

    if session.get("payment_status") != "paid":
        raise ValueError(f"payment_status not paid: {session.get('payment_status')}")

    meta = session.get("metadata") or {}
    pack_id = (meta.get("pack_id") or "").lower()
    buyer = meta.get("buyer_address") or meta.get("buyer") or ""
    if not pack_id or pack_id not in PACK_CATALOG:
        raise ValueError(f"invalid pack_id in metadata: {pack_id}")
    if not buyer.startswith("erd1"):
        raise ValueError("buyer_address must be erd1… in session metadata")

    pack = get_pack(pack_id)
    amount_total = int(session.get("amount_total") or 0)
    currency = (session.get("currency") or "eur").lower()
    if currency != "eur":
        raise ValueError(f"only EUR supported, got {currency}")
    if amount_total != int(pack["price_cents"]):
        raise ValueError(
            f"amount mismatch: paid {amount_total} cents != catalog {pack['price_cents']}"
        )

    job = MintJob(
        stripe_session_id=session_id,
        pack_id=pack_id,
        buyer_address=buyer,
        amount_cents=amount_total,
        currency=currency,
        status="paid",
    )
    _save_receipt(job)

    # Queue mint (sync paper path logs intent; production calls minter)
    job.status = "minting"
    job.updated_at = time.time()
    mint_result = enqueue_mint(job)
    job.status = mint_result.get("status", "minting")
    job.tx_hash = mint_result.get("tx_hash")
    job.nft_identifier = mint_result.get("nft_identifier")
    job.error = mint_result.get("error")
    job.updated_at = time.time()
    _save_receipt(job)

    idem.setdefault("sessions", {})[session_id] = job.to_dict()
    _save_idem(idem)
    return job


def enqueue_mint(job: MintJob) -> dict[str, Any]:
    """
    Production: call MultiversX minter SC / mxpy with ACCESS_MINTER_PEM.
    Pre-flight: write mint intent only (ACCESS_MINT_MODE=paper|live).
    """
    mode = os.environ.get("ACCESS_MINT_MODE", "paper").lower()
    intent = {
        "op": "mintMembership",
        "to": job.buyer_address,
        "pack_id": job.pack_id,
        "payment_ref": job.stripe_session_id,
        "model": "C",
        "paper_trading_only": True,
    }
    intent_path = RECEIPTS / f"intent_{job.stripe_session_id[:20]}.json"
    RECEIPTS.mkdir(parents=True, exist_ok=True)
    intent_path.write_text(json.dumps(intent, indent=2) + "\n", encoding="utf-8")

    if mode != "live":
        return {
            "status": "minting",
            "tx_hash": None,
            "nft_identifier": None,
            "error": None,
            "note": "ACCESS_MINT_MODE=paper — intent logged; set live + PEM to send TX",
            "intent_path": str(intent_path),
        }

    # Live path placeholder — wire mxpy / SDK here
    pem = os.environ.get("ACCESS_MINTER_PEM_PATH") or os.environ.get("LIA_WALLET_PEM_PATH")
    collection = os.environ.get("ACCESS_NFT_COLLECTION", "")
    if not pem or not Path(pem).is_file():
        return {"status": "failed", "error": "ACCESS_MINTER_PEM_PATH missing"}
    if not collection:
        return {"status": "failed", "error": "ACCESS_NFT_COLLECTION missing"}

    return {
        "status": "minting",
        "tx_hash": None,
        "nft_identifier": None,
        "error": None,
        "note": "Wire mxpy ESDT NFT create/mint to collection; see docs/ACCESS_PACK_CHECKOUT.md",
        "collection": collection,
    }


def process_webhook_http(payload: bytes, sig_header: str) -> dict[str, Any]:
    secret = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
    event = verify_and_parse_stripe_event(payload, sig_header, secret)
    etype = event.get("type")
    if etype != "checkout.session.completed":
        return {"ok": True, "ignored": etype}
    session = event.get("data", {}).get("object", {})
    job = handle_checkout_completed(session)
    return {"ok": True, "job": job.to_dict()}
