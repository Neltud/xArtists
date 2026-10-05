"""
Autonomous dust execution — signs & broadcasts ONLY if risk cage passes.

  LIA_LIVE_TRADING=1 LIA_AUTONOMOUS_DUST=1 PYTHONPATH=. python -m lia.guardian.execution_engine --run

Never commits keys. PEM via LIA_PEM_PATH only.
"""
from __future__ import annotations

import argparse
import json
import os
import time
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"
API = "https://api.multiversx.com"
WEGLD_SC = "erd1qqqqqqqqqqqqqpgqhe8t5jewej70zupmh44jurgn29psua5l2jps3ntjj3"
WEGLD_USDC_PAIR = "erd1qqqqqqqqqqqqqpgqeel2kumf0r8ffyhth7pqdujjat9nx0862jpsg2pqaq"


def _env_live() -> bool:
    return os.environ.get("LIA_LIVE_TRADING", "0").strip() in ("1", "true", "TRUE")


def _env_auto() -> bool:
    return os.environ.get("LIA_AUTONOMOUS_DUST", "0").strip() in ("1", "true", "TRUE")


def _get_account(address: str) -> dict[str, Any]:
    import urllib.request

    req = urllib.request.Request(
        f"{API}/accounts/{address}", headers={"User-Agent": "xArtists-exec/1.0"}
    )
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read().decode())


def _get_egld_usd() -> float:
    import urllib.request

    try:
        req = urllib.request.Request(
            f"{API}/economics", headers={"User-Agent": "xArtists-exec/1.0"}
        )
        with urllib.request.urlopen(req, timeout=12) as r:
            return float(json.loads(r.read().decode()).get("price") or 4.5)
    except Exception:
        return 4.5


