"""Post-trade → performance_delta.json for orchestrator real weights."""
from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"
DELTA_PATH = DATA / "performance_delta.json"
LOG_PATH = DATA / "post_trade_log.jsonl"


def analyze(
    *,
    intended_out: float,
    executed_out: float,
    intended_in: float,
    token_in: str,
    token_out: str,
    intended_price: float | None = None,
    executed_price: float | None = None,
    tx_hash: str | None = None,
    strategy: str | None = None,
) -> dict[str, Any]:
    slip = None
    if intended_out and intended_out > 0:
        slip = (intended_out - executed_out) / intended_out
    price_slip = None
    if intended_price and executed_price and intended_price > 0:
        price_slip = (intended_price - executed_price) / intended_price
    row = {
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "token_in": token_in,
        "token_out": token_out,
        "intended_in": intended_in,
        "intended_out": intended_out,
        "executed_out": executed_out,
        "intended_price": intended_price,
        "executed_price": executed_price,
        "slippage": round(slip, 6) if slip is not None else None,
        "price_slippage": round(price_slip, 6) if price_slip is not None else None,
        "tx_hash": tx_hash,
        "strategy": strategy or "UNKNOWN",
        "paper": tx_hash is None,
        "real": tx_hash is not None,
    }
    DATA.mkdir(parents=True, exist_ok=True)
    with LOG_PATH.open("a", encoding="utf-8") as f:
        f.write(json.dumps(row) + "\n")
    rebuild_delta()
    return row


def _read_log(limit: int = 200) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    if not LOG_PATH.is_file():
        return rows
    for line in LOG_PATH.read_text(encoding="utf-8").splitlines()[-limit:]:
        try:
            rows.append(json.loads(line))
        except Exception:
            pass
    return rows


def rebuild_delta() -> dict[str, Any]:
    rows = _read_log()
    by_strat: dict[str, list] = {}
    for r in rows:
        by_strat.setdefault(str(r.get("strategy") or "UNKNOWN"), []).append(r)
    strategies: dict[str, Any] = {}
    for sid, items in by_strat.items():
        real = [x for x in items if x.get("real")]
        slips = [x["slippage"] for x in real if x.get("slippage") is not None]
        avg_slip = sum(slips) / len(slips) if slips else None
        weight = 1.0 if avg_slip is None else max(0.5, min(1.0, 1.0 - float(avg_slip) * 5.0))
        strategies[sid] = {
            "n_real": len(real),
            "n_total": len(items),
            "avg_slippage": round(avg_slip, 6) if avg_slip is not None else None,
            "dominance_weight": round(weight, 4),
            "last_tx": real[-1].get("tx_hash") if real else None,
        }
    all_real = [x for x in rows if x.get("real")]
    all_slips = [x["slippage"] for x in all_real if x.get("slippage") is not None]
    delta = {
        "schema": "performance_delta/v1",
        "updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "n_real": len(all_real),
        "avg_slippage_global": round(sum(all_slips) / len(all_slips), 6) if all_slips else None,
        "strategies": strategies,
        "note": "Orchestrator multiplies shadow weights by dominance_weight",
    }
    DELTA_PATH.write_text(json.dumps(delta, indent=2), encoding="utf-8")
    for dest in (
        ROOT / "apps" / "frontend" / "public" / "data" / "performance_delta.json",
        ROOT / "docs" / "data" / "performance_delta.json",
    ):
        try:
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(json.dumps(delta, indent=2), encoding="utf-8")
        except OSError:
            pass
    return delta


def main() -> None:
    if not LOG_PATH.is_file() or LOG_PATH.stat().st_size < 10:
        analyze(
            intended_out=0.004479,
            executed_out=0.00418,
            intended_in=0.001,
            token_in="WEGLD-bd4d79",
            token_out="USDC-c76f1f",
            intended_price=4.479,
            executed_price=4.18,
            tx_hash="c45847d433089839357edff157251b54c554abeacd548600f3b2ea09b5e25bd7",
            strategy="STRAT_MICRO_PROOF",
        )
    print(json.dumps(rebuild_delta(), indent=2))


if __name__ == "__main__":
    main()
