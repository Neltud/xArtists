"""
UniversalExecutor — retries, circuit breaker, MultiversX TX helpers.

Vellum BaseNode. P1.1 (2026-09-15): force_mode=auto|live never submits on-chain
unless LIA_LIVE_TRADING=1 and PEM path is valid (lia.executor.mode.resolve_mode).
"""
import asyncio
import logging
from functools import wraps
from typing import Any

from multiversx_sdk import (
    Address,
    ProxyNetworkProvider,
    Transaction,
)
from vellum.workflows import BaseNode

try:
    from lia.executor.mode import resolve_mode, mode_report
except Exception:  # pragma: no cover
    import os
    from pathlib import Path as _P

    def resolve_mode(force_mode: str = "auto") -> str:
        fm = (force_mode or "auto").strip().lower()
        live = (os.environ.get("LIA_LIVE_TRADING") or "0").strip() == "1"
        pem = (os.environ.get("LIA_WALLET_PEM_PATH") or os.environ.get("PEM") or "").strip()
        pem_ok = bool(pem and _P(pem).expanduser().is_file())
        if fm == "paper":
            return "paper"
        if fm in ("live", "auto") and live and pem_ok:
            return "live"
        return "paper"

    def mode_report(force_mode: str = "auto") -> dict:
        return {
            "force_mode": force_mode,
            "resolved": resolve_mode(force_mode),
            "LIA_LIVE_TRADING": (os.environ.get("LIA_LIVE_TRADING") or "0").strip() == "1",
            "pem_configured": bool(
                (os.environ.get("LIA_WALLET_PEM_PATH") or os.environ.get("PEM") or "").strip()
            ),
        }

logger = logging.getLogger("UniversalExecutor")


def retry(max_retries=3, delay=1):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return await func(*args, **kwargs)
                except Exception:
                    if attempt == max_retries - 1:
                        raise
                    await asyncio.sleep(delay * (2 ** attempt))
            return None

        return wrapper

    return decorator


class CircuitBreakerOpen(Exception):
    pass


class CircuitBreaker:
    def __init__(self, threshold: int = 3) -> None:
        self.threshold = threshold
        self._failures = 0

    @property
    def is_open(self) -> bool:
        return self._failures >= self.threshold

    def record_success(self) -> None:
        self._failures = 0

    def record_failure(self) -> None:
        self._failures += 1
        logger.warning(
            "Circuit breaker failure count: %d/%d", self._failures, self.threshold
        )

    def reset(self) -> None:
        self._failures = 0


DEFAULT_GAS_SWAP = 10_000_000
DEFAULT_GAS_STAKE = 6_000_000
DEFAULT_GAS_UNSTAKE = 6_000_000
DEFAULT_GAS_CLAIM = 5_000_000