def _broadcast(tx_dict: dict[str, Any]) -> dict[str, Any]:
    import urllib.request

    body = json.dumps(tx_dict).encode()
    req = urllib.request.Request(
        f"{API}/transactions",
        data=body,
        headers={"Content-Type": "application/json", "User-Agent": "xArtists-exec/1.0"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


def sign_and_send(
    *,
    receiver: str,
    value: int,
    data: str,
    gas_limit: int,
    amount_egld: float,
    amount_usd: float,
    label: str,
) -> dict[str, Any]:
    from multiversx_sdk import Address, Transaction, TransactionComputer

    from lia.guardian.hot_wallet_manager import load_signer
    from lia.guardian.risk_enforcer import enforce, record_trade_result

    if not _env_live() or not _env_auto():
        return {
            "ok": False,
            "reason": "need_LIA_LIVE_TRADING=1_and_LIA_AUTONOMOUS_DUST=1",
            "broadcast": False,
        }

    signer, sender = load_signer()
    acc = _get_account(sender)
    wallet_egld = int(acc.get("balance") or 0) / 1e18
    nonce = int(acc.get("nonce") or 0)

    verdict = enforce(
        asset_type="TOKEN",
        token_id="EGLD",
        amount_egld=amount_egld,
        amount_usd=amount_usd,
        gas_limit=gas_limit,
        wallet_egld=wallet_egld,
    )
    if not verdict.ok:
        return {"ok": False, "reason": verdict.reason, "checks": verdict.checks, "broadcast": False}

    tx = Transaction(
        nonce=nonce,
        sender=Address.new_from_bech32(sender),
        receiver=Address.new_from_bech32(receiver),
        gas_limit=gas_limit,
        chain_id="1",
        value=value,
        data=data.encode() if data else b"",
        version=2,
    )
    computer = TransactionComputer()
    tx.signature = signer.sign(computer.compute_bytes_for_signing(tx))

    # Serialize for API
    payload = {
        "nonce": tx.nonce,
        "value": str(tx.value),
        "receiver": receiver,
        "sender": sender,
        "gasPrice": tx.gas_price or 1_000_000_000,
        "gasLimit": tx.gas_limit,
        "data": __import__("base64").b64encode(tx.data).decode() if tx.data else "",
        "chainID": "1",
        "version": 2,
        "signature": tx.signature.hex() if isinstance(tx.signature, (bytes, bytearray)) else str(tx.signature),
    }
    # signature format — SDK may return already hex
    if hasattr(tx, "signature") and tx.signature is not None:
        sig = tx.signature
        if isinstance(sig, (bytes, bytearray)):
            payload["signature"] = sig.hex()
        else:
            payload["signature"] = str(sig)

    try:
        resp = _broadcast(payload)
    except Exception as e:
        return {"ok": False, "reason": f"broadcast_error:{e}", "payload_preview": {k: payload[k] for k in ("sender", "receiver", "value", "gasLimit")}}

    tx_hash = resp.get("txHash") or resp.get("hash") or ""
    record_trade_result(loss_usd=0.0)
    try:
        from lia.utils.audit_log import audit

        audit("autonomous_dust_tx", label=label, tx_hash=tx_hash, amount_egld=amount_egld)
    except Exception:
        pass

    return {
        "ok": True,
        "tx_hash": tx_hash,
        "explorer": f"https://explorer.multiversx.com/transactions/{tx_hash}" if tx_hash else None,
        "sender": sender,
        "label": label,
        "response": resp,
    }


def run_dust_cycle() -> dict[str, Any]:
    """One autonomous cycle: decision → risk → wrap dust OR hold."""
    from lia.brain.orchestrator import orchestrate
    from lia.brain.strategies import action_for
    from lia.calldata.swap import dust_egld_to_usdc_plan
    from lia.guardian.risk_enforcer import enforce

    egld_usd = _get_egld_usd()
    orch = orchestrate(
        sentiment=0.2,
        volatility=0.3,
        trend="SIDEWAYS",
        confidence=0.6,
        asset_state="Liquid",
    )
    strategy = str(orch.get("active") or "STRAT_YIELD_OPTIMIZER")
    action = action_for(strategy)  # type: ignore

    amount_egld = 0.001  # hard dust
    amount_usd = amount_egld * egld_usd

    plan = dust_egld_to_usdc_plan(amount_egld=amount_egld, egld_usd=egld_usd)
    steps = plan.get("steps") or []
    results = []

    if action == "HOLD":
        return {"ok": True, "action": "HOLD", "strategy": strategy, "txs": []}

    # Execute first step only in this version (wrap) — safer progressive autonomy
    # Full swap path can be second TX in next cycle after wrap confirms
    step = steps[0] if steps else None
    if not step:
        return {"ok": False, "reason": "no_calldata_steps"}

    out = sign_and_send(
        receiver=str(step["receiver"]),
        value=int(step["value"]),
        data=str(step["data"]),
        gas_limit=int(step["gas_limit"]),
        amount_egld=amount_egld,
        amount_usd=amount_usd,
        label=str(step.get("label") or "dust"),
    )
    results.append(out)

    # If wrap ok and BUY, attempt swap step with WEGLD already in wallet (may need wait)
    # For safety: only wrap in first autonomous shot unless --full-swap
    return {
        "ok": all(r.get("ok") for r in results),
        "strategy": strategy,
        "action": action,
        "amount_egld": amount_egld,
        "results": results,
        "note": "Progressive autonomy: wrap step first; swap on next run after confirm",
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--run", action="store_true")
    ap.add_argument("--dry-risk", action="store_true")
    args = ap.parse_args()
    if args.dry_risk:
        from lia.guardian.risk_enforcer import enforce

        print(json.dumps(enforce(amount_egld=0.001, amount_usd=0.01, gas_limit=10_000_000).__dict__, indent=2))
        return
    if args.run:
        print(json.dumps(run_dust_cycle(), indent=2))
        return
    print(json.dumps({"hint": "LIA_LIVE_TRADING=1 LIA_AUTONOMOUS_DUST=1 ... --run"}, indent=2))


if __name__ == "__main__":
    main()
