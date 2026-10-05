"""
Hardened autonomous dust execution — dynamic slip, retry, lifecycle telemetry.

  LIA_LIVE_TRADING=1 LIA_AUTONOMOUS_DUST=1 LIA_PEM_PATH=... \\
    PYTHONPATH=. python -m lia.guardian.execution_engine --run
  PYTHONPATH=. python -m lia.guardian.execution_engine --run-swap  # WEGLD→USDC with retry
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
TELEMETRY = DATA / "execution_telemetry.json"
API = "https://api.multiversx.com"
WEGLD_SC = "erd1qqqqqqqqqqqqqpgqhe8t5jewej70zupmh44jurgn29psua5l2jps3ntjj3"
WEGLD_USDC_PAIR = "erd1qqqqqqqqqqqqqpgqeel2kumf0r8ffyhth7pqdujjat9nx0862jpsg2pqaq"
WEGLD = "WEGLD-bd4d79"
USDC = "USDC-c76f1f"

MAX_RETRIES = 3
GAS_PRICE_DEFAULT = 1_000_000_000
GAS_PRICE_MAX = 2_000_000_000


def _env_live() -> bool:
    return os.environ.get("LIA_LIVE_TRADING", "0").strip() in ("1", "true", "TRUE")


def _env_auto() -> bool:
    return os.environ.get("LIA_AUTONOMOUS_DUST", "0").strip() in ("1", "true", "TRUE")


def _feed(event: str, **kw: Any) -> None:
    DATA.mkdir(parents=True, exist_ok=True)
    row = {"ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "event": event, **kw}
    with FEED.open("a", encoding="utf-8") as f:
        f.write(json.dumps(row) + "\n")
    # rolling telemetry snapshot for UI poll
    lines = FEED.read_text(encoding="utf-8").splitlines()[-40:] if FEED.is_file() else []
    events = []
    for line in lines:
        try:
            events.append(json.loads(line))
        except Exception:
            pass
    snap = {
        "schema": "execution_telemetry/v1",
        "updated": row["ts"],
        "last": row,
        "events": events,
    }
    TELEMETRY.write_text(json.dumps(snap, indent=2), encoding="utf-8")
    for dest in (
        ROOT / "apps" / "frontend" / "public" / "data" / "execution_telemetry.json",
        ROOT / "docs" / "data" / "execution_telemetry.json",
    ):
        try:
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(json.dumps(snap, indent=2), encoding="utf-8")
        except OSError:
            pass


def _api_get(path: str) -> Any:
    req = urllib.request.Request(f"{API}{path}", headers={"User-Agent": "xArtists-exec/2.0"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read().decode())


def _get_account(address: str) -> dict[str, Any]:
    return _api_get(f"/accounts/{address}")


def _get_egld_usd() -> float:
    try:
        return float(_api_get("/economics").get("price") or 4.5)
    except Exception:
        return 4.5


def _gas_price() -> int:
    """Network gas price oracle — MultiversX often fixed; still clamp."""
    try:
        cfg = _api_get("/network/config")
        # various shapes
        gp = cfg.get("gasPrice") or (cfg.get("config") or {}).get("erd_min_gas_price")
        if gp is not None:
            return min(GAS_PRICE_MAX, max(GAS_PRICE_DEFAULT, int(gp)))
    except Exception:
        pass
    return GAS_PRICE_DEFAULT


def dynamic_slippage_bps(*, base_bps: int = 100) -> int:
    """0.5%–5% from realized slip + mild vol proxy."""
    bps = base_bps
    path = ROOT / "data" / "performance_delta.json"
    try:
        if path.is_file():
            d = json.loads(path.read_text(encoding="utf-8"))
            slip = d.get("avg_slippage_global")
            if slip is not None:
                bps = max(bps, int(float(slip) * 10_000) + 50)
    except Exception:
        pass
    # hour-based mild vol
    h = time.gmtime().tm_hour
    if h in (14, 15, 16, 20, 21):  # busier UTC windows
        bps = int(bps * 1.25)
    return int(min(500, max(50, bps)))  # 0.5% .. 5%


def await_tx(tx_hash: str, *, timeout_s: int = 90) -> dict[str, Any]:
    deadline = time.time() + timeout_s
    last: dict[str, Any] = {}
    while time.time() < deadline:
        try:
            last = _api_get(f"/transactions/{tx_hash}")
            st = str(last.get("status") or "")
            if st == "success":
                return {"lifecycle": "CONFIRMED", "tx": last}
            if st == "fail" or st == "invalid":
                msg = ""
                for op in last.get("operations") or []:
                    if op.get("action") == "signalError":
                        msg = str(op.get("message") or "")
                        break
                if "slippage" in msg.lower():
                    return {"lifecycle": "FAILED_SLIPPAGE", "tx": last, "message": msg}
                if "gas" in msg.lower():
                    return {"lifecycle": "FAILED_GAS", "tx": last, "message": msg}
                return {"lifecycle": "FAILED", "tx": last, "message": msg or st}
        except Exception as e:
            last = {"error": str(e)}
        time.sleep(4)
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
            "lifecycle": "BLOCKED",
            "reason": "need_LIA_LIVE_TRADING=1_and_LIA_AUTONOMOUS_DUST=1",
            "broadcast": False,
        }

    signer, sender = load_signer()
    acc = _get_account(sender)
    wallet_egld = int(acc.get("balance") or 0) / 1e18
    nonce = int(acc.get("nonce") or 0)
    egld_usd = _get_egld_usd()
    equity = wallet_egld * egld_usd

    verdict = enforce(
        asset_type="TOKEN",
        token_id="EGLD",
        amount_egld=amount_egld,
        amount_usd=amount_usd,
        gas_limit=gas_limit,
        wallet_egld=wallet_egld,
        equity_usd=equity,
    )
    if not verdict.ok:
        _feed("RISK_BLOCK", reason=verdict.reason, label=label, checks=verdict.checks)
        return {"ok": False, "lifecycle": "BLOCKED", "reason": verdict.reason, "checks": verdict.checks}

    gp = gas_price or _gas_price()
    if gp > GAS_PRICE_MAX:
        _feed("GAS_WAIT", gas_price=gp)
        return {"ok": False, "lifecycle": "FAILED_GAS", "reason": "gas_price_above_threshold", "gas_price": gp}

    _feed("INTENT", label=label, amount_egld=amount_egld, receiver=receiver, gas_limit=gas_limit)

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

    try:
        resp = _broadcast(payload)
    except Exception as e:
        _feed("BROADCAST_ERROR", label=label, error=str(e))
        return {"ok": False, "lifecycle": "FAILED", "reason": f"broadcast_error:{e}"}

    tx_hash = resp.get("txHash") or resp.get("hash") or ""
    _feed("BROADCAST", label=label, tx_hash=tx_hash, status="PENDING")
    life = await_tx(tx_hash) if tx_hash else {"lifecycle": "FAILED", "message": "no_hash"}
    lifecycle = life.get("lifecycle")
    _feed(lifecycle, label=label, tx_hash=tx_hash, message=life.get("message"))

    ok = lifecycle == "CONFIRMED"
    if ok:
        record_trade_result(loss_usd=0.0)
    try:
        from lia.utils.audit_log import audit

        audit("exec_tx", label=label, tx_hash=tx_hash, lifecycle=lifecycle)
    except Exception:
        pass

    return {
        "ok": ok,
        "lifecycle": lifecycle,
        "tx_hash": tx_hash,
        "explorer": f"https://explorer.multiversx.com/transactions/{tx_hash}" if tx_hash else None,
        "sender": sender,
        "label": label,
        "message": life.get("message"),
        "response": resp,
    }


def execute_with_retry(
    *,
    build_step,
    amount_egld: float,
    amount_usd: float,
    label: str,
) -> dict[str, Any]:
    """build_step(attempt) -> dict receiver,value,data,gas_limit; attempt 0..MAX_RETRIES-1"""
    attempts = []
    for attempt in range(MAX_RETRIES):
        step = build_step(attempt)
        _feed("RETRYING" if attempt else "ATTEMPT", attempt=attempt, label=label)
        out = sign_and_send(
            receiver=str(step["receiver"]),
            value=int(step["value"]),
            data=str(step["data"]),
            gas_limit=int(step["gas_limit"]),
            amount_egld=amount_egld,
            amount_usd=amount_usd,
            label=f"{label}_a{attempt}",
            gas_price=step.get("gas_price"),
        )
        attempts.append(out)
        if out.get("ok"):
            return {"ok": True, "attempts": attempts, "final": out}
        life = out.get("lifecycle")
        if life in ("BLOCKED", "FAILED_GAS") and attempt == 0 and life == "BLOCKED":
            break  # risk — do not spam
        if life not in ("FAILED_SLIPPAGE", "FAILED", "PENDING_TIMEOUT"):
            if life == "BLOCKED":
                break
        time.sleep(3 + attempt * 2)
    _feed("EXECUTION_ERROR", label=label, attempts=len(attempts))
    return {"ok": False, "lifecycle": "EXECUTION_ERROR", "attempts": attempts}


def run_wrap_dust(amount_egld: float = 0.001) -> dict[str, Any]:
    amount_wei = int(amount_egld * 1e18)
    egld_usd = _get_egld_usd()

    def build(attempt: int) -> dict[str, Any]:
        return {
            "receiver": WEGLD_SC,
            "value": amount_wei,
            "data": "wrapEgld",
            "gas_limit": 10_000_000 + attempt * 1_000_000,
            "gas_price": _gas_price(),
        }

    return execute_with_retry(
        build_step=build,
        amount_egld=amount_egld,
        amount_usd=amount_egld * egld_usd,
        label="wrap_egld",
    )


def run_swap_dust(amount_egld: float = 0.001) -> dict[str, Any]:
    from lia.calldata.swap import build_swap_tokens_fixed_input

    amount_wei = int(amount_egld * 1e18)
    egld_usd = _get_egld_usd()

    def build(attempt: int) -> dict[str, Any]:
        bps = dynamic_slippage_bps(base_bps=100 + attempt * 100)  # widen each retry
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
            "gas_limit": 30_000_000 + attempt * 2_000_000,
            "gas_price": _gas_price(),
            "slippage_bps": bps,
            "min_out": min_out,
        }

    return execute_with_retry(
        build_step=build,
        amount_egld=amount_egld,
        amount_usd=amount_egld * egld_usd,
        label="swap_wegld_usdc",
    )


def run_dust_cycle(*, full_swap: bool = False) -> dict[str, Any]:
    from lia.brain.orchestrator import orchestrate
    from lia.brain.strategies import action_for

    orch = orchestrate(
        sentiment=0.15,
        volatility=0.3,
        trend="SIDEWAYS",
        confidence=0.6,
        asset_state="Liquid",
    )
    strategy = str(orch.get("active") or "STRAT_YIELD_OPTIMIZER")
    action = action_for(strategy)  # type: ignore
    _feed("DECISION", strategy=strategy, action=action, reason=orch.get("reason"))

    if action == "HOLD":
        return {"ok": True, "action": "HOLD", "strategy": strategy}

    wrap = run_wrap_dust(0.001)
    if not wrap.get("ok"):
        return {"ok": False, "strategy": strategy, "action": action, "wrap": wrap}

    if not full_swap:
        return {
            "ok": True,
            "strategy": strategy,
            "action": action,
            "wrap": wrap,
            "note": "wrap done; --run-swap for WEGLD→USDC with dynamic slip retries",
        }

    time.sleep(6)
    swap = run_swap_dust(0.001)
    return {"ok": swap.get("ok"), "strategy": strategy, "action": action, "wrap": wrap, "swap": swap}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--run", action="store_true")
    ap.add_argument("--run-swap", action="store_true")
    ap.add_argument("--full", action="store_true", help="wrap then swap")
    args = ap.parse_args()
    if args.run_swap:
        print(json.dumps(run_swap_dust(0.001), indent=2))
    elif args.run:
        print(json.dumps(run_dust_cycle(full_swap=args.full), indent=2))
    else:
        print(json.dumps({"hint": "--run | --run-swap | --run --full"}, indent=2))


if __name__ == "__main__":
    main()