class UniversalExecutor(BaseNode):
    """Vellum node — paper by default; live only if resolve_mode == live."""

    wallet_address: str = (
        "erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6"
    )
    force_mode: str = "auto"
    actions: list[dict[str, Any]] = []
    max_slippage_pct: float = 3.0
    network_provider_url: str = "https://api.multiversx.com"
    circuit_breaker_threshold: int = 3

    class Outputs(BaseNode.Outputs):
        executed: list[dict[str, Any]]
        failed: list[dict[str, Any]]
        halted: bool
        circuit_breaker_active: bool
        total_gas_used: int
        total_slippage_pct: float
        summary: str

    class Display(BaseNode.Display):
        icon = "vellum:icon:function"
        color = "orange"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.proxy = ProxyNetworkProvider(self.network_provider_url)
        self.breaker = CircuitBreaker(threshold=self.circuit_breaker_threshold)
        self._executor = _ExecutorCore(
            proxy=self.proxy,
            breaker=self.breaker,
            max_slippage_pct=self.max_slippage_pct,
        )

    def run(self) -> "UniversalExecutor.Outputs":
        resolved = resolve_mode(self.force_mode)
        report = mode_report(self.force_mode)
        self._log(
            "INFO",
            f"UniversalExecutor force_mode={self.force_mode} resolved={resolved} "
            f"actions={len(self.actions)} report={report}",
        )

        executed: list[dict[str, Any]] = []
        failed: list[dict[str, Any]] = []
        halted = False

        if resolved == "paper":
            for action in self.actions:
                action = dict(action)
                action["result"] = "PAPER"
                action["resolved_mode"] = "paper"
                action["force_mode"] = self.force_mode
                executed.append(action)
            return self._build_output(
                executed,
                failed,
                halted=False,
                summary=(
                    f"Paper mode — {len(executed)} simulated actions "
                    f"(force_mode={self.force_mode}, resolved=paper)"
                ),
            )

        try:
            executed, failed, halted = asyncio.run(self._execute_all())
        except CircuitBreakerOpen as e:
            halted = True
            self._log("ERROR", f"CIRCUIT BREAKER TRIPPED: {e}")
        except Exception as e:
            self._log("ERROR", f"Executor fatal error: {e}")

        summary = (
            f"HALTED — executed={len(executed)} failed={len(failed)}"
            if halted
            else f"LIVE executed={len(executed)} failed={len(failed)}"
        )
        return self._build_output(executed, failed, halted, summary)

    async def _execute_all(
        self,
    ) -> tuple[list[dict[str, Any]], list[dict[str, Any]], bool]:
        executed: list[dict[str, Any]] = []
        failed: list[dict[str, Any]] = []
        for action in self.actions:
            if self.breaker.is_open:
                raise CircuitBreakerOpen("3 consecutive failures reached")
            workflow_name = str(action.get("type", "")).split("_")[0].lower()
            inputs = {"wallet_address": self.wallet_address, **action}
            try:
                result = await self._executor.execute_workflow(workflow_name, inputs)
                if result and result.get("success"):
                    executed.append({**action, **result})
                else:
                    failed.append({**action, **(result or {})})
            except Exception as e:
                self._log("ERROR", f"Action {action.get('type')} failed: {e}")
                failed.append({**action, "success": False, "error": str(e)})
        return executed, failed, self.breaker.is_open

    def _build_output(
        self,
        executed: list[dict[str, Any]],
        failed: list[dict[str, Any]],
        halted: bool,
        summary: str,
    ) -> "UniversalExecutor.Outputs":
        total_gas = sum(int(r.get("gas_used", 0) or 0) for r in executed)
        slips = [
            float(r.get("slippage_pct", 0) or 0)
            for r in executed
            if r.get("slippage_pct") is not None
        ]
        total_slip = (sum(slips) / len(slips)) if slips else 0.0
        return self.Outputs(
            executed=executed,
            failed=failed,
            halted=halted,
            circuit_breaker_active=halted and self.breaker.is_open,
            total_gas_used=total_gas,
            total_slippage_pct=round(total_slip, 4),
            summary=summary,
        )

    def _log(self, severity: str, message: str) -> None:
        try:
            self._context.emit_log_event(severity=severity, message=message)
        except Exception:
            getattr(logger, severity.lower(), logger.info)(message)


