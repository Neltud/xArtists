"""
Real-value compliance — user profit must not exceed market + RWA gains.

  PYTHONPATH=. python -m lia.utils.economic_compliance
"""
from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"


def validate_profits(
    performance: dict[str, Any] | None = None,
    balances: dict[str, Any] | None = None,
) -> dict[str, Any]:
    if performance is None:
        path = DATA / "pack_performance.json"
        performance = json.loads(path.read_text(encoding="utf-8")) if path.is_file() else {}
    if balances is None:
        path = DATA / "managed_balances.json"
        balances = json.loads(path.read_text(encoding="utf-8")) if path.is_file() else {}

    protocol_cap = float(performance.get("protocol_trading_pnl_usd") or 0)
    rwa_cap = 0.0
    user_sum = 0.0
    for row in performance.get("packs") or []:
        rwa_cap += float(row.get("rwa_appreciation_usd") or 0)
        user_sum += float(row.get("net_profit_usd") or 0)

    # Ghost profit if attributed user net > protocol trading + rwa attr
    ceiling = protocol_cap + rwa_cap + 1e-6
    ok = user_sum <= ceiling

    result = {
        "schema": "economic_compliance/v1",
        "ok": ok,
        "user_net_profit_sum": round(user_sum, 6),
        "ceiling_usd": round(ceiling, 6),
        "protocol_trading_pnl": round(protocol_cap, 6),
        "rwa_appreciation_attributed": round(rwa_cap, 6),
        "ghost_profit": not ok,
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "note": "Rejects value created from thin air",
    }
    (DATA / "economic_compliance.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    for dest in (
        ROOT / "apps" / "frontend" / "public" / "data" / "economic_compliance.json",
        ROOT / "docs" / "data" / "economic_compliance.json",
    ):
        try:
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(json.dumps(result, indent=2), encoding="utf-8")
        except OSError:
            pass
    return result


def main() -> None:
    print(json.dumps(validate_profits(), indent=2))


if __name__ == "__main__":
    main()
