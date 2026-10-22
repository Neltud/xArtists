"""
PayBox multichain router — LIA DecisionProof → PayBox swap/transfer intents.

No secrets. Does not call PayBox APIs from Python (Grok/MCP does).
Produces canonical intents + appends to data/paybox_legs.json for dApp mirror.

Doctrine: docs/MULTICHAIN_PAYBOX_EXECUTOR.md
"""
from __future__ import annotations

import json
import math
import re
import time
import uuid
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"
LEGS_FILE = DATA / "paybox_legs.json"

# Canonical mints / natives
SOLANA_USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
SOLANA_NATIVE = "native"
SOLANA_CHAIN = "solana:mainnet"
SOLANA_NETWORK_ID = 1399811149

# Caps
MIN_SOL_GAS_LAMPORTS = 20_000_000  # 0.02 SOL keep for fees
MAX_FRACTION_OF_SOL = 0.5  # never swap more than 50% of available after gas reserve
MAX_TRADE_USD = 15.0
MAX_DAILY_USD = 40.0
MAX_QUOTE_AGE_SECONDS = 60


def _validate_risk(usd_notional: float, daily_spent_usd: float, quote_ts: float, now: float | None = None) -> None:
    now = time.time() if now is None else now
    if not math.isfinite(usd_notional) or not 0 < usd_notional <= MAX_TRADE_USD:
        raise ValueError("unverified_usd_notional_or_trade_cap")
    if not math.isfinite(daily_spent_usd) or daily_spent_usd < 0 or daily_spent_usd + usd_notional > MAX_DAILY_USD:
        raise ValueError("unverified_daily_budget_or_daily_cap")
    if not math.isfinite(quote_ts) or not math.isfinite(now) or not -5 <= now - quote_ts <= MAX_QUOTE_AGE_SECONDS:
        raise ValueError("stale_or_invalid_quote")


def _ts() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def _load_legs() -> list[dict[str, Any]]:
    if not LEGS_FILE.is_file():
        return []
    try:
        raw = json.loads(LEGS_FILE.read_text(encoding="utf-8"))
        return list(raw.get("legs") or [])
    except (OSError, json.JSONDecodeError):
        return []


def _save_legs(legs: list[dict[str, Any]]) -> None:
    payload = {
        "ts": _ts(),
        "module": "lia.executor.paybox_router",
        "version": "1.1.0",
        "legs": legs[-100:],
    }
    DATA.mkdir(parents=True, exist_ok=True)
    LEGS_FILE.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    # soft mirror for frontend
    for dest in (
        ROOT / "apps" / "frontend" / "public" / "data" / "paybox_legs.json",
        ROOT / "docs" / "data" / "paybox_legs.json",
    ):
        try:
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
        except OSError:
            pass


