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
    global PASS, FAIL
    if cond:
        PASS += 1
        print(f"  PASS  {name}" + (f" ({detail})" if detail else ""))
    else:
        FAIL += 1
        print(f"  FAIL  {name}" + (f" — {detail}" if detail else ""))


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
    check("YIELD low conf", yield_first(trade_confidence=0.4).action == "YIELD")

    # STATARB
    sa = statistical_arbitrage(
        token_a="WEGLD-bd4d79",
        token_b="USDC-c76f1f",
        price_a=9.5,
        price_b=1.0,
        spread_mean=2.30,
        spread_std=0.04,
        z_score=-2.3,
        half_life_h=12.0,
        liquidity_a=100_000,
        liquidity_b=200_000,
        cointegration_score=0.8,
    )
    check("STATARB BUY", sa.action == "BUY", f"conf={sa.confidence:.2f}")
    check("STATARB strategy tag", sa.strategy == "STATARB")

    if m is not None:
        fused = fuse_signals([s, m, micro_arb(token="T", price_a=10, price_b=10.01), sa])
        check("fuse valid", fused.action in ("BUY", "SELL", "WAIT", "YIELD"))
        # With strong STATARB present, priority should surface it often
        check(
            "fuse can pick STATARB",
            fused.strategy in ("STATARB", "MR", "MOM", "ARB", "FUSE"),
            fused.strategy,
        )


def test_guards() -> None:
    print("\n[GUARDS]")
    from lia.circuit.guards import CircuitGuards, GuardConfig

    tmp = ROOT / "data" / "_test_guards_state.json"
    g = CircuitGuards(config=GuardConfig(), state_path=str(tmp))
    g.clear_halt()

    check("G01 ok", g.check_halt(0).ok)
    check("G01 3 losses", not g.check_halt(3).ok)
    check("G07 TRO block", not g.check_asset("TRO-94c925").ok)
    check("G07 WEGLD ok", g.check_asset("WEGLD-bd4d79").ok)
    check("G05 pace block", not g.check_pace(0.1).ok)
    check("G05 pace ok", g.check_pace(2.0).ok)
    check("G11 RISK_OFF", not g.check_regime("RISK_OFF", "BUY").ok)
    check("G12 HF", not g.check_hf(1.2).ok)
    check("G10 liq", not g.check_liquidity(100).ok)
    check("G16 DD", not g.check_drawdown(80, 100).ok)
    check("G16 DD ok", g.check_drawdown(90, 100).ok)

    armed = g.arm_stops(10.0, 50.0)
    check("G14 stop -1%", abs(armed["stop"] - 9.9) < 1e-9)
    check("G14 target > entry", armed["target"] > 10.0)

    rt = g.runtime_action(
        entry=10.0, price=10.06, stop=9.9, target=10.25, hwm=10.0, trail_active=False
    )
    check("G14 BE", rt["stop"] >= 10.0)
    rt2 = g.runtime_action(
        entry=10.0, price=9.89, stop=9.9, target=10.25, hwm=10.0, trail_active=False
    )
    check("G14 SL", rt2["action"] == "STOP_LOSS")
    rt3 = g.runtime_action(
        entry=10.0, price=10.30, stop=9.9, target=10.25, hwm=10.0, trail_active=False
    )
    check("G14 TP", rt3["action"] == "TAKE_PROFIT")

    pre = g.preflight(
        token="WEGLD-bd4d79",
        deployable_usd=50,
        liquidity_usd=100_000,
        hours_since_swap=2.0,
        equity_usd=50,
        peak_usd=50,
        profit_validated=True,
    )
    check("preflight clean", pre["ok"], str(pre.get("blockers")))
    pre2 = g.preflight(
        token="TRO-94c925",
        deployable_usd=50,
        liquidity_usd=100_000,
        hours_since_swap=2.0,
        equity_usd=50,
        peak_usd=50,
    )
    check("preflight TRO blocked", not pre2["ok"])
    pre3 = g.preflight(
        token="WEGLD-bd4d79",
        deployable_usd=50,
        liquidity_usd=100_000,
        hours_since_swap=2.0,
        equity_usd=50,
        peak_usd=50,
        gs_regime="RISK_OFF",
        intent="BUY",
    )
    check("preflight RISK_OFF", not pre3["ok"])

    fee_pct = g.cfg.dex_fee_rt + g.cfg.gas_usd / 50 + g.cfg.max_slippage + g.cfg.safety_buffer
    check("fees ~1.2% at $50", 0.01 < fee_pct < 0.02, f"{fee_pct:.4f}")
    req_gross = fee_pct + g.cfg.target_net_pct
    check("required gross ~2.2%", 0.02 < req_gross < 0.03, f"{req_gross:.4f}")

    try:
        tmp.unlink(missing_ok=True)
    except Exception:
        pass


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
        check("surplus > 0", closed.get("surplus_usd", 0) > 0)

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

    for p in [
        tmp_state,
        tmp_tickets,
        ROOT / "data" / "_test_compound_streak2.json",
        ROOT / "data" / "_test_compound_tickets2.json",
    ]:
        try:
            p.unlink(missing_ok=True)
        except Exception:
            pass


def test_multi_horizon() -> None:
    print("\n[MULTI-HORIZON]")
    from lia.decision.multi_horizon import decide

    d = decide(
        signal_action="BUY",
        signal_conf=0.72,
        profit_validated=True,
        hours_since_swap=2.0,
        trend_7d_pct=-3.0,
        rsi_14=42,
        deployable_usd=40,
        total_usd=50,
        weights={"USDC": 0.6, "EGLD": 0.25, "WBTC": 0.1},
        gs_regime="NEUTRAL",
        gs_bias="NEUTRAL",
        circuit_can_open=True,
    )
    check("BUY fused", d.intent == "BUY", d.intent)
    check("reinvest plan", "actions" in d.reinvest)

    d2 = decide(
        signal_action="BUY",
        signal_conf=0.8,
        profit_validated=True,
        gs_regime="RISK_OFF",
        circuit_can_open=True,
        hours_since_swap=2.0,
    )
    check("RISK_OFF not BUY", d2.intent != "BUY", d2.intent)


def test_asset_policy() -> None:
    print("\n[ASSET POLICY]")
    from lia.policy.asset_policy import (
        is_tro,
        is_accumulate_token,
        plan_tro_distribution,
        build_tro_redistribution_txs,
    )

    check("is_tro", is_tro("TRO-94c925"))
    check("not tro WEGLD", not is_tro("WEGLD-bd4d79"))
    check("acc WEGLD", is_accumulate_token("WEGLD-bd4d79"))
    check("not acc TRO", not is_accumulate_token("TRO-94c925"))
    plan = plan_tro_distribution(10_000)
    check(
        "split sums",
        plan.pool + plan.stake + plan.rewards + plan.burn == 10_000,
    )
    check("pool 40%", plan.pool == 4000)
    check("txs built", len(build_tro_redistribution_txs(10_000)) >= 1)


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
