"""
Human-in-the-loop Strike Deployer.

Workflow:
  1. Brain intent → proposal file
  2. Human reviews proposal
  3. --execute-proposal <id> only if LIA_LIVE_TRADING=1

Never auto-broadcasts a batch of 5 without per-proposal confirm.

  PYTHONPATH=. python -m lia.guardian.strike_deployer --propose
  PYTHONPATH=. python -m lia.guardian.strike_deployer --list
  LIA_LIVE_TRADING=1 PYTHONPATH=. python -m lia.guardian.strike_deployer --execute-proposal PROP_ID
"""
from __future__ import annotations

import argparse
import json
import os
import time
import uuid
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"
PROPOSALS = DATA / "strike_proposals.json"


@dataclass
class Preflight:
    ok: bool
    checks: dict[str, Any]
    reason: str


def preflight_check() -> Preflight:
    checks: dict[str, Any] = {}
    from lia.guardian.beta_strike import load_beta_strike
    from lia.guardian.kill_switch import check_flash_crash, get_kill_switch
    from lia.guardian.onchain_monitor import DEPLOYER, fetch_account

    flash = check_flash_crash()
    checks["flash"] = flash
    ks = get_kill_switch()
    checks["kill_switch_locked"] = ks.is_locked
    if ks.is_locked:
        return Preflight(False, checks, f"kill_switch:{ks.reason}")
    if flash.get("triggered"):
        return Preflight(False, checks, "black_swan")

    live = os.environ.get("LIA_LIVE_TRADING", "0").strip() in ("1", "true", "TRUE")
    checks["LIA_LIVE_TRADING"] = live

    cfg = load_beta_strike()
    acc = fetch_account(DEPLOYER)
    checks["deployer"] = acc
    egld = float(acc.get("egld") or 0)
    if not acc.get("ok"):
        return Preflight(False, checks, "deployer_unreachable")
    if egld < cfg.min_wallet_egld_reserve:
        return Preflight(False, checks, f"egld_below_reserve_{cfg.min_wallet_egld_reserve}")

    try:
        import urllib.request

        urllib.request.urlopen("https://api.multiversx.com/economics", timeout=10)
        checks["api_ok"] = True
    except Exception as e:
        return Preflight(False, checks, f"api:{e}")

    checks["max_trade_egld"] = cfg.max_trade_size_egld
    checks["slippage_bps"] = cfg.default_slippage_bps
    return Preflight(True, checks, "preflight_ok")


def _load_proposals() -> list[dict[str, Any]]:
    if not PROPOSALS.is_file():
        return []
    try:
        d = json.loads(PROPOSALS.read_text(encoding="utf-8"))
        return list(d.get("proposals") or [])
    except Exception:
        return []


def _save_proposals(items: list[dict[str, Any]]) -> None:
    DATA.mkdir(parents=True, exist_ok=True)
    PROPOSALS.write_text(
        json.dumps({"updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "proposals": items}, indent=2),
        encoding="utf-8",
    )


def propose_dust_sequence(*, n: int = 5) -> list[dict[str, Any]]:
    """Create n dust-level proposals (not broadcast)."""
    from lia.guardian.beta_strike import load_beta_strike

    cfg = load_beta_strike()
    items = _load_proposals()
    created = []
    for i in range(n):
        pid = f"prop_{uuid.uuid4().hex[:10]}"
        p = {
            "id": pid,
            "slot": i + 1,
            "status": "pending_human",
            "action": "MICRO_SWAP_OR_TRANSFER",
            "size_egld": min(0.001, cfg.max_trade_size_egld),
            "size_usd_cap": cfg.max_trade_size_usd,
            "min_confidence": cfg.min_confidence_level,
            "pair": "EGLD→USDC",
            "calldata_plan": "lia.calldata.swap.dust_egld_to_usdc_plan",
            "created": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "tx_hash": None,
            "note": "Await human --execute-proposal",
        }
        items.append(p)
        created.append(p)
    _save_proposals(items[-50:])
    return created


def execute_proposal(prop_id: str) -> dict[str, Any]:
    """
    Human-confirmed execute path.
    Requires LIA_LIVE_TRADING=1. This build logs intent and does NOT auto-sign
    unless UniversalExecutor is wired with PEM by ops — returns proposal status.
    """
    live = os.environ.get("LIA_LIVE_TRADING", "0").strip() in ("1", "true", "TRUE")
    pf = preflight_check()
    if not live:
        return {"ok": False, "reason": "LIA_LIVE_TRADING_not_1", "preflight": asdict(pf)}
    if not pf.ok:
        return {"ok": False, "reason": pf.reason, "preflight": asdict(pf)}

    items = _load_proposals()
    prop = next((x for x in items if x.get("id") == prop_id), None)
    if not prop:
        return {"ok": False, "reason": "proposal_not_found"}
    if prop.get("status") not in ("pending_human", "approved"):
        return {"ok": False, "reason": f"bad_status:{prop.get('status')}"}

    # Mark approved — actual broadcast is ops+executor (documented)
    prop["status"] = "human_confirmed_await_executor"
    prop["confirmed_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    prop["note"] = (
        "Human confirmed. Run UniversalExecutor with dust plan manually; "
        "then set status executed + tx_hash via --mark-executed."
    )
    _save_proposals(items)
    return {"ok": True, "proposal": prop, "preflight": asdict(pf)}


def mark_executed(prop_id: str, tx_hash: str) -> dict[str, Any]:
    items = _load_proposals()
    prop = next((x for x in items if x.get("id") == prop_id), None)
    if not prop:
        return {"ok": False, "reason": "proposal_not_found"}
    prop["status"] = "executed"
    prop["tx_hash"] = tx_hash
    prop["executed_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    _save_proposals(items)
    # Feed learning loop
    try:
        from lia.brain.post_trade import analyze

        analyze(
            intended_out=0.004,
            executed_out=0.004,
            intended_in=float(prop.get("size_egld") or 0.001),
            token_in="WEGLD-bd4d79",
            token_out="USDC-c76f1f",
            tx_hash=tx_hash,
            strategy="STRAT_MICRO_PROOF",
        )
    except Exception:
        pass
    return {"ok": True, "proposal": prop}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--propose", action="store_true")
    ap.add_argument("--slots", type=int, default=5)
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--execute-proposal", type=str, default="")
    ap.add_argument("--mark-executed", nargs=2, metavar=("PROP_ID", "TX_HASH"))
    ap.add_argument("--preflight-only", action="store_true")
    args = ap.parse_args()

    if args.preflight_only:
        print(json.dumps(asdict(preflight_check()), indent=2))
        return
    if args.list:
        print(json.dumps(_load_proposals(), indent=2))
        return
    if args.propose:
        print(json.dumps({"created": propose_dust_sequence(n=args.slots)}, indent=2))
        return
    if args.execute_proposal:
        print(json.dumps(execute_proposal(args.execute_proposal), indent=2))
        return
    if args.mark_executed:
        print(json.dumps(mark_executed(args.mark_executed[0], args.mark_executed[1]), indent=2))
        return

    # default: preflight + status
    print(
        json.dumps(
            {
                "preflight": asdict(preflight_check()),
                "proposals": len(_load_proposals()),
                "note": "Use --propose then --execute-proposal <id> with LIA_LIVE_TRADING=1",
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
