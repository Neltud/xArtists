"""
Decision-chain stress test — autonomous THOUGHT, blocked ACTION.

  PYTHONPATH=. python -m lia.genesis.decision_chain --cycles 5
"""
from __future__ import annotations

import argparse
import json
import time
import uuid
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"
LOG = DATA / "decision_chain.log"
OUT = DATA / "decision_proposals.json"
SHADOW = DATA / "decision_shadow_portfolio.json"


def _log(step: str, **kw: Any) -> None:
    DATA.mkdir(parents=True, exist_ok=True)
    row = {"ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "step": step, **kw}
    with LOG.open("a", encoding="utf-8") as f:
        f.write(json.dumps(row, ensure_ascii=False) + "\n")


def _load_shadow() -> dict[str, float]:
    if SHADOW.is_file():
        try:
            d = json.loads(SHADOW.read_text(encoding="utf-8"))
            return {
                "egld": float(d.get("egld") or 0.2),
                "usdc": float(d.get("usdc") or 10.0),
                "tro": float(d.get("tro") or 100.0),
                "equity_usd": float(d.get("equity_usd") or 50.0),
            }
        except Exception:
            pass
    return {"egld": 0.2, "usdc": 10.0, "tro": 100.0, "equity_usd": 50.0}


def _save_shadow(p: dict[str, float]) -> None:
    DATA.mkdir(parents=True, exist_ok=True)
    payload = {**p, "updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
    SHADOW.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def _egld_usd() -> float:
    try:
        import urllib.request

        req = urllib.request.Request(
            "https://api.multiversx.com/economics",
            headers={"User-Agent": "xArtists-decision-chain/1.0"},
        )
        with urllib.request.urlopen(req, timeout=10) as r:
            return float(json.loads(r.read().decode()).get("price") or 4.5)
    except Exception:
        return 4.5


def run_cycle(cycle: int, *, shadow: dict[str, float]) -> dict[str, Any]:
    pid = f"dprop_{uuid.uuid4().hex[:10]}"
    chain: list[str] = []

    from lia.brain.agent_constraints import assert_tradable_asset
    from lia.brain.orchestrator import orchestrate
    from lia.brain.strategies import action_for

    rwa_avg = 50.0
    try:
        from lia.brain.rwa_evaluator import load_catalog

        items = load_catalog()
        scores = [float((i.get("valuation") or {}).get("score") or 0) for i in items]
        if scores:
            rwa_avg = sum(scores) / len(scores)
    except Exception:
        pass

    sent = max(-1.0, min(1.0, (rwa_avg - 50) / 50))
    orch = orchestrate(
        sentiment=sent,
        volatility=0.32 + (cycle % 3) * 0.05,
        trend="UP" if sent > 0.2 else ("DOWN" if sent < -0.2 else "SIDEWAYS"),
        confidence=0.5 + (cycle % 5) * 0.08,
        asset_state="Liquid",
        liquidity=0.55,
    )
    strategy = str(orch.get("active") or "STRAT_YIELD_OPTIMIZER")
    action = action_for(strategy)  # type: ignore
    guard = assert_tradable_asset(target_asset_type="TOKEN")
    reason = f"{orch.get('reason')}|rwa_avg={rwa_avg:.1f}|sent={sent:.2f}"
    _log("DECISION_MADE", cycle=cycle, strategy=strategy, action=action, reason=reason, pid=pid)
    chain.append("DECISION_MADE")

    if action == "HOLD" or not guard.get("ok"):
        prop = {
            "id": pid,
            "cycle": cycle,
            "status": "skipped",
            "action_type": "HOLD",
            "strategy": strategy,
            "reason": reason if guard.get("ok") else guard.get("reason"),
            "broadcast": False,
            "chain": chain + ["SKIP"],
        }
        _log("SKIP", cycle=cycle, pid=pid, reason=prop["reason"])
        return prop

    from lia.brain.position_sizing import size_position

    sz = size_position(
        equity_usd=float(shadow.get("equity_usd") or 50),
        confidence=0.55,
        volatility=0.35,
        max_usd=15.0,
        strategy=strategy,
    )
    egld_px = _egld_usd()
    size_usd = min(sz.size_usd, 5.0)
    amount_egld = round(size_usd / egld_px, 6) if egld_px else 0.001
    amount_egld = max(0.001, min(0.005, amount_egld))
    _log("SIZING_CALCULATED", cycle=cycle, pid=pid, size_usd=size_usd, amount_egld=amount_egld, method=sz.method)
    chain.append("SIZING_CALCULATED")

    from lia.calldata.swap import dust_egld_to_usdc_plan

    plan = dust_egld_to_usdc_plan(amount_egld=amount_egld, egld_usd=egld_px)
    steps = plan.get("steps") or []
    txs = [
        {
            "receiver": st.get("receiver"),
            "value": st.get("value"),
            "data": st.get("data"),
            "gasLimit": st.get("gas_limit"),
            "label": st.get("label"),
        }
        for st in steps
    ]
    _log("PAYLOAD_GENERATED", cycle=cycle, pid=pid, steps=len(txs), slippage_bps=plan.get("slippage_guard_bps"))
    chain.append("PAYLOAD_GENERATED")

    preflight: dict[str, Any] = {"ok": True, "checks": {}}
    try:
        from lia.guardian.kill_switch import get_kill_switch
        from lia.guardian.onchain_monitor import DEPLOYER, fetch_account

        ks = get_kill_switch()
        preflight["checks"]["kill_switch"] = ks.is_locked
        if ks.is_locked:
            preflight["ok"] = False
            preflight["reason"] = f"kill:{ks.reason}"
        acc = fetch_account(DEPLOYER)
        preflight["checks"]["deployer_egld"] = acc.get("egld")
        if float(acc.get("egld") or 0) < amount_egld + 0.05:
            preflight["ok"] = False
            preflight["reason"] = "insufficient_egld_for_size_plus_reserve"
        preflight["checks"]["nft_guard"] = guard
        preflight["checks"]["gas_est"] = sum(int(t.get("gasLimit") or 0) for t in txs)
    except Exception as e:
        preflight["ok"] = False
        preflight["reason"] = f"preflight_error:{e}"

    step_name = "PREFLIGHT_PASSED" if preflight.get("ok") else "PREFLIGHT_FAILED"
    _log(step_name, cycle=cycle, pid=pid, preflight=preflight)
    chain.append(step_name)

    expected_usdc = float(plan.get("min_usdc") or 0) / max(
        1e-9, (1.0 - float(plan.get("slippage_guard_bps") or 100) / 10000.0)
    )
    min_usdc = float(plan.get("min_usdc") or 0)
    slip_sim = {
        "expected_usdc": round(expected_usdc, 6),
        "min_out_usdc": round(min_usdc, 6),
        "guard_bps": plan.get("slippage_guard_bps"),
        "impact_note": "min_out uses historical slip guard",
    }

    if preflight.get("ok") and action == "BUY":
        shadow["egld"] = max(0.0, float(shadow["egld"]) - amount_egld)
        shadow["usdc"] = float(shadow["usdc"]) + min_usdc
        shadow["equity_usd"] = float(shadow["egld"]) * egld_px + float(shadow["usdc"])
        _save_shadow(shadow)
        _log("VIRTUAL_IMPACT", cycle=cycle, pid=pid, shadow=dict(shadow))
        chain.append("VIRTUAL_IMPACT")

    prop = {
        "id": pid,
        "cycle": cycle,
        "status": "ready_to_sign" if preflight.get("ok") else "blocked",
        "action_type": "SWAP",
        "pair": "EGLD→USDC",
        "strategy": strategy,
        "action": action,
        "reason": reason,
        "amount_egld": amount_egld,
        "amount_usd": size_usd,
        "decimals": {"WEGLD": 18, "USDC": 6},
        "txs": txs,
        "slippage": slip_sim,
        "preflight": preflight,
        "gas_total": sum(int(t.get("gasLimit") or 0) for t in txs),
        "broadcast": False,
        "LIA_LIVE_TRADING_required": True,
        "sign_enabled": False,
        "chain": chain,
        "created": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    _log("PROPOSAL_READY", cycle=cycle, pid=pid, status=prop["status"])
    chain.append("PROPOSAL_READY")
    prop["chain"] = chain
    return prop


def run_stress(*, cycles: int = 5) -> dict[str, Any]:
    shadow = _load_shadow()
    proposals: list[dict[str, Any]] = []
    _log("STRESS_START", cycles=cycles)
    for i in range(1, cycles + 1):
        proposals.append(run_cycle(i, shadow=shadow))
    ready = sum(1 for p in proposals if p.get("status") == "ready_to_sign")
    blocked = sum(1 for p in proposals if p.get("status") == "blocked")
    skipped = sum(1 for p in proposals if p.get("status") == "skipped")
    result = {
        "schema": "decision_chain_stress/v1",
        "cycles": cycles,
        "ready_to_sign": ready,
        "blocked": blocked,
        "skipped": skipped,
        "success": ready + skipped + blocked == cycles,
        "broadcast": False,
        "proposals": proposals,
        "shadow_after": shadow,
        "note": "Machine proposes. Human decides. No TX sent.",
    }
    DATA.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(result, indent=2), encoding="utf-8")
    for dest in (
        ROOT / "apps" / "frontend" / "public" / "data" / "decision_proposals.json",
        ROOT / "docs" / "data" / "decision_proposals.json",
    ):
        try:
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(json.dumps(result, indent=2), encoding="utf-8")
        except OSError:
            pass
    _log("STRESS_END", ready=ready, blocked=blocked, skipped=skipped)
    return result


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--cycles", type=int, default=5)
    args = ap.parse_args()
    print(json.dumps(run_stress(cycles=args.cycles), indent=2))


if __name__ == "__main__":
    main()
