"""
Deployer decision signals — feeds paper intent then optional micro EXEC.
Never expands ESDT allowlist. No PEM in this module.
"""
from __future__ import annotations

import json
import time
import urllib.request
from dataclasses import dataclass
from typing import Any, Literal

API = "https://api.multiversx.com"
ALLOW = frozenset({"EGLD", "USDC-c76f1f", "TRO-94c925"})

Action = Literal["BUY", "SELL", "HOLD", "MICRO_PROOF"]


@dataclass
class SignalBundle:
    ts: str
    egld_price_usd: float | None
    wallet_egld: float | None
    sentiment: float  # -1..1 rough
    action: Action
    reason: str
    size_egld: float
    confidence: float


def _get(url: str) -> Any:
    req = urllib.request.Request(url, headers={"User-Agent": "xArtists-deployer-signals/1"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read().decode())


def fetch_egld_price() -> float | None:
    try:
        d = _get(f"{API}/economics")
        return float(d.get("price") or 0) or None
    except Exception:
        return None


def fetch_wallet_egld(address: str) -> float | None:
    try:
        d = _get(f"{API}/accounts/{address}")
        return int(d.get("balance") or 0) / 1e18
    except Exception:
        return None


def compute_signals(
    *,
    address: str,
    force_micro_proof: bool = False,
) -> SignalBundle:
    """Simple rule set for deployer micro path."""
    ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    px = fetch_egld_price()
    bal = fetch_wallet_egld(address)

    if force_micro_proof:
        return SignalBundle(
            ts=ts,
            egld_price_usd=px,
            wallet_egld=bal,
            sentiment=0.0,
            action="MICRO_PROOF",
            reason="ops_requested_micro_self_transfer",
            size_egld=0.0001,
            confidence=1.0,
        )

    # Neutral default: HOLD — only MICRO_PROOF when explicitly requested
    # (live BUY on marketplace needs listing + endpoint review)
    sentiment = 0.0
    if px and px > 0:
        # placeholder: no 24h series here — stay conservative
        sentiment = 0.0

    if bal is not None and bal < 0.05:
        return SignalBundle(
            ts=ts,
            egld_price_usd=px,
            wallet_egld=bal,
            sentiment=sentiment,
            action="HOLD",
            reason="below_gas_reserve_0.05",
            size_egld=0.0,
            confidence=0.9,
        )

    return SignalBundle(
        ts=ts,
        egld_price_usd=px,
        wallet_egld=bal,
        sentiment=sentiment,
        action="HOLD",
        reason="no_strong_signal_default_hold",
        size_egld=0.0,
        confidence=0.5,
    )


def to_dict(s: SignalBundle) -> dict[str, Any]:
    return {
        "ts": s.ts,
        "egld_price_usd": s.egld_price_usd,
        "wallet_egld": s.wallet_egld,
        "sentiment": s.sentiment,
        "action": s.action,
        "reason": s.reason,
        "size_egld": s.size_egld,
        "confidence": s.confidence,
        "allowlist": sorted(ALLOW),
        "paper_default": True,
    }
