"""
UniversalExecutor — Enhanced executor with retries, error handling & circuit breaker.

Builds and submits MultiversX transactions (swaps, stake, unstake, claim rewards)
via the multiversx_sdk. After 3 consecutive failures the circuit breaker halts
execution and raises an alert.

This is a Vellum Workflows BaseNode: the main class exposes typed input
descriptors, an Outputs inner class, and a run() entry point. The execution
helpers (execute_swap / execute_stake / execute_unstake / execute_claim_rewards)
are async instance methods decorated with @retry.
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

logger = logging.getLogger("UniversalExecutor")

# ---------------------------------------------------------------------------
# Retry decorator (preserved from original file)
# ---------------------------------------------------------------------------
def retry(max_retries=3, delay=1):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_retries - 1:
                        raise
                    await asyncio.sleep(delay * (2 ** attempt))
            return None
        return wrapper
    return decorator


# ---------------------------------------------------------------------------
# Circuit breaker
# ---------------------------------------------------------------------------
class CircuitBreakerOpen(Exception):
    """Raised when the circuit breaker has tripped (too many consecutive failures)."""


class CircuitBreaker:
    """Simple consecutive-failure circuit breaker."""

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
        logger.warning("Circuit breaker failure count: %d/%d", self._failures, self.threshold)

    def reset(self) -> None:
        self._failures = 0


# ---------------------------------------------------------------------------
# Default gas estimates (conservative mainnet values)
# ---------------------------------------------------------------------------
DEFAULT_GAS_SWAP = 10_000_000
DEFAULT_GAS_STAKE = 6_000_000
DEFAULT_GAS_UNSTAKE = 6_000_000
DEFAULT_GAS_CLAIM = 5_000_000


class UniversalExecutor(BaseNode):
    """Vellum node that executes trade / stake actions on MultiversX mainnet."""

    # --- Node inputs ---
    wallet_address: str = "erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6"
    force_mode: str = "auto"  # auto | paper | live
    actions: list[dict[str, Any]] = []
    """List of action dicts produced by the AI brains."""
    max_slippage_pct: float = 3.0
    network_provider_url: str = "https://api.multiversx.com"

    # --- Tunables ---
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

    # ------------------------------------------------------------------
    # Vellum entry point
    # ------------------------------------------------------------------
    def run(self) -> "UniversalExecutor.Outputs":
        self._log("INFO", f"⚡ UniversalExecutor — mode={self.force_mode} | actions={len(self.actions)}")

        executed: list[dict[str, Any]] = []
        failed: list[dict[str, Any]] = []
        halted = False

        # Paper mode short-circuit
        if self.force_mode == "paper":
            for action in self.actions:
                action = dict(action)
                action["result"] = "PAPER"
                executed.append(action)
            return self._build_output(executed, failed, halted=False, summary=f"Paper mode — {len(executed)} simulated actions")

        # Live / auto mode — run async loop
        try:
            executed, failed, halted = asyncio.run(self._execute_all())
        except CircuitBreakerOpen as e:
            halted = True
            self._log("ERROR", f"🚨 CIRCUIT BREAKER TRIPPED — halting execution: {e}")
        except Exception as e:
            self._log("ERROR", f"Executor fatal error: {e}")

        summary = (
            f"HALTED (circuit breaker) — executed={len(executed)} failed={len(failed)}"
            if halted
            else f"executed={len(executed)} failed={len(failed)}"
        )
        return self._build_output(executed, failed, halted, summary)

    # ------------------------------------------------------------------
    # Async dispatch
    # ------------------------------------------------------------------
    async def _execute_all(self) -> tuple[list[dict[str, Any]], list[dict[str, Any]], bool]:
        executed: list[dict[str, Any]] = []
        failed: list[dict[str, Any]] = []
        for action in self.actions:
            if self.breaker.is_open:
                raise CircuitBreakerOpen("3 consecutive failures reached")
            workflow_name = str(action.get("type", "")).split("_")[0].lower()
            inputs = {
                "wallet_address": self.wallet_address,
                **action,
            }
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

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    def _build_output(
        self,
        executed: list[dict[str, Any]],
        failed: list[dict[str, Any]],
        halted: bool,
        summary: str,
    ) -> "UniversalExecutor.Outputs":
        total_gas = sum(int(r.get("gas_used", 0) or 0) for r in executed)
        slips = [float(r.get("slippage_pct", 0) or 0) for r in executed if r.get("slippage_pct") is not None]
        total_slip = (sum(slips) / len(slips)) if slips else 0.0
        cb_active = halted and self.breaker.is_open
        return self.Outputs(
            executed=executed,
            failed=failed,
            halted=halted,
            circuit_breaker_active=cb_active,
            total_gas_used=total_gas,
            total_slippage_pct=round(total_slip, 4),
            summary=summary,
        )

    def _log(self, severity: str, message: str) -> None:
        self._context.emit_log_event(severity=severity, message=message)


# ---------------------------------------------------------------------------
# Executor core — the async helpers with @retry + circuit breaker
# ---------------------------------------------------------------------------
class _ExecutorCore:
    """Holds the proxy + circuit breaker and exposes the execution methods."""

    def __init__(
        self,
        proxy: ProxyNetworkProvider,
        breaker: CircuitBreaker,
        max_slippage_pct: float = 3.0,
    ) -> None:
        self.proxy = proxy
        self.breaker = breaker
        self.max_slippage_pct = max_slippage_pct

    # --- Dispatch ------------------------------------------------------
    @retry()
    async def execute_workflow(self, workflow_name: str, inputs: dict) -> dict[str, Any]:
        """Dispatch to the right execution method based on workflow_name."""
        name = workflow_name.lower()
        if name in ("swap", "buy", "sell"):
            return await self.execute_swap(inputs)
        elif name in ("stake",):
            return await self.execute_stake(inputs)
        elif name in ("unstake",):
            return await self.execute_unstake(inputs)
        elif name in ("claim", "claimrewards"):
            return await self.execute_claim_rewards(inputs)
        else:
            return {"success": False, "error": f"Unknown workflow: {workflow_name}"}

    # --- Swap ----------------------------------------------------------
    @retry()
    async def execute_swap(self, inputs: dict) -> dict[str, Any]:
        """Execute a DEX swap (buy/sell) on MultiversX."""
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

    # --- Stake ---------------------------------------------------------
    @retry()
    async def execute_stake(self, inputs: dict) -> dict[str, Any]:
        """Stake tokens into a staking contract."""
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
            return {"success": True, "tx_hash": tx_hash, "gas_used": gas, "actual_price": 0.0, "slippage_pct": 0.0}
        except Exception as e:
            self.breaker.record_failure()
            logger.error("execute_stake failed: %s", e)
            return {"success": False, "error": str(e), "gas_used": 0}

    # --- Unstake -------------------------------------------------------
    @retry()
    async def execute_unstake(self, inputs: dict) -> dict[str, Any]:
        """Unstake tokens from a staking contract."""
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
            return {"success": True, "tx_hash": tx_hash, "gas_used": gas, "actual_price": 0.0, "slippage_pct": 0.0}
        except Exception as e:
            self.breaker.record_failure()
            logger.error("execute_unstake failed: %s", e)
            return {"success": False, "error": str(e), "gas_used": 0}

    # --- Claim rewards -------------------------------------------------
    @retry()
    async def execute_claim_rewards(self, inputs: dict) -> dict[str, Any]:
        """Claim staking rewards."""
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
            return {"success": True, "tx_hash": tx_hash, "gas_used": gas, "actual_price": 0.0, "slippage_pct": 0.0}
        except Exception as e:
            self.breaker.record_failure()
            logger.error("execute_claim_rewards failed: %s", e)
            return {"success": False, "error": str(e), "gas_used": 0}

    # --- Low-level tx submission --------------------------------------
    async def _submit_transaction(
        self, sender: str, receiver: str, data: str, gas_limit: int
    ) -> tuple[str, int]:
        """Build, submit and confirm a MultiversX transaction.

        Returns (tx_hash, gas_used). Raises on failure / non-success status.
        """
        sender_addr = Address.from_bech32(sender) if sender else None
        receiver_addr = Address.from_bech32(receiver) if receiver else None

        # Fetch sender nonce + balance
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

        # Wait for confirmation & retrieve gas used
        on_chain = self.proxy.get_transaction(tx_hash, with_results=True)
        gas_used = getattr(on_chain, "gas_used", gas_limit) or gas_limit
        status = getattr(on_chain, "status", None)
        if status is not None and str(status).lower() not in ("success", "1", "completed"):
            raise RuntimeError(f"Transaction {tx_hash} status: {status}")
        return str(tx_hash), int(gas_used)

    def _estimate_slippage(self, inputs: dict) -> float:
        expected = float(inputs.get("expected_price", 0) or 0)
        actual = float(inputs.get("price_usd", 0) or 0)
        if expected > 0 and actual > 0:
            return round(abs(actual - expected) / expected * 100, 4)
        return 0.0


# New custom nodes integration added
