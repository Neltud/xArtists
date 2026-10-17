"""
PayBox multichain router — LIA DecisionProof → PayBox swap/transfer intents.

No secrets. Does not call PayBox APIs from Python (Grok/MCP does).
Produces canonical intents + appends to data/paybox_legs.json for dApp mirror.

Doctrine: docs/MULTICHAIN_PAYBOX_EXECUTOR.md
"""
from __future__ import annotations

import json
import time
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

# Session wallets (public addresses only)
PAYBOX_SOL = "Dmc7RKdPNKcDDeGVW37rPnZZ7jJiPYuCmgB1EMBbRRFN"
PAYBOX_EVM = "0xc603c5b2013bcbc54238a6f7ca503992493f2e41"

# Caps
MIN_SOL_GAS_LAMPORTS = 20_000_000  # 0.02 SOL keep for fees
MAX_FRACTION_OF_SOL = 0.5  # never swap more than 50% of available after gas reserve


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
        "version": "1.0.0",
        "wallets": {"solana": PAYBOX_SOL, "evm": PAYBOX_EVM},
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


def size_sol_to_usdc(balance_lamports: int, fraction: float = 0.45) -> dict[str, Any]:
    """
    Compute safe SOL→USDC swap size.
    Keeps MIN_SOL_GAS_LAMPORTS; caps at MAX_FRACTION_OF_SOL of (balance - gas).
    """
    available = max(0, balance_lamports - MIN_SOL_GAS_LAMPORTS)
    if available <= 0:
        return {
            "ok": False,
            "error": "insufficient_sol_after_gas_reserve",
            "balance_lamports": balance_lamports,
            "min_gas": MIN_SOL_GAS_LAMPORTS,
        }
    frac = min(max(fraction, 0.01), MAX_FRACTION_OF_SOL)
    amount = int(available * frac)
    # round down to 0.001 SOL steps
    amount = (amount // 1_000_000) * 1_000_000
    if amount < 1_000_000:  # < 0.001 SOL
        return {"ok": False, "error": "amount_too_small", "amount": amount}
    return {
        "ok": True,
        "src_chain": SOLANA_CHAIN,
        "src_token": SOLANA_NATIVE,
        "dst_token": SOLANA_USDC,
        "amount_atomic": str(amount),
        "amount_sol": amount / 1e9,
        "keep_sol": (balance_lamports - amount) / 1e9,
        "network_id": SOLANA_NETWORK_ID,
        "wallet": PAYBOX_SOL,
        "slippage_bps": 100,
        "reason": "BASE_USDC_FOR_MULTICHAIN_TRADING",
    }


def build_swap_intent(
    *,
    src_chain: str,
    src_token: str,
    dst_token: str,
    amount_atomic: str,
    reason: str = "LIA_DECISION",
    confidence: float = 0.8,
    slippage_bps: int = 100,
    strategy: str = "PAYBOX_EXEC",
) -> dict[str, Any]:
    return {
        "id": f"pb-{int(time.time())}",
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
    }


def record_leg(intent: dict[str, Any], result: dict[str, Any] | None = None) -> dict[str, Any]:
    legs = _load_legs()
    entry = {**intent, "status": (result or {}).get("status", intent.get("status", "intent"))}
    if result:
        entry["result"] = {
            k: result.get(k)
            for k in ("request_id", "tx_hash", "signature", "status", "error", "usdc_out")
            if k in result or result.get(k) is not None
        }
    legs.append(entry)
    _save_legs(legs)
    return entry


def bootstrap_sol_usdc_intent(balance_lamports: int = 150_000_000) -> dict[str, Any]:
    """Default first leg after funding: partial SOL → USDC."""
    sized = size_sol_to_usdc(balance_lamports)
    if not sized.get("ok"):
        return sized
    intent = build_swap_intent(
        src_chain=sized["src_chain"],
        src_token=sized["src_token"],
        dst_token=sized["dst_token"],
        amount_atomic=sized["amount_atomic"],
        reason=sized["reason"],
        confidence=0.95,
        slippage_bps=sized["slippage_bps"],
        strategy="BOOTSTRAP_USDC_BASE",
    )
    intent["meta"] = {
        "amount_sol": sized["amount_sol"],
        "keep_sol": sized["keep_sol"],
        "wallet": sized["wallet"],
    }
    record_leg(intent)
    return {"ok": True, "intent": intent, "paybox_args": {
        "credential_id": "2fe487b1-37b2-4fd9-b103-699e86577c4f",  # sol-default session
        "src_chain": intent["src_chain"],
        "src_token": intent["src_token"],
        "dst_token": intent["dst_token"],
        "amount": intent["amount_atomic"],
        "slippage_bps": intent["slippage_bps"],
    }}


if __name__ == "__main__":
    out = bootstrap_sol_usdc_intent()
    print(json.dumps(out, indent=2))
