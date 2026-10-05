"""
Hardened autonomous dust execution — dynamic slippage, retries, lifecycle.

  LIA_LIVE_TRADING=1 LIA_AUTONOMOUS_DUST=1 PYTHONPATH=. python -m lia.guardian.execution_engine --run
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import time
import urllib.request
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"
FEED = DATA / "execution_feed.jsonl"
API = "https://api.multiversx.com"
WEGLD_SC = "erd1qqqqqqqqqqqqqpgqhe8t5jewej70zupmh44jurgn29psua5l2jps3ntjj3"
WEGLD_USDC_PAIR = "erd1qqqqqqqqqqqqqpgqeel2kumf0r8ffyhth7pqdujjat9nx0862jpsg2pqaq"
WEGLD = "WEGLD-bd4d79"
USDC = "USDC-c76f1f"

MAX_RETRIES = 3
GAS_PRICE_CAP = 2_000_000_000  # 2x default


def _env_live() -> bool:
    return os.environ.get("LIA_LIVE_TRADING", "0").strip() in ("1", "true", "TRUE")


def _env_auto() -> bool:
    return os.environ.get("LIA_AUTONOMOUS_DUST", "0").strip() in ("1", "true", "TRUE")


def _feed(event: str, **kw: Any) -> None:
    DATA.mkdir(parents=True, exist_ok=True)
    row = {"ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "event": event, **kw}
    with FEED.open("a", encoding="utf-8") as f:
        f.write(json.dumps(row, ensure_ascii=False) + "\n")
    # compact tail for UI
    try:
        lines = FEED.read_text(encoding="utf-8").splitlines()[-40:]
        tail = [json.loads(x) for x in lines]
        payload = {"schema": "execution_feed/v1", "items": tail}
        for dest in (
            DATA / "execution_feed_tail.json",
            ROOT / "apps" / "frontend" / "public" / "data" / "execution_feed_tail.json",
        ):
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    except Exception:
        pass


def _get_json(url: str) -> Any:
    req = urllib.request.Request(url, headers={"User-Agent": "xArtists-exec/2.0"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode())


def _get_account(address: str) -> dict[str, Any]:
    return _get_json(f"{API}/accounts/{address}")


def _get_egld_usd() -> float:
    try:
        return float(_get_json(f"{API}/economics").get("price") or 4.5)
    except Exception:
        return 4.5


def _network_gas_price() -> int:
    try:
        # network config
        cfg = _get_json(f"{API}/network/config")
        # structure varies; fallback default
        gp = int(cfg.get("gasPrice") or cfg.get("data", {}).get("erd_min_gas_price") or 1_000_000_000)
        return gp
    except Exception:
        return 1_000_000_000


def dynamic_slippage_bps(*, volatility: float = 0.35) -> int:
    """0.5%–2% base from vol; widen further from performance_delta."""
    bps = int(max(50, min(200, 50 + volatility * 300)))
    path = DATA / "performance_delta.json"
    try:
        if path.is_file():
            d = json.loads(path.read_text(encoding="utf-8"))
            slip = d.get("avg_slippage_global")
            if slip is not None:
                bps = min(500, max(bps, int(float(slip) * 10_000 * 0.8)))
    except Exception:
        pass
    return bps


def await_tx(tx_hash: str, *, timeout_s: int = 90) -> dict[str, Any]:
    """PENDING -> CONFIRMED | FAILED_*"""
    deadline = time.time() + timeout_s
    last: dict[str, Any] = {"status": "pending"}
    while time.time() < deadline:
        try:
            last = _get_json(f"{API}/transactions/{tx_hash}")
            st = str(last.get("status") or "").lower()
            if st == "success":
                _feed("CONFIRMED", tx_hash=tx_hash)
                return {"lifecycle": "CONFIRMED", "tx": last}
            if st == "fail" or st == "invalid" or st == "failed":
                msg = ""
                for op in last.get("operations") or []:
                    if op.get("action") == "signalError":
                        msg = str(op.get("message") or "")
                life = "FAILED_SLIPPAGE" if "slippage" in msg.lower() else "FAILED_OTHER"
                if "gas" in msg.lower():
                    life = "FAILED_GAS"
                _feed(life, tx_hash=tx_hash, message=msg)
                return {"lifecycle": life, "tx": last, "message": msg}
        except Exception:
            pass
        time.sleep(4)
    _feed("PENDING_TIMEOUT", tx_hash=tx_hash)
    return {"lifecycle": "PENDING_TIMEOUT", "tx": last}


def _broadcast(tx_dict: dict[str, Any]) -> dict[str, Any]:
    body = json.dumps(tx_dict).encode()
    req = urllib.request.Request(
        f"{API}/transactions",
        data=body,
        headers={"Content-Type": "application/json", "User-Agent": "xArtists-exec/2.0"},
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
    gas_price: int | None = None,
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

    gp = gas_price or _network_gas_price()
    if gp > GAS_PRICE_CAP:
        _feed("GAS_TOO_HIGH", gas_price=gp)
        return {"ok": False, "reason": f"gas_price>{GAS_PRICE_CAP}", "broadcast": False}

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
        _feed("RISK_BLOCK", reason=verdict.reason, checks=verdict.checks)
        return {"ok": False, "reason": verdict.reason, "checks": verdict.checks, "broadcast": False}

    tx = Transaction(
        nonce=nonce,
        sender=Address.new_from_bech32(sender),
        receiver=Address.new_from_bech32(receiver),
        gas_limit=gas_limit,
        gas_price=gp,
        chain_id="1",
        value=value,
        data=data.encode() if data else b"",
        version=2,
    )
    computer = TransactionComputer()
    tx.signature = signer.sign(computer.compute_bytes_for_signing(tx))
    sig = tx.signature
    sig_hex = sig.hex() if isinstance(sig, (bytes, bytearray)) else str(sig)

    payload = {
        "nonce": tx.nonce,
        "value": str(tx.value),
        "receiver": receiver,
        "sender": sender,
        "gasPrice": gp,
        "gasLimit": tx.gas_limit,
        "data": base64.b64encode(tx.data).decode() if tx.data else "",
        "chainID": "1",
        "version": 2,
        "signature": sig_hex,
    }

    _feed("BROADCAST", label=label, receiver=receiver, amount_egld=amount_egld)
    try:
        resp = _broadcast(payload)
    except Exception as e:
        _feed("BROADCAST_ERROR", error=str(e))
        return {"ok": False, "reason": f"broadcast_error:{e}"}

    tx_hash = resp.get("txHash") or resp.get("hash") or ""
    life = await_tx(tx_hash) if tx_hash else {"lifecycle": "NO_HASH"}
    ok = life.get("lifecycle") == "CONFIRMED"
    if ok:
        record_trade_result(loss_usd=0.0)
    else:
        # failed tx still consumed gas — small loss proxy
        record_trade_result(loss_usd=0.01)

    try:
        from lia.utils.audit_log import audit

        audit("exec_tx", label=label, tx_hash=tx_hash, lifecycle=life.get("lifecycle"))
    except Exception:
        pass

    return {
        "ok": ok,
        "tx_hash": tx_hash,
        "lifecycle": life.get("lifecycle"),
        "message": life.get("message"),
        "explorer": f"https://explorer.multiversx.com/transactions/{tx_hash}" if tx_hash else None,
        "sender": sender,
        "label": label,
        "response": resp,
    }


def send_with_retry(
    *,
    build_attempt,
    amount_egld: float,
    amount_usd: float,
    label: str,
) -> dict[str, Any]:
    """Max 3 retries; widen slippage / bump gas each time."""
    last: dict[str, Any] = {}
    for attempt in range(1, MAX_RETRIES + 1):
        _feed("RETRYING" if attempt > 1 else "INTENT", attempt=attempt, label=label)
        params = build_attempt(attempt)
        last = sign_and_send(
            receiver=params["receiver"],
            value=params["value"],
            data=params["data"],
            gas_limit=params["gas_limit"],
            amount_egld=amount_egld,
            amount_usd=amount_usd,
            label=f"{label}_a{attempt}",
            gas_price=params.get("gas_price"),
        )
        if last.get("ok"):
            return last
        life = last.get("lifecycle") or ""
        if life not in ("FAILED_SLIPPAGE", "FAILED_GAS", "PENDING_TIMEOUT", "FAILED_OTHER"):
            if not last.get("broadcast", True) and last.get("reason"):
                break
        time.sleep(3 * attempt)
    _feed("EXECUTION_ERROR", label=label, last=last)
    return {"ok": False, "reason": "EXECUTION_ERROR_MAX_RETRIES", "last": last}


def run_dust_cycle(*, full_swap: bool = True) -> dict[str, Any]:
    from lia.brain.orchestrator import orchestrate
    from lia.brain.strategies import action_for
    from lia.calldata.swap import build_swap_tokens_fixed_input, build_wrap_egld

    egld_usd = _get_egld_usd()
    vol = 0.35
    orch = orchestrate(
        sentiment=0.15,
        volatility=vol,
        trend="SIDEWAYS",
        confidence=0.6,
        asset_state="Liquid",
    )
    strategy = str(orch.get("active") or "STRAT_YIELD_OPTIMIZER")
    action = action_for(strategy)  # type: ignore
    reason = f"Strategy:{strategy}|action:{action}|vol={vol}"
    _feed("DECISION", strategy=strategy, action=action, reason=reason)

    amount_egld = 0.001
    amount_usd = amount_egld * egld_usd
    amount_wei = int(amount_egld * 1e18)

    if action == "HOLD":
        return {"ok": True, "action": "HOLD", "strategy": strategy, "txs": []}

    # --- wrap ---
    def build_wrap(attempt: int) -> dict[str, Any]:
        gas = 10_000_000 + (attempt - 1) * 2_000_000
        return {
            "receiver": WEGLD_SC,
            "value": amount_wei,
            "data": build_wrap_egld(),
            "gas_limit": gas,
            "gas_price": _network_gas_price(),
        }

    wrap = send_with_retry(
        build_attempt=build_wrap,
        amount_egld=amount_egld,
        amount_usd=amount_usd,
        label="wrap_egld",
    )
    if not wrap.get("ok"):
        return {"ok": False, "strategy": strategy, "action": action, "wrap": wrap}

    if not full_swap:
        return {"ok": True, "strategy": strategy, "action": action, "wrap": wrap}

    # --- swap with dynamic min_out ---
    def build_swap(attempt: int) -> dict[str, Any]:
        bps = dynamic_slippage_bps(volatility=vol) + (attempt - 1) * 100  # widen each retry
        bps = min(500, bps)
        expected = amount_egld * egld_usd
        min_usdc = expected * (1.0 - bps / 10_000.0)
        min_out = max(1, int(min_usdc * 1e6))
        data = build_swap_tokens_fixed_input(
            token_in=WEGLD,
            amount_in_atomic=amount_wei,
            token_out=USDC,
            min_out_atomic=min_out,
        )
        return {
            "receiver": WEGLD_USDC_PAIR,
            "value": 0,
            "data": data,
            "gas_limit": 30_000_000 + (attempt - 1) * 5_000_000,
            "gas_price": _network_gas_price(),
            "slippage_bps": bps,
            "min_out": min_out,
        }

    swap = send_with_retry(
        build_attempt=build_swap,
        amount_egld=amount_egld,
        amount_usd=amount_usd,
        label="swap_wegld_usdc",
    )
    return {
        "ok": bool(swap.get("ok")),
        "strategy": strategy,
        "action": action,
        "reason": reason,
        "wrap": wrap,
        "swap": swap,
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--run", action="store_true")
    ap.add_argument("--wrap-only", action="store_true")
    args = ap.parse_args()
    if args.run:
        print(json.dumps(run_dust_cycle(full_swap=not args.wrap_only), indent=2))
        return
    print(json.dumps({"hint": "LIA_LIVE_TRADING=1 LIA_AUTONOMOUS_DUST=1 ... --run"}, indent=2))


if __name__ == "__main__":
    main()
