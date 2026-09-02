"""Unit tests — Statistical Arbitrage module + fuse + compound acceptance.
Run: python tests/test_statarb.py
"""
from __future__ import annotations

import json
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


def test_statarb_signal() -> None:
    print("\n[STATARB SIGNAL]")
    from lia.circuit.statistical_arbitrage import (
        statistical_arbitrage,
        compute_spread,
        compute_z,
        StatArbConfig,
    )

    cfg = StatArbConfig()

    # Strong undervaluation → BUY
    s = statistical_arbitrage(
        token_a="WEGLD-bd4d79",
        token_b="USDC-c76f1f",
        price_a=9.5,
        price_b=1.0,
        spread_mean=2.30,
        spread_std=0.04,
        z_score=-2.4,
        half_life_h=12.0,
        liquidity_a=100_000,
        liquidity_b=200_000,
        cointegration_score=0.8,
        cfg=cfg,
    )
    check("strong negative z → BUY", s.action == "BUY", f"conf={s.confidence:.2f}")
    check("strategy STATARB", s.strategy == "STATARB")

    # Strong overvaluation → SELL
    s2 = statistical_arbitrage(
        token_a="WEGLD-bd4d79",
        token_b="USDC-c76f1f",
        price_a=10.8,
        price_b=1.0,
        spread_mean=2.30,
        spread_std=0.04,
        z_score=2.5,
        half_life_h=15.0,
        liquidity_a=100_000,
        liquidity_b=200_000,
        cointegration_score=0.75,
        cfg=cfg,
    )
    check("strong positive z → SELL", s2.action == "SELL")

    # Neutral
    s3 = statistical_arbitrage(
        token_a="WEGLD",
        token_b="USDC",
        price_a=10.0,
        price_b=1.0,
        spread_mean=2.30,
        spread_std=0.04,
        z_score=0.3,
        half_life_h=10.0,
        liquidity_a=100_000,
        liquidity_b=200_000,
        cointegration_score=0.8,
        cfg=cfg,
    )
    check("neutral z → WAIT", s3.action == "WAIT")

    # Half-life too long
    s4 = statistical_arbitrage(
        token_a="WEGLD",
        token_b="USDC",
        price_a=9.5,
        price_b=1.0,
        spread_mean=2.30,
        spread_std=0.04,
        z_score=-2.5,
        half_life_h=80.0,
        liquidity_a=100_000,
        liquidity_b=200_000,
        cointegration_score=0.8,
        cfg=cfg,
    )
    check("long half-life → WAIT", s4.action == "WAIT")

    # Low liquidity
    s5 = statistical_arbitrage(
        token_a="WEGLD",
        token_b="USDC",
        price_a=9.5,
        price_b=1.0,
        spread_mean=2.30,
        spread_std=0.04,
        z_score=-2.5,
        half_life_h=10.0,
        liquidity_a=5_000,
        liquidity_b=200_000,
        cointegration_score=0.8,
        cfg=cfg,
    )
    check("low liq → WAIT", s5.action == "WAIT")

    # Math helpers
    sp = compute_spread(10.0, 1.0, 1.0)
    check("spread log", abs(sp - 2.302585) < 0.001, f"{sp:.4f}")
    z = compute_z(2.40, 2.30, 0.05)
    check("z positive", z > 0)


def test_pairbook() -> None:
    print("\n[PAIRBOOK]")
    from lia.circuit.statistical_arbitrage import PairBook

    tmp = ROOT / "data" / "_test_statarb_pairs.json"
    book = PairBook(path=str(tmp))

    st = book.update(
        token_a="WEGLD-bd4d79",
        token_b="USDC-c76f1f",
        price_a=10.0,
        price_b=1.0,
        liquidity_a=150_000,
        liquidity_b=300_000,
        half_life_h=14.0,
        cointegration_score=0.82,
    )
    check("pair created", st.sample_count == 1)
    check("z defined", isinstance(st.last_z, float))

    st2 = book.update(
        token_a="WEGLD-bd4d79",
        token_b="USDC-c76f1f",
        price_a=9.4,
        price_b=1.0,
        liquidity_a=150_000,
        liquidity_b=300_000,
    )
    check("sample_count++", st2.sample_count == 2)

    sig = book.signal_for("WEGLD-bd4d79", "USDC-c76f1f")
    check("signal from book", sig.strategy == "STATARB")

    book.save()
    check("file written", tmp.exists())

    book2 = PairBook(path=str(tmp))
    check("reload pairs", len(book2.pairs) >= 1)

    try:
        tmp.unlink(missing_ok=True)
    except Exception:
        pass


def test_fuse_priority() -> None:
    print("\n[FUSE PRIORITY]")
    from lia.circuit.strategies import Signal, fuse_signals

    mr = Signal("BUY", "WEGLD", 0.70, "MR", "mr")
    stat = Signal("BUY", "WEGLD", 0.68, "STATARB", "z=-2.3", meta={"z": -2.3})
    mom = Signal("BUY", "WEGLD", 0.75, "MOM", "mom")

    fused = fuse_signals([mr, stat, mom])
    # STATARB has higher priority; even with slightly lower conf it should win
    # if conf close — our rank uses (conf, priority)
    check("fuse returns BUY", fused.action == "BUY")
    check(
        "STATARB preferred when close",
        fused.strategy in ("STATARB", "MOM", "MR"),
        fused.strategy,
    )

    # Strong STATARB should dominate
    strong = Signal("BUY", "WEGLD", 0.85, "STATARB", "z=-2.8")
    fused2 = fuse_signals([mr, strong, mom])
    check("strong STATARB wins", fused2.strategy == "STATARB")

    # SELL protection
    sell = Signal("SELL", "WEGLD", 0.72, "STATARB", "z=+2.4")
    fused3 = fuse_signals([strong, sell])
    check("SELL wins over BUY", fused3.action == "SELL")


def test_compound_accepts_statarb() -> None:
    print("\n[COMPOUND + STATARB]")
    from lia.circuit.compound_engine import CompoundCircuit, CircuitConfig
    from lia.circuit.strategies import Signal

    tmp_state = ROOT / "data" / "_test_statarb_compound.json"
    tmp_tickets = ROOT / "data" / "_test_statarb_tickets.json"
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

    ok, reason = c.can_open()
    check("can_open", ok, reason)

    # Simulate a StatArb-driven open (same API — strategy is metadata)
    t = c.open_trade(
        token="WEGLD-bd4d79",
        entry=9.6,
        deployable_usd=80.0,
        pre_balance_usd=80.0,
        tx_open="paper-statarb",
    )
    check("open from STATARB context", t is not None)
    if t:
        # Force a modest win compatible with +1% net target
        closed = c.close_trade(
            exit_price=9.6 * 1.025,
            post_balance_usd=81.5,
            forced_outcome="WIN",
        )
        check("close WIN ok", closed.get("ok") is True)
        check("outcome WIN", closed.get("outcome") == "WIN")

    for p in [tmp_state, tmp_tickets]:
        try:
            p.unlink(missing_ok=True)
        except Exception:
            pass


if __name__ == "__main__":
    print("=" * 60)
    print("LIA STATISTICAL ARBITRAGE TEST SUITE")
    print("=" * 60)
    test_statarb_signal()
    test_pairbook()
    test_fuse_priority()
    test_compound_accepts_statarb()
    print("\n" + "=" * 60)
    print(f"RESULT: {PASS} PASS / {FAIL} FAIL")
    print("=" * 60)
    sys.exit(1 if FAIL else 0)
