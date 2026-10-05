"""
P1 — Dry-run swap / ESDT calldata with min_out from market price.

  PYTHONPATH=. python -m lia.calldata.dry_run
  PYTHONPATH=. python -m lia.calldata.dry_run --egld 0.001 --slippage-bps 100

Never broadcasts. Never sets LIA_LIVE_TRADING.
"""
from __future__ import annotations

import argparse
import json
import urllib.request
from typing import Any

from lia.calldata.esdt import build_esdt_transfer
from lia.calldata.swap import (
    USDC_MAINNET,
    WEGLD_MAINNET,
    build_swap_tokens_fixed_input,
    dust_egld_to_usdc_plan,
)

API = "https://api.multiversx.com"


def fetch_egld_usd() -> float:
    try:
        req = urllib.request.Request(f"{API}/economics", headers={"User-Agent": "xArtists-dry-run/1.0"})
        with urllib.request.urlopen(req, timeout=12) as r:
            econ = json.loads(r.read().decode())
            px = float(econ.get("price") or 0)
            if px > 0:
                return px
    except Exception:
        pass
    return 20.0


def min_usdc_from_egld(amount_egld: float, egld_usd: float, slippage_bps: int) -> float:
    """Expected USDC out after slippage buffer (USDC ~1 USD)."""
    notional = amount_egld * egld_usd
    slip = max(0, slippage_bps) / 10_000.0
    return round(notional * (1.0 - slip), 6)


def run(*, amount_egld: float = 0.001, slippage_bps: int = 100) -> dict[str, Any]:
    egld_usd = fetch_egld_usd()
    min_usdc = min_usdc_from_egld(amount_egld, egld_usd, slippage_bps)
    plan = dust_egld_to_usdc_plan(amount_egld=amount_egld, min_usdc=min_usdc)

    # Also log pure ESDTTransfer dust shape (TRO self-path readiness)
    tro_atomic = 100_000_000_000_000  # 0.0001 * 1e18
    esdt_data = build_esdt_transfer("TRO-94c925", tro_atomic)

    swap_step = next((s for s in plan["steps"] if s["label"] == "swap_wegld_usdc"), None)
    data_str = swap_step["data"] if swap_step else ""
    data_hex = data_str.encode("utf-8").hex() if data_str else ""

    out = {
        "schema": "calldata_dry_run/v1",
        "paper": True,
        "LIA_LIVE_TRADING": 0,
        "market": {"egld_usd": egld_usd, "slippage_bps": slippage_bps},
        "min_out": {
            "usdc": min_usdc,
            "usdc_atomic": int(min_usdc * 1e6),
            "note": "min_out applied inside swapTokensFixedInput arg",
        },
        "plan": plan,
        "logs": {
            "swap_data_string": data_str,
            "swap_data_hex": data_hex,
            "esdt_tro_dust_data": esdt_data,
            "esdt_tro_dust_hex": esdt_data.encode("utf-8").hex(),
        },
        "validation": {
            "min_out_nonzero": min_usdc > 0,
            "pair": plan.get("pair"),
            "steps": len(plan.get("steps") or []),
        },
        "note": "DRY-RUN only — no broadcast, no keys",
    }
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--egld", type=float, default=0.001)
    ap.add_argument("--slippage-bps", type=int, default=100, help="100 = 1% slip buffer")
    args = ap.parse_args()
    print(json.dumps(run(amount_egld=args.egld, slippage_bps=args.slippage_bps), indent=2))


if __name__ == "__main__":
    main()
