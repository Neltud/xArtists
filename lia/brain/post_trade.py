"""
Post-trade analysis — intended vs executed (slippage feedback).

  PYTHONPATH=. python -m lia.brain.post_trade
"""
from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"


def analyze(
    *,
    intended_out: float,
    executed_out: float,
    intended_in: float,
    token_in: str,
    token_out: str,
    tx_hash: str | None = None,
    strategy: str | None = None,
) -> dict[str, Any]:
    slip = None
    if intended_out and intended_out > 0:
        slip = (intended_out - executed_out) / intended_out
    row = {
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "token_in": token_in,
        "token_out": token_out,
        "intended_in": intended_in,
        "intended_out": intended_out,
        "executed_out": executed_out,
        "slippage": round(slip, 6) if slip is not None else None,
        "tx_hash": tx_hash,
        "strategy": strategy,
        "paper": tx_hash is None,
    }
    path = DATA / "post_trade_log.jsonl"
    DATA.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(row) + "\n")
    return row


def summary(limit: int = 50) -> dict[str, Any]:
    path = DATA / "post_trade_log.jsonl"
    rows: list[dict[str, Any]] = []
    if path.is_file():
        for line in path.read_text(encoding="utf-8").splitlines()[-limit:]:
            try:
                rows.append(json.loads(line))
            except Exception:
                pass
    slips = [r["slippage"] for r in rows if r.get("slippage") is not None]
    avg = sum(slips) / len(slips) if slips else None
    return {
        "schema": "post_trade_summary/v1",
        "n": len(rows),
        "avg_slippage": round(avg, 6) if avg is not None else None,
        "last": rows[-5:] if rows else [],
        "note": "Feed avg_slippage into sizing / min_out buffers",
    }


def main() -> None:
    # Seed with known dust swap (intended ~0.004479 USDC min, executed 0.00418)
    analyze(
        intended_out=0.004479,
        executed_out=0.00418,
        intended_in=0.001,
        token_in="WEGLD-bd4d79",
        token_out="USDC-c76f1f",
        tx_hash="c45847d433089839357edff157251b54c554abeacd548600f3b2ea09b5e25bd7",
        strategy="STRAT_MICRO_PROOF",
    )
    print(json.dumps(summary(), indent=2))


if __name__ == "__main__":
    main()
