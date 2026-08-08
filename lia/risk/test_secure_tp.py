"""Unit tests — secure TP, leverage policy, profit lock."""
from __future__ import annotations

import os

from lia.risk.leverage_policy import allow_execution, max_leverage
from lia.risk.profit_lock import ProfitLedger
from lia.risk.secure_tp import SecureTakeProfitEngine, SecureTpConfig, should_skip_micro_trade
from lia.circuit.trading_stack import TradingStack


def test_skip_micro_trade_fee():
    skip, _ = should_skip_micro_trade(expected_gross=0.002, fee_roundtrip=0.006, size_usd=5, gas_usd=0.05)
    assert skip is True
    skip2, why = should_skip_micro_trade(expected_gross=0.03, fee_roundtrip=0.006, size_usd=50, gas_usd=0.02)
    assert skip2 is False
    assert why == "ok"


def test_sol_live_high_lev_blocked(monkeypatch=None):
    os.environ["LIA_LIVE_TRADING"] = "1"
    g = allow_execution(
        chain="solana",
        venue_id="jupiter",
        requested_leverage=10.0,
        strategy="MOMENTUM",
        live=True,
    )
    assert g["allow"] is False
    os.environ["LIA_LIVE_TRADING"] = "0"
    g2 = allow_execution(
        chain="solana",
        venue_id="jupiter",
        requested_leverage=10.0,
        strategy="MOMENTUM",
        live=False,
    )
    assert g2["allow"] is True
    assert g2["execution"] == "PAPER"


def test_defense_blocks():
    g = allow_execution(
        chain="multiversx",
        venue_id="xexchange",
        requested_leverage=1.0,
        strategy="DEFENSE",
    )
    assert g["allow"] is False


def test_profit_lock():
    led = ProfitLedger()
    led.credit(10.0, lock_ratio=0.7)
    assert abs(led.locked_usd - 7.0) < 1e-9
    assert abs(led.compoundable_usd - 3.0) < 1e-9
    got = led.debit_compound(100)
    assert got == 3.0
    assert led.compoundable_usd == 0.0
    led.credit(5.0, 0.5)
    moved = led.force_lockdown()
    assert moved == 2.5
    assert led.compoundable_usd == 0.0


def test_secure_tp_log_partials():
    os.environ["LIA_LIVE_TRADING"] = "0"
    eng = SecureTakeProfitEngine()
    o = eng.open(
        id="t1",
        chain="multiversx",
        venue="xexchange",
        token="EGLD",
        entry=10.0,
        size_usd=20.0,
        equity_usd=100.0,
        cfg=SecureTpConfig(tp_mode="log", fee_roundtrip=0.001, min_net_edge=0.0001),
    )
    assert o["ok"] is True
    # walk up through log levels
    r = eng.on_tick("t1", 10.5)
    assert "partials" in r
    assert r["execution"] == "PAPER"


def test_trading_stack_demo():
    os.environ["LIA_LIVE_TRADING"] = "0"
    stack = TradingStack(ledger_path="/tmp/test_lia_profit_lock.json")
    o = stack.propose_entry(
        strategy="MOMENTUM",
        chain="multiversx",
        token="EGLD",
        entry=25.0,
        size_usd=15.0,
        equity_usd=100.0,
        expected_gross=0.02,
    )
    assert o.get("ok") is True
    assert max_leverage("multiversx", live=False) >= 1.5


if __name__ == "__main__":
    test_skip_micro_trade_fee()
    test_sol_live_high_lev_blocked()
    test_defense_blocks()
    test_profit_lock()
    test_secure_tp_log_partials()
    test_trading_stack_demo()
    print("OK all secure_tp tests")