class _ExecutorCore:
    def __init__(
        self,
        proxy: ProxyNetworkProvider,
        breaker: CircuitBreaker,
        max_slippage_pct: float = 3.0,
    ) -> None:
        self.proxy = proxy
        self.breaker = breaker
        self.max_slippage_pct = max_slippage_pct

    @retry()
    async def execute_workflow(self, workflow_name: str, inputs: dict) -> dict[str, Any]:
        name = workflow_name.lower()
        if name in ("swap", "buy", "sell"):
            return await self.execute_swap(inputs)
        if name in ("stake",):
            return await self.execute_stake(inputs)
        if name in ("unstake",):
            return await self.execute_unstake(inputs)
        if name in ("claim", "claimrewards"):
            return await self.execute_claim_rewards(inputs)
        return {"success": False, "error": f"Unknown workflow: {workflow_name}"}

    @retry()
    async def execute_swap(self, inputs: dict) -> dict[str, Any]:
        if self.breaker.is_open:
            raise CircuitBreakerOpen("Circuit breaker open — swap blocked")
        sender = inputs.get("wallet_address", "")
        receiver = inputs.get("pair_address") or inputs.get("receiver", "")
        amount_usd = float(inputs.get("amount_usd", 0) or 0)
        data = inputs.get("data", f"swap({amount_usd})")
        try:
            tx_hash, gas = await self._submit_transaction(
                sender, receiver, data, gas_limit=DEFAULT_GAS_SWAP
            )
            self.breaker.record_success()
            return {
                "success": True,
                "tx_hash": tx_hash,
                "gas_used": gas,
                "actual_price": inputs.get("price_usd", 0.0),
                "slippage_pct": self._estimate_slippage(inputs),
            }
        except Exception as e:
            self.breaker.record_failure()
            logger.error("execute_swap failed: %s", e)
            return {"success": False, "error": str(e), "gas_used": 0}

    @retry()
    async def execute_stake(self, inputs: dict) -> dict[str, Any]:
        if self.breaker.is_open:
            raise CircuitBreakerOpen("Circuit breaker open — stake blocked")
        sender = inputs.get("wallet_address", "")
        receiver = inputs.get("contract_address") or inputs.get("receiver", "")
        amount = inputs.get("amount") or inputs.get("amount_usd", 0)
        data = inputs.get("data", f"stake@{amount}")
        try:
            tx_hash, gas = await self._submit_transaction(
                sender, receiver, data, gas_limit=DEFAULT_GAS_STAKE
            )
            self.breaker.record_success()
            return {
                "success": True,
                "tx_hash": tx_hash,
                "gas_used": gas,
                "actual_price": 0.0,
                "slippage_pct": 0.0,
            }
        except Exception as e:
            self.breaker.record_failure()
            logger.error("execute_stake failed: %s", e)
            return {"success": False, "error": str(e), "gas_used": 0}

    @retry()
    async def execute_unstake(self, inputs: dict) -> dict[str, Any]:
        if self.breaker.is_open:
            raise CircuitBreakerOpen("Circuit breaker open — unstake blocked")
        sender = inputs.get("wallet_address", "")
        receiver = inputs.get("contract_address") or inputs.get("receiver", "")
        token_id = inputs.get("token_id", "")
        amount = inputs.get("amount") or inputs.get("amount_usd", 0)
        data = inputs.get("data", f"unstake@{token_id}@{amount}")
        try:
            tx_hash, gas = await self._submit_transaction(
                sender, receiver, data, gas_limit=DEFAULT_GAS_UNSTAKE
            )
            self.breaker.record_success()
            return {
                "success": True,
                "tx_hash": tx_hash,
                "gas_used": gas,
                "actual_price": 0.0,
                "slippage_pct": 0.0,
            }
        except Exception as e:
            self.breaker.record_failure()
            logger.error("execute_unstake failed: %s", e)
            return {"success": False, "error": str(e), "gas_used": 0}

    @retry()
    async def execute_claim_rewards(self, inputs: dict) -> dict[str, Any]:
        if self.breaker.is_open:
            raise CircuitBreakerOpen("Circuit breaker open — claim blocked")
        sender = inputs.get("wallet_address", "")
        receiver = inputs.get("contract_address") or inputs.get("receiver", "")
        data = inputs.get("data", "claimRewards")
        try:
            tx_hash, gas = await self._submit_transaction(
                sender, receiver, data, gas_limit=DEFAULT_GAS_CLAIM
            )
            self.breaker.record_success()
            return {
                "success": True,
                "tx_hash": tx_hash,
                "gas_used": gas,
                "actual_price": 0.0,
                "slippage_pct": 0.0,
            }
        except Exception as e:
            self.breaker.record_failure()
            logger.error("execute_claim_rewards failed: %s", e)
            return {"success": False, "error": str(e), "gas_used": 0}

    async def _submit_transaction(
        self, sender: str, receiver: str, data: str, gas_limit: int
    ) -> tuple[str, int]:
        if resolve_mode("live") == "paper":
            raise RuntimeError(
                "LIVE submit blocked — LIA_LIVE_TRADING!=1 or PEM missing (mode.py)"
            )

        sender_addr = Address.from_bech32(sender) if sender else None
        receiver_addr = Address.from_bech32(receiver) if receiver else None
        account = self.proxy.get_account(sender_addr) if sender_addr else None
        nonce = account.nonce if account else 0

        tx = Transaction(
            sender=sender_addr,
            receiver=receiver_addr,
            gas_limit=gas_limit,
            nonce=nonce,
            data=data.encode() if isinstance(data, str) else data,
            chain_id="1",
        )

        tx_hash = self.proxy.send_transaction(tx)
        logger.info("Submitted tx %s (gas=%d)", tx_hash, gas_limit)

        on_chain = self.proxy.get_transaction(tx_hash, with_results=True)
        gas_used = getattr(on_chain, "gas_used", gas_limit) or gas_limit
        status = getattr(on_chain, "status", None)
        if status is not None and str(status).lower() not in (
            "success",
            "1",
            "completed",
        ):
            raise RuntimeError(f"Transaction {tx_hash} status: {status}")
        return str(tx_hash), int(gas_used)

    def _estimate_slippage(self, inputs: dict) -> float:
        expected = float(inputs.get("expected_price", 0) or 0)
        actual = float(inputs.get("price_usd", 0) or 0)
        if expected > 0 and actual > 0:
            return round(abs(actual - expected) / expected * 100, 4)
        return 0.0
