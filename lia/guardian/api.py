"""
LIA Guardian API — intent validate / execute (MultiversX-first).

Honest modes:
- validate: policy only (blacklist, amount, action allowlist, paper flag)
- execute: NEVER returns SUCCESS without an on-chain hash confirmed by watcher
  In this module: returns AWAITING_SIGNATURE or PAPER_ONLY — no fake tx hash.

Run: uvicorn lia.guardian.api:app --host 0.0.0.0 --port 8000
Env: LIA_LIVE_TRADING=0 (default paper), GUARDIAN_MAX_AMOUNT_EGLD=1000
"""
from __future__ import annotations

import os
import time
from typing import Any, Optional

from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field

LIVE = os.getenv("LIA_LIVE_TRADING", "0") == "1"
MAX_AMOUNT = float(os.getenv("GUARDIAN_MAX_AMOUNT_EGLD", "1000"))

app = FastAPI(
    title="LIA Guardian API",
    description="Policy gate between client intent and MultiversX broadcast",
    version="0.2.0",
)


class UserIntent(BaseModel):
    user_address: str = Field(..., description="erd1…")
    action: str
    target_address: str = ""
    amount: float = 0.0
    asset_id: str = ""
    chain: str = "multiversx"
    paper: bool = True
    metadata: dict[str, Any] = Field(default_factory=dict)


class TransactionResponse(BaseModel):
    status: str
    message: str
    transaction_hash: Optional[str] = None
    payload: Optional[dict[str, Any]] = None
    risk_score: float = 0.0
    paper: bool = True


class GuardianService:
    """Policy Engine — deny by default on ambiguity."""

    def __init__(self) -> None:
        self.blacklist = {
            "erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4af",
        }
        self.valid_actions = {
            "BUY_NFT",
            "TRANSFER_TOKEN",
            "TRANSFER",
            "MINT",
            "SWAP",
            "STAKE",
            "TIP",
            "BALANCE_QUERY",
            "INFO",
        }

    def validate_intent(self, intent: UserIntent) -> tuple[bool, str, float]:
        addr = (intent.user_address or "").strip().lower()
        target = (intent.target_address or "").strip().lower()
        action = (intent.action or "").strip().upper()

        if not addr.startswith("erd1") or len(addr) < 20:
            return False, "Adresse utilisateur MultiversX invalide (erd1…).", 0.9

        if target and target in self.blacklist:
            return False, "Action bloquée : destination blacklistée.", 1.0

        if action not in self.valid_actions:
            return False, f"Action non autorisée par le Policy Engine: {action}", 0.8

        if action in {"TRANSFER", "TRANSFER_TOKEN", "SWAP", "BUY_NFT", "TIP"} and intent.amount < 0:
            return False, "Montant négatif interdit.", 0.7

        if intent.amount > MAX_AMOUNT:
            return (
                False,
                f"Limite anti-drain: max {MAX_AMOUNT} (EGLD-équivalent paper). Montant refusé.",
                0.85,
            )

        if LIVE and not intent.paper and action in {"SWAP", "BUY_NFT", "TRANSFER", "TRANSFER_TOKEN"}:
            return True, "Validation live OK — signature wallet requise (pas de broadcast backend).", 0.25

        if not LIVE and not intent.paper and action in {"SWAP", "BUY_NFT", "TRANSFER"}:
            return (
                False,
                "LIA_LIVE_TRADING=0 — seules les intentions paper sont approuvées.",
                0.4,
            )

        return True, "Validation réussie (paper-safe).", 0.1


guardian = GuardianService()
AUDIT: list[dict[str, Any]] = []


def _audit(event: str, intent: UserIntent, extra: dict[str, Any] | None = None) -> None:
    AUDIT.append(
        {
            "ts": time.time(),
            "event": event,
            "user": intent.user_address,
            "action": intent.action,
            "amount": intent.amount,
            "asset": intent.asset_id,
            "paper": intent.paper,
            **(extra or {}),
        }
    )


@app.get("/health")
async def health() -> dict[str, Any]:
    return {
        "ok": True,
        "live_trading": LIVE,
        "max_amount": MAX_AMOUNT,
        "audit_size": len(AUDIT),
    }


@app.post("/intent/validate", response_model=TransactionResponse)
async def validate_intent(intent: UserIntent) -> TransactionResponse:
    ok, message, risk = guardian.validate_intent(intent)
    _audit("validate", intent, {"ok": ok, "message": message, "risk": risk})

    if not ok:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=message)

    paper = intent.paper or not LIVE
    payload = {
        "chain": "multiversx",
        "action": intent.action.upper(),
        "receiver": intent.target_address or None,
        "amount": intent.amount,
        "asset_id": intent.asset_id or None,
        "paper": paper,
        "note": "Client must build & sign TX via Web Wallet / xPortal. Backend does not sign.",
    }

    return TransactionResponse(
        status="APPROVED",
        message=message,
        payload=payload,
        risk_score=risk,
        paper=paper,
        transaction_hash=None,
    )


@app.post("/transaction/execute", response_model=TransactionResponse)
async def execute_transaction(intent: UserIntent, signature: Optional[str] = None) -> TransactionResponse:
    ok, message, risk = guardian.validate_intent(intent)
    if not ok:
        _audit("execute_denied", intent, {"message": message})
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=message)

    paper = intent.paper or not LIVE
    if paper:
        _audit("execute_paper", intent, {"signature_present": bool(signature)})
        return TransactionResponse(
            status="PAPER_RECORDED",
            message="Intention paper enregistrée. Aucune TX broadcast. Pas de hash simulé.",
            transaction_hash=None,
            risk_score=risk,
            paper=True,
        )

    if not signature:
        _audit("execute_awaiting_sig", intent)
        return TransactionResponse(
            status="AWAITING_SIGNATURE",
            message="Signature wallet requise. Le Guardian n'émet pas de SUCCESS factice.",
            transaction_hash=None,
            risk_score=risk,
            paper=False,
        )

    _audit("execute_pending", intent, {"signature_len": len(signature)})
    return TransactionResponse(
        status="PENDING",
        message=(
            "Signature reçue côté API. Confirmation on-chain via TransactionWatcher uniquement. "
            "Aucun hash inventé."
        ),
        transaction_hash=None,
        risk_score=risk,
        paper=False,
    )


@app.get("/audit/recent")
async def audit_recent(limit: int = 50) -> dict[str, Any]:
    return {"items": AUDIT[-limit:]}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
