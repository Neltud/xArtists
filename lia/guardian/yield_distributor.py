"""
Cycle yield — credit managed balance from net profit (no token mint).

  PYTHONPATH=. python -m lia.guardian.yield_distributor --cycle
"""
from __future__ import annotations

import argparse
import json
import time
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"
BALANCES = DATA / "managed_balances.json"


def _load_balances() -> dict[str, Any]:
    if BALANCES.is_file():
        try:
            return json.loads(BALANCES.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"schema": "managed_balances/v1", "accounts": {}, "cycles": []}


def run_cycle(*, fee_bps: int = 50) -> dict[str, Any]:
    from lia.brain.performance_tracker import track_all
    from lia.utils.economic_compliance import validate_profits

    perf = track_all()
    bal = _load_balances()
    accounts = bal.setdefault("accounts", {})
    credits = []
    for row in perf.get("packs") or []:
        pid = str(row["pack_id"])
        net = float(row.get("net_profit_usd") or 0)
        fees = abs(net) * (fee_bps / 10_000.0)
        credit = round(net - fees, 6)
        acc = accounts.setdefault(
            pid,
            {"pack_id": pid, "balance_usd": 0.0, "lifetime_credited": 0.0},
        )
        # Set balance to equity view (not compound phantom)
        acc["balance_usd"] = round(float(row.get("equity_usd") or 0), 6)
        acc["lifetime_credited"] = round(float(acc.get("lifetime_credited") or 0) + max(0.0, credit), 6)
        acc["last_net_profit_usd"] = credit
        acc["updated"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        credits.append({"pack_id": pid, "credit_usd": credit, "fees_usd": round(fees, 6)})

    cycle = {
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "credits": credits,
        "fee_bps": fee_bps,
    }
    bal.setdefault("cycles", []).append(cycle)
    bal["cycles"] = bal["cycles"][-30:]
    bal["updated"] = cycle["ts"]

    compliance = validate_profits(perf, bal)
    bal["last_compliance"] = compliance

    DATA.mkdir(parents=True, exist_ok=True)
    BALANCES.write_text(json.dumps(bal, indent=2), encoding="utf-8")
    for dest in (
        ROOT / "apps" / "frontend" / "public" / "data" / "managed_balances.json",
        ROOT / "docs" / "data" / "managed_balances.json",
    ):
        try:
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(json.dumps(bal, indent=2), encoding="utf-8")
        except OSError:
            pass

    try:
        from lia.utils.audit_log import audit

        audit("yield_cycle", n=len(credits), compliance_ok=compliance.get("ok"))
    except Exception:
        pass

    return {"cycle": cycle, "compliance": compliance, "accounts": accounts}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--cycle", action="store_true")
    args = ap.parse_args()
    if args.cycle:
        print(json.dumps(run_cycle(), indent=2))
    else:
        print(json.dumps(_load_balances(), indent=2))


if __name__ == "__main__":
    main()
