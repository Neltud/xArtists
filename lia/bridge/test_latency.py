"""Tests — bridge latency optimizer."""
from __future__ import annotations

from lia.bridge.latency import (
    BridgeLatencyOptimizer,
    InventoryBook,
    adaptive_bridge_penalty_bps,
)


def test_inventory_beats_bridge():
    inv = InventoryBook(balances={"solana": 100.0, "multiversx": 100.0})
    opt = BridgeLatencyOptimizer(
        state_path="/tmp/bridge_lat_test.json", inventory=inv
    )
    r = opt.best_route("multiversx", "solana", size_usd=25)
    assert r["mode"] == "INVENTORY_PREPOSITION"
    assert r["latency_p95"] < 1.0
    assert r["penalty_bps"] < 30


def test_no_inventory_uses_corridor():
    opt = BridgeLatencyOptimizer(
        state_path="/tmp/bridge_lat_test2.json", inventory=InventoryBook()
    )
    r = opt.best_route("multiversx", "solana", size_usd=25)
    assert r["mode"] == "FAST_CORRIDOR"
    assert r["latency_p95"] > 1.0


def test_edge_decay_abort():
    opt = BridgeLatencyOptimizer(state_path="/tmp/bridge_lat_test3.json")
    # tiny edge + long latency → abort
    s = opt.edge_survives(0.005, latency_p95=120.0)
    assert s["abort"] is True
    s2 = opt.edge_survives(0.05, latency_p95=5.0)
    assert s2["survives"] is True


def test_parallel_plan_inventory():
    inv = InventoryBook(balances={"solana": 50})
    opt = BridgeLatencyOptimizer(
        state_path="/tmp/bridge_lat_test4.json", inventory=inv
    )
    plan = opt.plan_parallel_legs(
        buy_chain="multiversx",
        sell_chain="solana",
        size_usd=20,
        net_edge=0.02,
    )
    assert plan["execute"] is True
    assert plan["mode"] == "INVENTORY_PREPOSITION"


def test_adaptive_penalty_lower_with_inventory():
    inv = InventoryBook(balances={"solana": 100})
    opt = BridgeLatencyOptimizer(
        state_path="/tmp/bridge_lat_test5.json", inventory=inv
    )
    a = adaptive_bridge_penalty_bps(
        "multiversx", "solana", size_usd=10, optimizer=opt
    )
    assert a["penalty_bps"] < 80  # better than old fixed default


def test_record_sample_updates():
    opt = BridgeLatencyOptimizer(state_path="/tmp/bridge_lat_test6.json")
    c = opt.record_sample(
        "solana", "hyperliquid", "native_fast", latency_sec=6.0, fee_bps=8.0
    )
    assert c.samples >= 1
    assert c.p50_sec > 0


if __name__ == "__main__":
    test_inventory_beats_bridge()
    test_no_inventory_uses_corridor()
    test_edge_decay_abort()
    test_parallel_plan_inventory()
    test_adaptive_penalty_lower_with_inventory()
    test_record_sample_updates()
    print("OK bridge latency tests")
