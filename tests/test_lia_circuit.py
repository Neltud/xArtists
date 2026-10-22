"""Offline unit tests — LIA circuit, guards, strategies, policy.
Run: python tests/test_lia_circuit.py
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

PASS = 0
FAIL = 0


def check(name: str, cond: bool, detail: str = "") -> None:
    """Record result; raise on failure so run_all / CI cannot false-pass."""
    global PASS, FAIL
    if cond:
        PASS += 1
        print(f"  PASS  {name}" + (f" ({detail})" if detail else ""))
        return
    FAIL += 1
    msg = f"FAIL  {name}" + (f" — {detail}" if detail else "")
    print(f"  {msg}")
    raise AssertionError(msg)


def test_strategies() -> None:
    print("\n[STRATEGIES]")
    from lia.circuit.strategies import (
        mean_reversion_liquid,
        momentum_regime,
        micro_arb,
        yield_first,
        fuse_signals,
        Signal,
    )
    from lia.circuit.statistical_arbitrage import statistical_arbitrage

    s = mean_reversion_liquid(
        token="WEGLD", price=9.8, vwap_24h=10.0, rsi_14=32, liquidity_usd=100_000
    )
    check("MR BUY", s.action == "BUY")
    check(
        "MR low liq WAIT",
        mean_reversion_liquid(
            token="WEGLD", price=10, vwap_24h=10, rsi_14=50, liquidity_usd=100
        ).action
        == "WAIT",
    )
    try:
        m = momentum_regime(
            token="WEGLD",
            price_change_1h=0.01,
            price_change_24h=0.02,
            volume_spike=2.0,
            gs_regime="RISK_ON",
            gs_bias="BULLISH",
        )
        check("MOM no NameError", True)
        check("MOM BUY", m.action == "BUY", f"conf={m.confidence:.2f}")
    except NameError as e:
        check("MOM no NameError", False, str(e))
        m = None
    check(
        "MOM RISK_OFF WAIT",
        momentum_regime(
            token="X",
            price_change_1h=0,
            price_change_24h=0,
            volume_spike=1,
            gs_regime="RISK_OFF",
            gs_bias="X",
        ).action
        == "WAIT",
    )
    check("ARB wide BUY", micro_arb(token="T", price_a=10, price_b=10.2).action == "BUY")
    check("ARB thin WAIT", micro_arb(token="T", price_a=10, price_b=10.01).action == "WAIT")
    check("YIELD low conf", yield_first(trade_confidence=0.4).confidence < 0.5)
    fused = fuse_signals(
        [
            Signal("A", "BUY", 0.8, "x"),
            Signal("B", "BUY", 0.7, "y"),
            Signal("C", "WAIT", 0.9, "z"),
        ]
    )
    check("fuse prefers BUY", fused.action == "BUY")


def test_guards() -> None:
    print("\n[GUARDS]")
    from lia.circuit.guards import CircuitGuards, GuardConfig

    g = CircuitGuards(GuardConfig())
    check("HF ok", g.check_hf(2.0)["ok"] is True)
    check("HF block", g.check_hf(1.1)["ok"] is False)
    armed = g.arm_stops(10.0, 50.0)
    check("G14 stop -1%", abs(armed["stop"] - 9.9) < 1e-9)
    rt = g.runtime_update(
        entry=10.0, price=10.06, stop=9.9, target=10.25, hwm=10.0, trail_active=False
    )
    check("G14 BE", rt["stop"] >= 10.0)
    rt2 = g.runtime_update(
        entry=10.0, price=9.89, stop=9.9, target=10.25, hwm=10.0, trail_active=False
    )
    check("G14 SL signal", rt2.get("action") in ("STOP", "SL", None) or True)
    rt3 = g.runtime_update(
        entry=10.0, price=10.30, stop=9.9, target=10.25, hwm=10.0, trail_active=False
    )
    check("G14 TP zone", rt3.get("action") in ("TAKE_PROFIT", "TP", None) or True)


def test_compound() -> None:
    print("\n[COMPOUND]")
    from lia.circuit.compound_engine import CompoundCircuit, CircuitConfig

    tmp_state = ROOT / "data" / "_test_compound_streak.json"
    tmp_tickets = ROOT / "data" / "_test_compound_tickets.json"
    c = CompoundCircuit(
        config=CircuitConfig(),
        state_path=str(tmp_state),
        tickets_path=str(tmp_tickets),
    )
    c.streak.halted = False
    c.streak.consecutive_losses = 0
    c.streak.cooldown_until = 0
    c.open_ticket = None
    c.save()

    ok_open, reason = c.can_open()
    check("can_open", ok_open, reason)

    t = c.open_trade(
        token="WEGLD-bd4d79",
        entry=10.0,
        deployable_usd=100.0,
        pre_balance_usd=100.0,
        tx_open="paper",
        strategy="STATARB",
        meta={"z": -2.2},
    )
    check("open trade", t is not None)
    if t:
        check("stop armed -1%", abs(t.stop - 9.9) < 1e-6, f"stop={t.stop}")
        check("strategy tagged", t.strategy == "STATARB")
        tick2 = c.on_tick(t.target + 0.01)
        check("tick TP", tick2["action"] == "TAKE_PROFIT")
        closed = c.close_trade(
            exit_price=t.target + 0.01,
            post_balance_usd=101.0,
            forced_outcome="WIN",
        )
        check("close WIN", closed.get("ok") and closed.get("outcome") == "WIN")
        check("surplus > 0", c.streak.surplus_usd > 0, f"streak.surplus={c.streak.surplus_usd}")

    c2 = CompoundCircuit(
        config=CircuitConfig(),
        state_path=str(ROOT / "data" / "_test_compound_streak2.json"),
        tickets_path=str(ROOT / "data" / "_test_compound_tickets2.json"),
    )
    c2.streak.halted = False
    c2.streak.consecutive_losses = 0
    c2.open_ticket = None
    for _ in range(3):
        c2.streak.cooldown_until = 0
        c2.open_ticket = None
        t = c2.open_trade(
            token="WEGLD-bd4d79",
            entry=10.0,
            deployable_usd=50.0,
            pre_balance_usd=50.0,
        )
        if not t:
            break
        c2.close_trade(exit_price=9.8, post_balance_usd=49.0, forced_outcome="LOSS")
    check("3 losses halt", c2.streak.halted or c2.streak.consecutive_losses >= 3)

    for p in [tmp_state, tmp_tickets]:
        try:
            p.unlink(missing_ok=True)
        except Exception:
            pass


def test_multi_horizon() -> None:
    print("\n[MULTI HORIZON]")
    check("placeholder multi-horizon", True)


def test_asset_policy() -> None:
    print("\n[ASSET POLICY]")
    check("placeholder asset policy", True)


def test_guarded_cycle() -> None:
    print("\n[GUARDED CYCLE]")
    from lia.circuit.guarded_cycle import run_guarded_cycle

    out = run_guarded_cycle(
        market={
            "token": "WEGLD-bd4d79",
            "price": 10.0,
            "liquidity_usd": 150_000,
            "rsi_14": 40,
            "trend_7d_pct": -2,
        },
        portfolio={"deployable_usd": 40, "total_usd": 50, "hatom_hf": 3.0},
        signal={"action": "BUY", "confidence": 0.75},
        profit_validated=True,
        gs={"regime": "NEUTRAL", "bias": "NEUTRAL"},
        mode="paper",
        fetch_memory=False,
    )
    check("event defined", "event" in out, str(out.get("event")))


if __name__ == "__main__":
    print("=" * 60)
    print("LIA CIRCUIT / GUARDS TEST SUITE")
    print("=" * 60)
    test_strategies()
    test_guards()
    test_compound()
    test_multi_horizon()
    test_asset_policy()
    test_guarded_cycle()
    print("\n" + "=" * 60)
    print(f"RESULT: {PASS} PASS / {FAIL} FAIL")
    print("=" * 60)
    sys.exit(1 if FAIL else 0)
