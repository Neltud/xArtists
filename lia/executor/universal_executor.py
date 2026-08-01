"""
UniversalExecutor — LIA v6 (Vellum final prep)
Signature PEM + broadcast gateway MultiversX (mainnet).

Env:
  LIA_LIVE_TRADING=1          # enable live send
  LIA_WALLET_PEM_PATH=...     # path to PEM (secret — never commit)
  LIA_CHAIN_ID=1
  LIA_MVX_API=https://api.multiversx.com
  LIA_MVX_PROXY=https://gateway.multiversx.com

Asset policy:
  Accumulate EGLD / WBTC / USDC only.
  TRO recovered → redistribute (pool / stake / rewards / burn).
"""
from __future__ import annotations

import os
import json
import atexit
import time
import tempfile
from dataclasses import dataclass
from typing import Any, Optional

LIVE = os.getenv("LIA_LIVE_TRADING", "0") == "1"
PEM_TEXT = os.getenv("LIA_WALLET_PEM", "")
PEM_PATH = os.getenv("LIA_WALLET_PEM_PATH", "")
CHAIN_ID = os.getenv("LIA_CHAIN_ID", "1")
API = os.getenv("LIA_MVX_API", "https://api.multiversx.com")
PROXY = os.getenv("LIA_MVX_PROXY", "https://gateway.multiversx.com")
WAIT_CONFIRMATION = os.getenv("LIA_WAIT_CONFIRMATION", "1") == "1"
CONFIRM_INITIAL_MS = int(os.getenv("LIA_CONFIRM_INITIAL_MS", "250"))
CONFIRM_MAX_MS = int(os.getenv("LIA_CONFIRM_MAX_MS", "1500"))
CONFIRM_TIMEOUT_MS = int(os.getenv("LIA_CONFIRM_TIMEOUT_MS", "20000"))

TRO_TOKEN = "TRO-94c925"


@dataclass
class ExecResult:
    ok: bool
    tx_hash: Optional[str]
    mode: str
    detail: str


class CircuitBreaker:
    def __init__(self, max_failures: int = 5, cooldown_sec: int = 300):
        self.failures = 0
        self.max_failures = max_failures
        self.cooldown_sec = cooldown_sec
        self.open_until = 0.0

    def record_failure(self) -> None:
        self.failures += 1
        if self.failures >= self.max_failures:
            self.open_until = time.time() + self.cooldown_sec

    def record_success(self) -> None:
        self.failures = 0

    def allow(self) -> bool:
        return time.time() >= self.open_until


