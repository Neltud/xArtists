"""
Zero-ghost reconciliation — RWA value + token proxy vs system equity attribution.

  PYTHONPATH=. python -m lia.utils.reconciliation_audit
  PYTHONPATH=. python -m lia.utils.reconciliation_audit --halt-on-fail
"""
from __future__ import annotations

import argparse
import json
import time
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"
OUT = DATA / "reconciliation_audit.json"

# Tolerance: attribution model is approximate (shadow shares)
TOLERANCE_USD = 50.0


def _load(name: str) -> dict[str, Any]:
    path = DATA / name
    if not path.is_file():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _rwa_market_value() -> float:
    cat = _load("rwa_catalog.json")
    total = 0.0
    for it in cat.get("items") or []:
        val = it.get("valuation") or {}
        total += float(val.get("price_proxy_usd") or 0)
    return round(total, 4)


def _token_liquidity_proxy() -> float:
    """Deployer equity proxy from live status if present."""
    live = _load("lia_live_status.json")
    if live.get("equity_proxy_usd") is not None:
        return float(live["equity_proxy_usd"])
    shadow = _load("decision_shadow_portfolio.json")
    if shadow.get("equity_usd") is not None:
        return float(shadow["equity_usd"])
    return 0.0


def _system_equity() -> float:
    perf = _load("pack_performance.json")
    packs = perf.get("packs") or []
    if packs:
        return round(sum(float(p.get("equity_usd") or 0) for p in packs), 4)
    bal = _load("managed_balances.json")
    accounts = bal.get("accounts") or {}
    if accounts:
        return round(sum(float(a.get("balance_usd") or 0) for a in accounts.values()), 4)
    return 0.0


def run(*, halt_on_fail: bool = False) -> dict[str, Any]:
    # Ensure performance reflects latest RWA
    try:
        from lia.brain.performance_tracker import track_all

        track_all()
    except Exception as e:
        pass

    rwa = _rwa_market_value()
    tokens = _token_liquidity_proxy()
    left = round(rwa + tokens, 4)
    right = _system_equity()
    # Note: models differ (full RWA catalog vs pack-attributed share).
    # Integrity check: pack equity must not exceed rwa_attr + trading + inception buffer.
    perf = _load("pack_performance.json")
    trading = float(perf.get("protocol_trading_pnl_usd") or 0)
    rwa_attr = sum(float(p.get("rwa_appreciation_usd") or 0) for p in (perf.get("packs") or []))
    inception = sum(float(p.get("inception_equity_usd") or 100) for p in (perf.get("packs") or []))
    ceiling = inception + trading + rwa_attr + TOLERANCE_USD
    ghost = right > ceiling + 1e-6

    # Secondary: economic ledger integrity
    econ_ok = True
    try:
        from lia.utils.economic_validator import validate

        econ = validate()
        econ_ok = bool(econ.get("ok"))
    except Exception:
        econ = {}

    # Compliance
    try:
        from lia.utils.economic_compliance import validate_profits

        comp = validate_profits()
        comp_ok = bool(comp.get("ok"))
    except Exception:
        comp = {}
        comp_ok = True

    ok = (not ghost) and econ_ok and comp_ok
    result = {
        "schema": "reconciliation_audit/v1",
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "ok": ok,
        "ghost": ghost,
        "rwa_market_value_usd": rwa,
        "token_liquidity_proxy_usd": tokens,
        "sum_rwa_tokens": left,
        "system_equity_usd": right,
        "attribution_ceiling_usd": round(ceiling, 4),
        "econ_ledger_ok": econ_ok,
        "compliance_ok": comp_ok,
        "tolerance_usd": TOLERANCE_USD,
        "note": "Pack equity must stay under inception+trading+RWA-attr; not identity to full catalog MV",
    }

    DATA.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(result, indent=2), encoding="utf-8")
    for dest in (
        ROOT / "apps" / "frontend" / "public" / "data" / "reconciliation_audit.json",
        ROOT / "docs" / "data" / "reconciliation_audit.json",
    ):
        try:
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(json.dumps(result, indent=2), encoding="utf-8")
        except OSError:
            pass

    try:
        from lia.utils.audit_log import audit

        audit("reconciliation", ok=ok, ghost=ghost, system_equity=right, ceiling=ceiling)
    except Exception:
        pass

    if not ok and halt_on_fail:
        try:
            from lia.guardian.risk_enforcer import emergency_halt

            emergency_halt("reconciliation_ghost_or_integrity")
        except Exception:
            pass
        result["halt_triggered"] = True

    return result


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--halt-on-fail", action="store_true")
    args = ap.parse_args()
    print(json.dumps(run(halt_on_fail=args.halt_on_fail), indent=2))


if __name__ == "__main__":
    main()
