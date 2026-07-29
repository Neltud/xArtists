"""
UniversalExecutor — LIA v6
Signature PEM + broadcast gateway MultiversX (mainnet).

Env:
  LIA_LIVE_TRADING=1          # enable live send
  LIA_WALLET_PEM_PATH=...     # path to PEM (secret)
  LIA_CHAIN_ID=1
  LIA_MVX_API=https://api.multiversx.com
  LIA_MVX_PROXY=https://gateway.multiversx.com
"""
from __future__ import annotations

import os
import json
import time
from dataclasses import dataclass
from typing import Any, Optional

LIVE = os.getenv("LIA_LIVE_TRADING", "0") == "1"
PEM_PATH = os.getenv("LIA_WALLET_PEM_PATH", "")
CHAIN_ID = os.getenv("LIA_CHAIN_ID", "1")
API = os.getenv("LIA_MVX_API", "https://api.multiversx.com")
PROXY = os.getenv("LIA_MVX_PROXY", "https://gateway.multiversx.com")


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

    def _load_account(self):
        if self._account is not None:
            return self._account
        if not PEM_PATH or not os.path.isfile(PEM_PATH):
            raise RuntimeError("LIA_WALLET_PEM_PATH missing — refuse live sign")
        from multiversx_sdk import Account  # type: ignore

        self._account = Account.new_from_pem(PEM_PATH)
        return self._account

    def _next_nonce(self, address: str) -> int:
        import urllib.request

        url = f"{API}/accounts/{address}"
        with urllib.request.urlopen(url, timeout=20) as r:
            data = json.loads(r.read().decode())
        return int(data.get("nonce", 0))

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
            # SDK variants differ; try common sign APIs
            if hasattr(account, "sign_transaction"):
                account.sign_transaction(tx)
            elif hasattr(tx, "signature") and hasattr(account, "signer"):
                tx.signature = account.signer.sign(tx.serialize_for_signing())

            provider = ProxyNetworkProvider(PROXY)
            tx_hash = provider.send_transaction(tx)
            self.breaker.record_success()
            h = tx_hash if isinstance(tx_hash, str) else str(tx_hash)
            return ExecResult(True, h, "live", f"sent {h}")
        except Exception as e:
            self.breaker.record_failure()
            return ExecResult(False, None, "live", str(e))

    def micro_swap_test_egld_self(self, amount_wei: int = 1000) -> ExecResult:
        """
        Micro test mainnet: self-transfer tiny EGLD (dust) to prove sign+broadcast.
        amount_wei default 1000 = 0.000000000000001 EGLD
        """
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
        # data_hex expected as plain function data string for now
        return self.sign_and_send(
            receiver=router,
            value=0,
            data=data_hex,
            gas_limit=gas_limit,
        )

    def health(self) -> dict[str, Any]:
        return {
            "live": LIVE,
            "pem_configured": bool(PEM_PATH and os.path.isfile(PEM_PATH)),
            "breaker_failures": self.breaker.failures,
            "breaker_open": not self.breaker.allow(),
            "api": API,
            "proxy": PROXY,
        }


if __name__ == "__main__":
    ex = UniversalExecutor()
    print(json.dumps(ex.health(), indent=2))
    print(ex.micro_swap_test_egld_self())
