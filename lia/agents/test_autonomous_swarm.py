"""Tests — autonomous swarm."""
from __future__ import annotations

from lia.agents.autonomous_swarm import (
    BookSnapshot,
    MarketSnapshot,
    agent_defense,
    agent_mean_rev,
    agent_micro_arb,
    agent_momentum,
    collect_proposals,
    coordinate,
    paper_fill,
    run_swarm_cycle,
)


def test_defense_veto() -> None:
    m = MarketSnapshot(fear_greed=20)
    b = BookSnapshot(equity_usd=100, drawdown=-0.15)
    p = agent_defense(m, b)
    assert p.action == "VETO"


def test_momentum_buy() -> None:
    m = MarketSnapshot(trend_7d_pct=5, price_change_1h=0.5, gs_bias="BULL")
    p = agent_momentum(m)
    assert p.action == "BUY"
    assert p.confidence >= 0.62


def test_mean_rev_oversold() -> None:
    m = MarketSnapshot(price=9.0, vwap_24h=10.0, rsi_14=28, liquidity_usd=50_000)
    p = agent_mean_rev(m)
    assert p.action == "BUY"


def test_micro_arb_spread() -> None:
    m = MarketSnapshot(price=10, dex_a=9.9, dex_b=10.1, liquidity_usd=50_000)
    p = agent_micro_arb(m)
    assert p.action in ("BUY", "WAIT")


def test_coordinate_defense_blocks() -> None:
    m = MarketSnapshot(fear_greed=10, token="WEGLD")
    b = BookSnapshot(equity_usd=200, deployable_usd=50)
    props = collect_proposals(m, b)
    d = coordinate(props, m, b)
    assert d.action == "WAIT"
    assert d.lead_agent == "DEFENSE"


def test_cycle_smoke() -> None:
    out = run_swarm_cycle(
        market={
            "price": 9.5,
            "vwap_24h": 9.8,
            "rsi_14": 30,
            "trend_7d_pct": 4,
            "price_change_1h": 0.3,
            "gs_bias": "BULL",
            "liquidity_usd": 100000,
            "dex_a": 9.5,
            "dex_b": 9.55,
            "fear_greed": 55,
        },
        book={"equity_usd": 200, "deployable_usd": 80},
        persist=False,
        settle=False,
    )
    assert "decision" in out
    assert out["live_flag"] is False
    assert out["decision"]["action"] in ("BUY", "SELL", "WAIT", "YIELD")


def test_paper_fill() -> None:
    from lia.agents.autonomous_swarm import SwarmDecision

    d = SwarmDecision("BUY", "WEGLD", 20.0, 0.8, "MOMENTUM", "test")
    f = paper_fill(d, win=True)
    assert f["filled"] and f["pnl_usd"] > 0


if __name__ == "__main__":
    test_defense_veto()
    test_momentum_buy()
    test_mean_rev_oversold()
    test_micro_arb_spread()
    test_coordinate_defense_blocks()
    test_cycle_smoke()
    test_paper_fill()
    print("autonomous_swarm tests OK")
