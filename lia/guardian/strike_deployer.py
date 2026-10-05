"""
Beta Strike deployer — controlled first real trades (ops only).

Default: DRY-RUN. Live requires:
  LIA_LIVE_TRADING=1
  --confirm-strike
  preflight OK (balance, gas, kill-switch, beta_strike caps)

  PYTHONPATH=. python -m lia.guardian.strike_deployer
  PYTHONPATH=. python -m lia.guardian.strike_deployer --confirm-strike  # still needs env flag
"""
from __future__ import annotations

import argparse
import json
import os
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]


@dataclass
class Preflight:
    ok: bool
    checks: dict[str, Any]
    reason: str


def preflight_check(*, max_trades: int = 5) -> Preflight:
    checks: dict[str, Any] = {}
    from lia.guardian.beta_strike import load_beta_strike
    from lia.guardian.kill_switch import get_kill_switch
    from lia.guardian.onchain_monitor import DEPLOYER, fetch_account

    cfg = load_beta_strike()
    ks = get_kill_switch()
    checks["kill_switch_locked"] = ks.is_locked
    if ks.is_locked:
        return Preflight(False, checks, f"kill_switch:{ks.reason}")

    live = os.environ.get("LIA_LIVE_TRADING", "0").strip() in ("1", "true", "TRUE")
    checks["LIA_LIVE_TRADING"] = live

    acc = fetch_account(DEPLOYER)
    checks["deployer"] = acc
    egld = float(acc.get("egld") or 0)
    if not acc.get("ok"):
        return Preflight(False, checks, "deployer_unreachable")
    if egld < cfg.min_wallet_egld_reserve:
        return Preflight(False, checks, f"egld_below_reserve_{cfg.min_wallet_egld_reserve}")

    # connectivity
    try:
        import urllib.request

        urllib.request.urlopen("https://api.multiversx.com/economics", timeout=10)
        checks["api_ok"] = True
    except Exception as e:
        checks["api_ok"] = False
        return Preflight(False, checks, f"api:{e}")

    checks["max_trade_egld"] = cfg.max_trade_size_egld
    checks["max_trades_planned"] = max_trades
    checks["slippage_bps"] = cfg.default_slippage_bps
    return Preflight(True, checks, "preflight_ok")


def plan_trades(*, n: int = 5) -> list[dict[str, Any]]:
    """Paper plan only — first N slots under beta caps (no broadcast here)."""
    from lia.guardian.beta_strike import load_beta_strike

    cfg = load_beta_strike()
    plans = []
    for i in range(n):
        plans.append(
            {
                "slot": i + 1,
                "action": "HOLD",
                "reason": "strike_slot_reserved_await_signal",
                "max_size_egld": cfg.max_trade_size_egld,
                "max_size_usd": cfg.max_trade_size_usd,
                "min_confidence": cfg.min_confidence_level,
                "status": "planned",
            }
        )
    return plans


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--confirm-strike", action="store_true", help="Acknowledge ops intent")
    ap.add_argument("--slots", type=int, default=5)
    args = ap.parse_args()

    pf = preflight_check(max_trades=args.slots)
    live = os.environ.get("LIA_LIVE_TRADING", "0").strip() in ("1", "true", "TRUE")
    plans = plan_trades(n=args.slots)

    result = {
        "schema": "strike_deployer/v1",
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "preflight": asdict(pf),
        "confirm_strike": args.confirm_strike,
        "live_env": live,
        "broadcast": False,
        "plans": plans,
        "note": "No TX sent. Broadcast requires LIA_LIVE_TRADING=1 AND --confirm-strike AND human signal wiring.",
    }

    if args.confirm_strike and live and pf.ok:
        result["note"] = (
            "Preflight OK + flags set — still no auto-broadcast in this build; "
            "wire UniversalExecutor per trade with human approval."
        )
        result["ready_for_manual_exec"] = True
    elif args.confirm_strike and not live:
        result["note"] = "--confirm-strike set but LIA_LIVE_TRADING!=1 → dry-run only"

    out = ROOT / "data" / "strike_deployer_last.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
