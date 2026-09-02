"""Tests: slippage · cross-chain arb gates · dynamic trail."""
from __future__ import annotations

import os

from lia.risk.slippage import (
    effective_fill_price,
    guard_quote,
    net_edge_after_slippage,
    recommended_slippage_bps,
)
from lia.circuit.cross_chain_arb import build_arb_intents, scan_cross_chain_arb
from lia.risk.dynamic_trail import DynamicTrailService


def test_slippage_scales_with_size():
    small = recommended_slippage_bps(notional_usd=10, venue_id="xexchange")
    big = recommended_slippage_bps(notional_usd=50_000, venue_id="xexchange")
    assert big["slippage_bps"] >= small["slippage_bps"]
    assert small["slippage_bps"] >= 15
    assert big["slippage_bps"] <= 150


def test_fill_price_buy_worse():
    mid = 100.0
    buy = effective_fill_price(mid, side="buy", slippage_bps=50)
    sell = effective_fill_price(mid, side="sell", slippage_bps=50)
    assert buy > mid
    assert sell < mid


def test_net_edge_eats_costs():
    net = net_edge_after_slippage(
        0.02,
        buy_slip_bps=30,
        sell_slip_bps=30,
        fee_roundtrip=0.006,
        bridge_bps=80,
    )
    # 2% - 0.3% - 0.3% - 0.6% - 0.8% = 0%
    assert abs(net - 0.0) < 1e-9


def test_guard_quote_cap():
    g = guard_quote(
        mid=25.0,
        side="buy",
        notional_usd=10,
        venue_id="xexchange",
        max_slippage_bps=200,
    )
    assert g["ok"] is True


def test_cross_chain_scan_with_external_mids():
    os.environ["LIA_LIVE_TRADING"] = "0"
    # Force a synthetic spread via sol mid far from typical
    scan = scan_cross_chain_arb(sol_mid=1.0, hl_mid=None, size_usd=10)
    assert "opportunities" in scan
    assert scan["live"] is False
    # build intents on a fake actionable opp
    opp = {
        "actionable": True,
        "net_edge": 0.01,
        "size_usd": 10,
        "buy": {"chain": "multiversx", "venue": "xexchange", "symbol": "EGLD", "mid_usd": 20.0},
        "sell": {"chain": "solana", "venue": "jupiter", "symbol": "EGLD", "mid_usd": 21.0},
    }
    intents = build_arb_intents(opp, force_paper=True)
    assert intents["ok"] is True
    assert intents["atomic"] is False
    assert intents["bridge_required"] is True
    assert all(i["execution"] == "PAPER" for i in intents["intents"])


def test_dynamic_trail_stop_with_slippage():
    svc = DynamicTrailService(state_path="/tmp/lia_trail_test.json")
    o = svc.open_long(
        id="trail1",
        token="EGLD",
        entry=25.0,
        size_usd=20.0,
        atr=0.3,
        trail_pct=0.05,
        trail_mode="percent",
    )
    assert o["ok"]
    # push up then crash through stop
    svc.mark("trail1", 26.0)
    r = svc.mark("trail1", 20.0, venue_id="xexchange")
    assert r.get("action") == "STOP"
    assert "exit_price_slippage_adj" in r
    assert r["exit_price_slippage_adj"] < 20.0  # sell slippage


if __name__ == "__main__":
    test_slippage_scales_with_size()
    test_fill_price_buy_worse()
    test_net_edge_eats_costs()
    test_guard_quote_cap()
    test_cross_chain_scan_with_external_mids()
    test_dynamic_trail_stop_with_slippage()
    print("OK slippage/arb/trail tests")
