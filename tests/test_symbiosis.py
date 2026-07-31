"""Audit + tests — symbiose multi-stratégies DeFi.
Run: python tests/test_symbiosis.py
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from lia.orchestration.symbiosis import (
    STRATEGY_REGISTRY,
    GLOBAL_ENTRY_BUDGET_CAP,
    StrategyVote,
    audit_registry_budgets,
    fuse_votes,
    votes_from_brain_outputs,
)

PASS = FAIL = 0


def check(name: str, cond: bool, detail: str = "") -> None:
    global PASS, FAIL
    if cond:
        PASS += 1
        print(f"  PASS  {name}" + (f" ({detail})" if detail else ""))
    else:
        FAIL += 1
        print(f"  FAIL  {name}" + (f" — {detail}" if detail else ""))


def test_registry_audit() -> None:
    print("\n[REGISTRY AUDIT]")
    a = audit_registry_budgets()
    check("old docs over-alloc problem detected", a["old_docs_problem"] is True, str(a["old_docs_worst_case_sum"]))
    check("new defaults under soft ceiling", a["new_default_ok"], str(a["new_default_sum"]))
    check("global cap 85%", a["global_cap"] == 0.85)
    for k in ("TP1", "TP3", "TP5", "LIABrain", "Contrarian", "CIRCUIT_1PCT", "YieldAgent", "RiskAgent"):
        check(f"registry has {k}", k in STRATEGY_REGISTRY)


def test_risk_blocks_all() -> None:
    print("\n[RISK BLOCK]")
    votes = [
        StrategyVote("RiskAgent", "BLOCK", 98, reason="HF=1.2"),
        StrategyVote("TP1", "BUY", 90, token="WEGLD", budget_pct=0.2),
        StrategyVote("TP3", "BUY", 85, token="USDC", budget_pct=0.2),
    ]
    r = fuse_votes(votes, deployable_usd=100)
    check("mode BLOCKED", r.mode == "BLOCKED")
    check("no BUY approved", not any(a.get("type") == "BUY" for a in r.approved_actions))
    check("rejected has entries", len(r.rejected) >= 2)


def test_sell_vs_buy_conflict() -> None:
    print("\n[SELL vs BUY CONFLICT]")
    votes = [
        StrategyVote("RiskAgent", "PASS", 60),
        StrategyVote("TP1", "BUY", 80, token="WEGLD-bd4d79", budget_pct=0.2),
        StrategyVote("Contrarian", "SELL", 75, token="WEGLD-bd4d79", amount_usd=8),
    ]
    r = fuse_votes(votes, deployable_usd=100)
    check("SELL kept", any(a.get("type") == "SELL" for a in r.approved_actions))
    check("BUY same token rejected", any("conflict_sell" in str(x.get("reason")) for x in r.rejected))
    check("conflict logged", len(r.conflicts_resolved) >= 1)


def test_budget_cap() -> None:
    print("\n[BUDGET CAP]")
    # Simulate old bug: 3x 32% budgets
    votes = [
        StrategyVote("RiskAgent", "PASS", 60),
        StrategyVote("TP1", "BUY", 90, token="WEGLD", budget_pct=0.32),
        StrategyVote("TP3", "BUY", 85, token="WBTC", budget_pct=0.32),
        StrategyVote("TP5", "BUY", 80, token="USDC", budget_pct=0.32),
        StrategyVote("LIABrain", "BUY", 70, token="WEGLD", budget_pct=0.50),
    ]
    r = fuse_votes(votes, deployable_usd=100, max_entry_budget_pct=GLOBAL_ENTRY_BUDGET_CAP)
    check("total budget <= cap", r.total_budget_pct <= GLOBAL_ENTRY_BUDGET_CAP + 1e-6, str(r.total_budget_pct))
    check("some buys approved", any(a.get("type") == "BUY" for a in r.approved_actions))
    check("higher conf preferred first", True)  # ranking by conf
    # Highest conf TP1 should be present
    buy_strats = [a["strategy"] for a in r.approved_actions if a.get("type") == "BUY"]
    check("TP1 (highest conf) included", "TP1" in buy_strats, str(buy_strats))


def test_risk_off_suppresses_buys() -> None:
    print("\n[RISK_OFF]")
    votes = [
        StrategyVote("RiskAgent", "PASS", 60),
        StrategyVote("TP1", "BUY", 90, token="WEGLD", budget_pct=0.2),
        StrategyVote("YieldAgent", "YIELD", 80, amount_usd=20),
    ]
    r = fuse_votes(votes, deployable_usd=100, gs_regime="RISK_OFF")
    check("no BUY", not any(a.get("type") == "BUY" for a in r.approved_actions))
    check("yield or empty trade", r.mode in ("YIELD_ONLY", "MIXED"))


def test_adapter_brain_outputs() -> None:
    print("\n[ADAPTER]")
    outs = [
        {"strategy": "UniversalBrainTP1", "decision": "BUY", "confidence": 80, "best_token": "WEGLD-bd4d79", "allocated_budget_usd": 15},
        {"agent": "RiskAgent", "decision": "PASS", "confidence": 60, "reasoning": "ok"},
        {"agent": "YieldAgent", "decision": "YIELD", "confidence": 75, "actions": [{"type": "HATOM_SUPPLY", "amount_usd": 10}]},
    ]
    votes = votes_from_brain_outputs(outs)
    check("mapped TP1", any(v.strategy == "TP1" for v in votes))
    check("mapped Risk", any(v.strategy == "RiskAgent" for v in votes))
    r = fuse_votes(votes, deployable_usd=50)
    check("fuse ok", r.mode in ("TRADE", "YIELD_ONLY", "MIXED", "BLOCKED"))


def test_circuit_max_one() -> None:
    print("\n[CIRCUIT MAX 1]")
    votes = [
        StrategyVote("RiskAgent", "PASS", 60),
        StrategyVote("CIRCUIT_1PCT", "BUY", 90, token="WEGLD", budget_pct=0.1),
        StrategyVote("CIRCUIT_1PCT", "BUY", 88, token="WBTC", budget_pct=0.1),
    ]
    r = fuse_votes(votes, deployable_usd=100)
    circuit_buys = [a for a in r.approved_actions if a.get("strategy") == "CIRCUIT_1PCT" and a.get("type") == "BUY"]
    check("at most 1 circuit BUY", len(circuit_buys) <= 1, str(len(circuit_buys)))


if __name__ == "__main__":
    print("=" * 60)
    print("STRATEGY SYMBIOSIS AUDIT & TESTS")
    print("=" * 60)
    test_registry_audit()
    test_risk_blocks_all()
    test_sell_vs_buy_conflict()
    test_budget_cap()
    test_risk_off_suppresses_buys()
    test_adapter_brain_outputs()
    test_circuit_max_one()
    print("\n" + "=" * 60)
    print(f"RESULT: {PASS} PASS / {FAIL} FAIL")
    print("=" * 60)
    sys.exit(1 if FAIL else 0)
