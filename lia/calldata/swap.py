"""
Swap calldata — xExchange mainnet.
P4.5: min_out uses historical slippage guard (wider buffer if realized slip high).
"""
from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]

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


def slippage_guard_bps(base_bps: int = 100) -> int:
    """Widen min_out buffer when realized global slip is high."""
    path = ROOT / "data" / "performance_delta.json"
    bps = base_bps
    try:
        if path.is_file():
            d = json.loads(path.read_text(encoding="utf-8"))
            slip = d.get("avg_slippage_global")
            if slip is not None:
                # e.g. 6.7% → add ~670 bps, cap 1500
                extra = int(float(slip) * 10_000)
                bps = min(1500, max(base_bps, base_bps + extra // 2))
    except Exception:
        pass
    return bps


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
    if min_out_atomic <= 0:
        raise ValueError("min_out_atomic must be > 0")
    return (
        f"ESDTTransfer@{_token_hex(token_in)}@{_amount_hex(amount_in_atomic)}"
        f"@{_fn_hex('swapTokensFixedInput')}@{_token_hex(token_out)}@{_amount_hex(min_out_atomic)}"
    )


def dust_egld_to_usdc_plan(
    *,
    amount_egld: float = 0.001,
    egld_usd: float | None = None,
    base_slippage_bps: int = 100,
    pair: str = WEGLD_USDC_PAIR,
    wegld_sc: str = WEGLD_SC,
    wegld: str = WEGLD_MAINNET,
    usdc: str = USDC_MAINNET,
) -> dict[str, Any]:
    amount_wei = int(amount_egld * 1e18)
    px = float(egld_usd or 4.5)
    bps = slippage_guard_bps(base_slippage_bps)
    expected_usdc = amount_egld * px
    min_usdc = expected_usdc * (1.0 - bps / 10_000.0)
    min_out = max(1, int(min_usdc * 1e6))
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
            note=f"slippage_guard_bps={bps} min_usdc≈{min_usdc:.6f}",
        ),
    ]
    return {
        "schema": "calldata_plan/v1",
        "pair": "EGLD→USDC",
        "amount_egld": amount_egld,
        "slippage_guard_bps": bps,
        "min_usdc": min_usdc,
        "steps": [asdict(s) for s in steps],
        "proven_tx_swap": "c45847d433089839357edff157251b54c554abeacd548600f3b2ea09b5e25bd7",
    }


if __name__ == "__main__":
    import json as _json

    print(_json.dumps(dust_egld_to_usdc_plan(), indent=2))
