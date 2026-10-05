"""
Swap calldata scaffold — xExchange-style MultiversX.

IMPORTANT:
  - Addresses are mainnet references; verify on explorer before LIVE.
  - min_out must be computed off-chain (quote); never 0 in production.
  - This module only *builds strings*. Signing is UniversalExecutor.
  - Beta: pair restricted by lia.beta.allowlist (EGLD/USDC/TRO).

Typical dust path EGLD → USDC:
  1) wrap EGLD → WEGLD (optional depending on pool)
  2) ESDTTransfer WEGLD to router + swap endpoint
  OR multi-transfer pattern used by the specific router ABI

We expose a *plan* object so Guardian can execute steps with human review.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any

from lia.calldata.esdt import build_esdt_transfer, _amount_hex, _token_hex

# Mainnet references (verify before use)
WEGLD_MAINNET = "WEGLD-bd4d79"
USDC_MAINNET = "USDC-c76f1f"
# xExchange router — community mainnet (double-check explorer)
XEXCHANGE_ROUTER_MAINNET = "erd1qqqqqqqqqqqqqpgqq66xk9gfr4ugqddot94hmxstfuudut9u2jps0zkpcg"


@dataclass(frozen=True)
class CalldataStep:
    label: str
    receiver: str
    value: int  # atomic EGLD wei (0 for pure ESDT)
    data: str
    gas_limit: int
    note: str = ""


def build_wrap_egld() -> str:
    """Call data for wrapping EGLD on WEGLD contract (endpoint wrapEgld)."""
    return "wrapEgld"


def build_swap_tokens_fixed_input(
    *,
    token_in: str,
    amount_in_atomic: int,
    token_out: str,
    min_out_atomic: int,
) -> str:
    """
    Generic fixed-input swap payload fragment used by several MVX DEX routers.

    Format (hex args):
      swapTokensFixedInput@token_out@min_out

    Combined with ESDTTransfer of token_in to the router as TX data:
      ESDTTransfer@token_in@amount_in@swapTokensFixedInput@token_out@min_out

    Caller MUST set TX.receiver = router address.
    """
    if min_out_atomic < 0:
        raise ValueError("min_out_atomic must be >= 0")
    # Multi-arg ESDTTransfer with method name after amounts
    return (
        f"ESDTTransfer@{_token_hex(token_in)}@{_amount_hex(amount_in_atomic)}"
        f"@swapTokensFixedInput@{_token_hex(token_out)}@{_amount_hex(min_out_atomic)}"
    )


def dust_egld_to_usdc_plan(
    *,
    amount_egld: float = 0.001,
    min_usdc: float = 0.0,
    router: str = XEXCHANGE_ROUTER_MAINNET,
    wegld: str = WEGLD_MAINNET,
    usdc: str = USDC_MAINNET,
    wegld_sc: str = "erd1qqqqqqqqqqqqqpgqhe8t5jewej70zupmh44jurgn29psua5l2jps3ntjj3",
) -> dict[str, Any]:
    """
    Paper/ops plan for dust EGLD → USDC.

    Step A: wrap EGLD → WEGLD (value = amount, data = wrapEgld, receiver = WEGLD SC).
    Step B: swap WEGLD → USDC on router (value = 0, ESDTTransfer+swapTokensFixedInput).

    min_usdc=0 is ONLY for dry-run structure checks — live Beta must set min_out from quote.
    """
    amount_wei = int(amount_egld * 1e18)
    min_out = int(min_usdc * 1e6)  # USDC 6 decimals on MultiversX typically
    steps = [
        CalldataStep(
            label="wrap_egld",
            receiver=wegld_sc,
            value=amount_wei,
            data=build_wrap_egld(),
            gas_limit=8_000_000,
            note="Native value must equal wrap amount",
        ),
        CalldataStep(
            label="swap_wegld_usdc",
            receiver=router,
            value=0,
            data=build_swap_tokens_fixed_input(
                token_in=wegld,
                amount_in_atomic=amount_wei,
                token_out=usdc,
                min_out_atomic=min_out,
            ),
            gas_limit=30_000_000,
            note="Requires WEGLD balance after wrap; set min_out from quote before LIVE",
        ),
    ]
    return {
        "schema": "calldata_plan/v1",
        "pair": "EGLD→USDC",
        "paper_default": True,
        "amount_egld": amount_egld,
        "min_usdc": min_usdc,
        "steps": [asdict(s) for s in steps],
        "allowlist": ["EGLD", usdc, wegld],
        "warning": "Verify router/WEGLD SC on explorer before broadcast. min_out=0 is unsafe live.",
    }


if __name__ == "__main__":
    import json

    print(json.dumps(dust_egld_to_usdc_plan(amount_egld=0.001, min_usdc=0.0), indent=2))
