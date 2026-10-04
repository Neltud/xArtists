"""
Beta micro-proof — dust EGLD self-transfer via UniversalExecutor.

  PYTHONPATH=. LIA_LIVE_TRADING=0 python -m lia.beta.micro_proof
  PYTHONPATH=. LIA_LIVE_TRADING=1 python -m lia.beta.micro_proof --live

Never commits PEM. Writes data/beta_micro_proof.json on completion.
"""
from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path

from lia.beta.allowlist import (
    EGLD_NATIVE,
    MAX_MICRO_EGLD,
    MIN_WALLET_EGLD_RESERVE,
    beta_preflight,
)

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "data" / "beta_micro_proof.json"

# 1e15 wei = 0.001 EGLD; use 1e14 = 0.0001 EGLD dust
DUST_WEI = 100_000_000_000_000  # 0.0001 EGLD
DUST_EGLD = DUST_WEI / 1e18


def main(argv: list[str] | None = None) -> dict:
    argv = argv or sys.argv[1:]
    want_live = "--live" in argv

    if want_live:
        os.environ["LIA_LIVE_TRADING"] = "1"
    else:
        os.environ.setdefault("LIA_LIVE_TRADING", "0")

    live = os.getenv("LIA_LIVE_TRADING", "0") == "1"

    gate = beta_preflight(token=EGLD_NATIVE, micro_egld=DUST_EGLD)
    payload: dict = {
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "token": EGLD_NATIVE,
        "dust_egld": DUST_EGLD,
        "max_micro_egld": MAX_MICRO_EGLD,
        "min_reserve_egld": MIN_WALLET_EGLD_RESERVE,
        "live_flag": live,
        "gate": {"ok": gate.ok, "reason": gate.reason},
    }

    if not gate.ok:
        payload["result"] = {"ok": False, "detail": gate.reason}
        _write(payload)
        print(json.dumps(payload, indent=2))
        return payload

    from lia.executor.universal_executor import UniversalExecutor

    ex = UniversalExecutor()
    health = ex.health()
    payload["health"] = health

    # Prefer dedicated micro helper
    res = ex.micro_swap_test_egld_self(amount_wei=DUST_WEI)
    payload["result"] = {
        "ok": res.ok,
        "tx_hash": res.tx_hash,
        "mode": res.mode,
        "detail": res.detail,
    }
    if res.tx_hash:
        payload["explorer"] = f"https://explorer.multiversx.com/transactions/{res.tx_hash}"

    _write(payload)
    print(json.dumps(payload, indent=2))
    return payload


def _write(payload: dict) -> None:
    try:
        OUT.parent.mkdir(parents=True, exist_ok=True)
        OUT.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    except OSError:
        pass


if __name__ == "__main__":
    main()
