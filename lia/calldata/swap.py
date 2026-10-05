"""
Swap calldata — xExchange mainnet (verified 2026-10-05).
Function name args MUST be hex(ASCII) inside ESDTTransfer multi-arg.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any

from lia.calldata.esdt import build_esdt_transfer

WEGLD_MAINNET = "WEGLD-bd4d79"
USDC_MAINNET = "USDC-c76f1f"
WEGLD_SC = "erd1qqqqqqqqqqqqqpgqhe8t5jewej70zupmh44jurgn29psua5l2jps3ntjj3"
XEXCHANGE_ROUTER_MAINNET = "erd1qqqqqqqqqqqqqpgqq66xk9gfr4esuhem3jru86wg5hvp33a62jps2fy57p"
WEGLD_USDC_PAIR = "erd1qqqqqqqqqqqqqpgqeel2kumf0r8ffyhth7pqdujjat9nx0862jpsg2pqaq"


def _token_hex(token_id: str) -> str:
    return token_id.encode("ascii").hex()


def _amount_hex(amount_atomic: int) -> str:
    if amount_atomic < 0:
        raise ValueError("amount_atomic must be >= 0")
    h = format(int(amount_atomic), "x")
    return h if len(h) % 2 == 0 else "0" + h


def _fn_hex(name: str) -> str:
    return name.encode("ascii").hex()


@dataclass(frozen=True)
class CalldataStep:
    label: str
    receiver: str
    value: int
    data: str
    gas_limit: int
    note: str = ""


def build_wrap_egld() -> str:
    return "wrapEgld"


def build_swap_tokens_fixed_input(
    *,
    token_in: str,
    amount_in_atomic: int,
    token_out: str,
    min_out_atomic: int,
) -> str:
    """
    ESDTTransfer@token_in@amount@hex(swapTokensFixedInput)@token_out@min_out
    TX.receiver = pair (or router multiPair path).
    """
    if min_out_atomic <= 0:
        raise ValueError("min_out_atomic must be > 0 for live-safe plans")
    return (
        f"ESDTTransfer@{_token_hex(token_in)}@{_amount_hex(amount_in_atomic)}"
        f"@{_fn_hex('swapTokensFixedInput')}@{_token_hex(token_out)}@{_amount_hex(min_out_atomic)}"
    )


def dust_egld_to_usdc_plan(
    *,
    amount_egld: float = 0.001,
    min_usdc: float = 0.004,
    pair: str = WEGLD_USDC_PAIR,
    wegld_sc: str = WEGLD_SC,
    wegld: str = WEGLD_MAINNET,
    usdc: str = USDC_MAINNET,
) -> dict[str, Any]:
    amount_wei = int(amount_egld * 1e18)
    min_out = int(min_usdc * 1e6)
    if min_out <= 0:
        raise ValueError("min_usdc too small")
    steps = [
        CalldataStep(
            label="wrap_egld",
            receiver=wegld_sc,
            value=amount_wei,
            data=build_wrap_egld(),
            gas_limit=10_000_000,
            note="Native value = wrap amount",
        ),
        CalldataStep(
            label="swap_wegld_usdc",
            receiver=pair,
            value=0,
            data=build_swap_tokens_fixed_input(
                token_in=wegld,
                amount_in_atomic=amount_wei,
                token_out=usdc,
                min_out_atomic=min_out,
            ),
            gas_limit=30_000_000,
            note="Hex-encoded swapTokensFixedInput; min_out required",
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
        "addresses": {
            "wegld_sc": wegld_sc,
            "pair": pair,
            "router": XEXCHANGE_ROUTER_MAINNET,
        },
        "proven_tx_swap": "c45847d433089839357edff157251b54c554abeacd548600f3b2ea09b5e25bd7",
    }


if __name__ == "__main__":
    import json

    print(json.dumps(dust_egld_to_usdc_plan(), indent=2))
