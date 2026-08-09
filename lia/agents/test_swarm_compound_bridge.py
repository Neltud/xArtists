"""Tests — swarm ↔ compound bridge."""
from __future__ import annotations

import os

os.environ["LIA_LIVE_TRADING"] = "0"

from lia.agents.swarm_compound_bridge import decide_swarm, run_integrated_cycle
from lia.agents.swarm_compound_lab import run_n_integrated
from lia.circuit.compound_engine import CompoundCircuit


def test_decide_defense_veto() -> None:
    d, props = decide_swarm(
        {"fear_greed": 10, "price": 10, "token": "WEGLD"},
        {"equity_usd": 100, "deployable_usd": 40, "drawdown": -0.15},
    )
    assert d.action == "WAIT"
    assert d.lead_agent == "DEFENSE"
    assert any(p["action"] == "VETO" for p in props)


def test_integrated_open_and_close() -> None:
    circuit = CompoundCircuit(state_path="data/test_bridge_streak.json")
    circuit.open_ticket = None
    circuit.streak.halted = False
    circuit.streak.cooldown_until = 0
    circuit.save()
    out = run_integrated_cycle(
        market={
            "price": 10.0,
            "rsi_14": 28,
            "trend_7d_pct": 5,
            "price_change_1h": 0.5,
            "gs_bias": "BULL",
            "fear_greed": 55,
            "liquidity_usd": 100000,
        },
        book={"equity_usd": 200, "deployable_usd": 80},
        circuit=circuit,
        simulate_fill=True,
        persist_circuit=False,
    )
    assert out["decision"]["action"] in ("BUY", "SELL", "YIELD", "WAIT")
    if out.get("opened"):
        assert out.get("ticket")
        assert out["ticket"]["notional_usd"] > 0


def test_multi_cycle() -> None:
    r = run_n_integrated(15, start_equity=100.0)
    assert r["cycles"] == 15
    assert "end_equity" in r


def test_live_blocked() -> None:
    from lia.agents import swarm_compound_bridge as b

    b.LIVE = True
    try:
        out = b.run_integrated_cycle(market={"price": 10}, book={"equity_usd": 50})
        assert out.get("ok") is False
    finally:
        b.LIVE = False


if __name__ == "__main__":
    test_decide_defense_veto()
    test_integrated_open_and_close()
    test_multi_cycle()
    test_live_blocked()
    print("swarm_compound_bridge tests OK")
