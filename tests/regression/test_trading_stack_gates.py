"""Regression: trading stack safety gates stay paper-first."""
from __future__ import annotations

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


def test_live_trading_default_off():
    os.environ["LIA_LIVE_TRADING"] = "0"
    from lia.risk.secure_tp import live_trading_enabled

    assert live_trading_enabled() is False


def test_guardian_blocks_high_spiral():
    from lia.guardian.spiral import guardian_gate

    # Extreme leverage + drawdown should block
    g = guardian_gate(
        equity=100.0,
        notional=5000.0,
        ret_roe=0.5,
        drawdown=0.25,
        compound_intensity=2.0,
        consecutive_wins=10,
        mode="COMPOUND",
    )
    assert g.allow is False


def test_guardian_allows_sane():
    from lia.guardian.spiral import guardian_gate

    g = guardian_gate(
        equity=100.0,
        notional=50.0,
        ret_roe=0.02,
        drawdown=0.02,
        compound_intensity=0.2,
        consecutive_wins=1,
        mode="YIELD",
    )
    assert g.allow is True


def test_bridge_inventory_faster_than_msg():
    from lia.bridge.latency import BridgeLatencyOptimizer, InventoryBook

    inv = InventoryBook(balances={"solana": 100.0})
    opt = BridgeLatencyOptimizer(
        state_path="/tmp/reg_bridge_lat.json", inventory=inv
    )
    r = opt.best_route("multiversx", "solana", size_usd=25)
    assert r["mode"] == "INVENTORY_PREPOSITION"
    assert float(r["latency_p95"]) < 1.0


def test_slippage_net_edge_zero_at_boundary():
    from lia.risk.slippage import net_edge_after_slippage

    net = net_edge_after_slippage(
        0.02,
        buy_slip_bps=30,
        sell_slip_bps=30,
        fee_roundtrip=0.006,
        bridge_bps=80,
    )
    assert abs(net) < 1e-9


if __name__ == "__main__":
    test_live_trading_default_off()
    test_guardian_blocks_high_spiral()
    test_guardian_allows_sane()
    test_bridge_inventory_faster_than_msg()
    test_slippage_net_edge_zero_at_boundary()
    print("OK test_trading_stack_gates")