def size_sol_to_usdc(
    balance_lamports: int, fraction: float = 0.45, *,
    sol_usd: float, daily_spent_usd: float, quote_ts: float, now: float | None = None,
) -> dict[str, Any]:
    """
    Compute safe SOL→USDC swap size.
    Keeps MIN_SOL_GAS_LAMPORTS; caps at MAX_FRACTION_OF_SOL of (balance - gas).
    """
    if isinstance(balance_lamports, bool) or not isinstance(balance_lamports, int) or balance_lamports < 0:
        raise ValueError("invalid_balance")
    if not math.isfinite(sol_usd) or sol_usd <= 0 or not math.isfinite(fraction) or not 0 < fraction <= MAX_FRACTION_OF_SOL:
        raise ValueError("invalid_price_or_fraction")
    if not math.isfinite(daily_spent_usd) or not 0 <= daily_spent_usd < MAX_DAILY_USD:
        raise ValueError("invalid_daily_budget")
    available = max(0, balance_lamports - MIN_SOL_GAS_LAMPORTS)
    if available <= 0:
        return {
            "ok": False,
            "error": "insufficient_sol_after_gas_reserve",
            "balance_lamports": balance_lamports,
            "min_gas": MIN_SOL_GAS_LAMPORTS,
        }
    usd_budget = min(MAX_TRADE_USD, MAX_DAILY_USD - daily_spent_usd)
    amount = min(int(available * fraction), int(usd_budget / sol_usd * 1e9))
    # round down to 0.001 SOL steps
    amount = (amount // 1_000_000) * 1_000_000
    if amount < 1_000_000:  # < 0.001 SOL
        return {"ok": False, "error": "amount_too_small", "amount": amount}
    usd_notional = amount / 1e9 * sol_usd
    _validate_risk(usd_notional, daily_spent_usd, quote_ts, now)
    return {
        "ok": True,
        "src_chain": SOLANA_CHAIN,
        "src_token": SOLANA_NATIVE,
        "dst_token": SOLANA_USDC,
        "amount_atomic": str(amount),
        "amount_sol": amount / 1e9,
        "keep_sol": (balance_lamports - amount) / 1e9,
        "network_id": SOLANA_NETWORK_ID,
        "usd_notional": usd_notional,
        "slippage_bps": 100,
        "reason": "BASE_USDC_FOR_MULTICHAIN_TRADING",
    }


def build_swap_intent(
    *,
    src_chain: str,
    src_token: str,
    dst_token: str,
    amount_atomic: str,
    usd_notional: float,
    daily_spent_usd: float,
    quote_ts: float,
    reason: str = "LIA_DECISION",
    confidence: float = 0.8,
    slippage_bps: int = 100,
    strategy: str = "PAYBOX_EXEC",
    now: float | None = None,
) -> dict[str, Any]:
    _validate_risk(usd_notional, daily_spent_usd, quote_ts, now)
    if src_chain != SOLANA_CHAIN and not re.fullmatch(r"eip155:[1-9][0-9]*", src_chain):
        raise ValueError("unsupported_paybox_chain")
    if not isinstance(amount_atomic, str) or not re.fullmatch(r"[1-9][0-9]*", amount_atomic):
        raise ValueError("invalid_atomic_amount")
    if not src_token or not dst_token or src_token == dst_token:
        raise ValueError("invalid_token_pair")
    if isinstance(slippage_bps, bool) or not isinstance(slippage_bps, int) or not 0 < slippage_bps <= 100:
        raise ValueError("slippage_exceeds_100_bps")
    if not math.isfinite(confidence) or not 0 <= confidence <= 1:
        raise ValueError("invalid_confidence")
    return {
        "id": f"pb-{uuid.uuid4().hex}",
        "ts": _ts(),
        "action": "SWAP",
        "strategy": strategy,
        "src_chain": src_chain,
        "src_token": src_token,
        "dst_token": dst_token,
        "amount_atomic": str(amount_atomic),
        "slippage_bps": slippage_bps,
        "reason": reason,
        "confidence": confidence,
        "executor": "paybox",
        "status": "intent",
        "requires_user_approval": True,
        "risk": {"usd_notional": usd_notional, "daily_spent_usd": daily_spent_usd, "quote_ts": quote_ts},
    }


def record_leg(intent: dict[str, Any], result: dict[str, Any] | None = None) -> dict[str, Any]:
    legs = _load_legs()
    # A provider response is not chain confirmation. Never mark a payment executed here.
    entry = {**intent, "status": "failed" if (result or {}).get("status") == "failed" else "pending_confirmation" if result else "intent"}
    if result:
        entry["result"] = {
            k: result.get(k)
            for k in ("request_id", "tx_hash", "signature", "status", "error", "usdc_out")
            if k in result or result.get(k) is not None
        }
    existing = next((i for i, leg in enumerate(legs) if leg.get("id") == intent.get("id")), None)
    if existing is None:
        legs.append(entry)
    else:
        if not result:
            return legs[existing]
        previous_hash = (legs[existing].get("result") or {}).get("tx_hash")
        new_hash = (entry.get("result") or {}).get("tx_hash")
        if previous_hash and new_hash != previous_hash:
            raise ValueError("conflicting_transaction_for_intent")
        legs[existing] = entry
    _save_legs(legs)
    return entry


def bootstrap_sol_usdc_intent(
    balance_lamports: int, *, sol_usd: float, daily_spent_usd: float, quote_ts: float,
    credential_id: str, wallet_address: str,
) -> dict[str, Any]:
    """Prepare an intent from an observed balance/quote and an explicitly selected account."""
    if not credential_id.strip() or not wallet_address.strip():
        raise ValueError("explicit_paybox_account_required")
    sized = size_sol_to_usdc(balance_lamports, sol_usd=sol_usd, daily_spent_usd=daily_spent_usd, quote_ts=quote_ts)
    if not sized.get("ok"):
        return sized
    intent = build_swap_intent(
        src_chain=sized["src_chain"],
        src_token=sized["src_token"],
        dst_token=sized["dst_token"],
        amount_atomic=sized["amount_atomic"],
        usd_notional=sized["usd_notional"],
        daily_spent_usd=daily_spent_usd,
        quote_ts=quote_ts,
        reason=sized["reason"],
        confidence=0.95,
        slippage_bps=sized["slippage_bps"],
        strategy="BOOTSTRAP_USDC_BASE",
    )
    intent["meta"] = {
        "amount_sol": sized["amount_sol"],
        "keep_sol": sized["keep_sol"],
        "wallet": wallet_address,
    }
    record_leg(intent)
    return {"ok": True, "intent": intent, "paybox_args": {
        "credential_id": credential_id,
        "src_chain": intent["src_chain"],
        "src_token": intent["src_token"],
        "dst_token": intent["dst_token"],
        "amount": intent["amount_atomic"],
        "slippage_bps": intent["slippage_bps"],
    }}


if __name__ == "__main__":
    print(json.dumps({"ok": False, "error": "explicit_account_balance_and_fresh_quote_required", "broadcast": False}))