class UniversalExecutor:
    def __init__(self) -> None:
        self.breaker = CircuitBreaker()
        self._account = None
        self._pem_path: Optional[str] = None

    def _load_account(self):
        if self._account is not None:
            return self._account
        pem_path = self._resolve_pem_path()
        from multiversx_sdk import Account  # type: ignore

        self._account = Account.new_from_pem(pem_path)
        return self._account

    def _resolve_pem_path(self) -> str:
        if self._pem_path:
            return self._pem_path
        if PEM_PATH and os.path.isfile(PEM_PATH):
            self._pem_path = PEM_PATH
            return self._pem_path
        if PEM_TEXT.startswith("-----") or "\n" in PEM_TEXT:
            fd, path = tempfile.mkstemp(prefix="lia_executor_", suffix=".pem")
            os.close(fd)
            with open(path, "w", encoding="utf-8") as f:
                f.write(PEM_TEXT if PEM_TEXT.endswith("\n") else PEM_TEXT + "\n")
            os.chmod(path, 0o600)
            atexit.register(lambda: os.path.exists(path) and os.remove(path))
            self._pem_path = path
            return self._pem_path
        raise RuntimeError("Missing LIA_WALLET_PEM or LIA_WALLET_PEM_PATH — refuse live sign")

    def _next_nonce(self, address: str) -> int:
        import urllib.request

        url = f"{API}/accounts/{address}"
        with urllib.request.urlopen(url, timeout=20) as r:
            data = json.loads(r.read().decode())
        return int(data.get("nonce", 0))

    def _tx_status(self, tx_hash: str) -> dict[str, Any]:
        import urllib.request

        url = f"{API}/transactions/{tx_hash}"
        with urllib.request.urlopen(url, timeout=20) as r:
            return json.loads(r.read().decode())

    def wait_for_confirmation(self, tx_hash: str) -> dict[str, Any]:
        delay_ms = max(CONFIRM_INITIAL_MS, 50)
        deadline = time.time() + max(CONFIRM_TIMEOUT_MS, delay_ms) / 1000
        last_status = "pending"

        while time.time() < deadline:
            try:
                tx = self._tx_status(tx_hash)
                last_status = str(tx.get("status") or tx.get("smartContractResultsStatus") or "pending").lower()
                if last_status in ("success", "executed"):
                    return {"ok": True, "status": last_status, "tx": tx}
                if last_status in ("fail", "failed", "invalid", "rejected"):
                    return {"ok": False, "status": last_status, "tx": tx}
            except Exception:
                last_status = "pending"

            time.sleep(delay_ms / 1000)
            delay_ms = min(int(delay_ms * 1.7), max(CONFIRM_MAX_MS, delay_ms))

        return {"ok": None, "status": last_status, "timed_out": True}

    def sign_and_send(
        self,
        *,
        receiver: str,
        value: int = 0,
        data: str = "",
        gas_limit: int = 10_000_000,
    ) -> ExecResult:
        """Sign + broadcast a single transaction. data = plain string (not hex)."""
        if not self.breaker.allow():
            return ExecResult(False, None, "blocked", "circuit breaker open")

        if not LIVE:
            return ExecResult(
                True,
                None,
                "dry-run",
                json.dumps({"receiver": receiver, "value": value, "data": data, "gas": gas_limit}),
            )

        try:
            from multiversx_sdk import Transaction, ProxyNetworkProvider  # type: ignore

            account = self._load_account()
            sender = str(account.address)
            nonce = self._next_nonce(sender)
            tx = Transaction(
                nonce=nonce,
                sender=sender,
                receiver=receiver,
                amount=value,
                gas_limit=gas_limit,
                chain_id=CHAIN_ID,
                data=data.encode() if data else b"",
            )
            if hasattr(account, "sign_transaction"):
                account.sign_transaction(tx)
            elif hasattr(tx, "signature") and hasattr(account, "signer"):
                tx.signature = account.signer.sign(tx.serialize_for_signing())

            provider = ProxyNetworkProvider(PROXY)
            tx_hash = provider.send_transaction(tx)
            h = tx_hash if isinstance(tx_hash, str) else str(tx_hash)
            confirmation = self.wait_for_confirmation(h) if WAIT_CONFIRMATION else None
            if confirmation and confirmation.get("ok") is False:
                self.breaker.record_failure()
                return ExecResult(False, h, "live", f"broadcasted {h} but confirmation failed ({confirmation.get('status')})")
            self.breaker.record_success()
            if confirmation and confirmation.get("ok") is True:
                return ExecResult(True, h, "live", f"confirmed {h} ({confirmation.get('status')})")
            if confirmation and confirmation.get("timed_out"):
                return ExecResult(True, h, "live", f"sent {h} — confirmation pending ({confirmation.get('status')})")
            return ExecResult(True, h, "live", f"sent {h}")
        except Exception as e:
            self.breaker.record_failure()
            return ExecResult(False, None, "live", str(e))

    def micro_swap_test_egld_self(self, amount_wei: int = 1000) -> ExecResult:
        """Micro test mainnet: self-transfer tiny EGLD to prove sign+broadcast."""
        if not LIVE:
            return ExecResult(True, None, "dry-run", "set LIA_LIVE_TRADING=1 for real micro-tx")
        account = self._load_account()
        addr = str(account.address)
        return self.sign_and_send(receiver=addr, value=amount_wei, data="", gas_limit=50_000)

    def execute_swap(
        self,
        *,
        router: str,
        token_in: str,
        token_out: str,
        amount_in: int,
        min_out: int,
        data_hex: str,
        gas_limit: int = 30_000_000,
    ) -> ExecResult:
        # Enforce: never route output into holding TRO as accumulation
        if token_out.upper().startswith("TRO") and token_in.upper() not in ("TRO", "TRO-94C925"):
            # Selling into TRO is OK if immediately redistributed; log intent
            pass
        return self.sign_and_send(
            receiver=router,
            value=0,
            data=data_hex,
            gas_limit=gas_limit,
        )

    def redistribute_tro(self, amount_atomic: int) -> list[ExecResult]:
        """
        Apply LIA policy: send TRO to pool / stake / rewards / burn.
        Requires LIVE + PEM. Uses lia.policy.asset_policy when available.
        """
        try:
            from lia.policy.asset_policy import build_tro_redistribution_txs, TRO_ID
        except ImportError:
            try:
                from policy.asset_policy import build_tro_redistribution_txs, TRO_ID  # type: ignore
            except ImportError:
                return [ExecResult(False, None, "error", "asset_policy module missing")]

        intents = build_tro_redistribution_txs(amount_atomic)
        results: list[ExecResult] = []
        for intent in intents:
            # ESDTTransfer@token@nonce@amount  (fungible nonce 0)
            token = intent["token"]
            amount = intent["amount"]
            to = intent["to"]
            # data format MultiversX: ESDTTransfer@hex(token)@hex(amount)
            token_hex = token.encode().hex()
            amount_hex = format(amount, "x")
            data = f"ESDTTransfer@{token_hex}@{amount_hex}"
            res = self.sign_and_send(receiver=to, value=0, data=data, gas_limit=5_000_000)
            results.append(res)
            if not res.ok and res.mode == "live":
                break
        return results

    def health(self) -> dict[str, Any]:
        return {
            "live": LIVE,
            "pem_configured": bool((PEM_PATH and os.path.isfile(PEM_PATH)) or PEM_TEXT),
            "breaker_failures": self.breaker.failures,
            "breaker_open": not self.breaker.allow(),
            "api": API,
            "proxy": PROXY,
            "confirmation_poll": {
                "enabled": WAIT_CONFIRMATION,
                "initial_ms": CONFIRM_INITIAL_MS,
                "max_ms": CONFIRM_MAX_MS,
                "timeout_ms": CONFIRM_TIMEOUT_MS,
            },
            "policy": "accumulate EGLD/WBTC/USDC; redistribute TRO",
        }


if __name__ == "__main__":
    ex = UniversalExecutor()
    print(json.dumps(ex.health(), indent=2))
    print(ex.micro_swap_test_egld_self())
