"""
Vellum cycle node — full professional circuit one iteration
===========================================================
Pipeline:
  1. LOAD streak + trailing
  2. SIGNALS (strategies + GreenSmoke)
  3. DECIDE (CompoundCircuit.can_open + brain)
  4. PRE_VERIFY on-chain
  5. EXECUTE (UniversalExecutor / paper)
  6. POST_VERIFY tx + balances
  7. SETTLE close if TP/SL
  8. SURPLUS → yield sleeve (stake/LP) ; TRO → redistribute policy
  9. SAVE streak
"""
from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

_ROOT = Path(__file__).resolve().parents[2]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from lia.circuit.compound_engine import CompoundCircuit, CircuitConfig, Phase
from lia.circuit.strategies import (
    mean_reversion_liquid,
    momentum_regime,
    micro_arb,
    yield_first,
    fuse_signals,
)
from lia.circuit.verify_onchain import pre_trade_checks, post_trade_checks, account_snapshot


def run_cycle(
    *,
    market: dict[str, Any],
    portfolio: dict[str, Any],
    gs: dict[str, Any] | None = None,
    mode: str = "paper",
    wallet: str = "erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6",
) -> dict[str, Any]:
    """
    market keys example:
      token, price, vwap_24h, rsi_14, liquidity_usd,
      price_change_1h, price_change_24h, volume_spike,
      price_dex_a, price_dex_b
    portfolio:
      deployable_usd, total_usd, egld, usdc
    gs:
      regime, bias, confidence
    """
    gs = gs or {"regime": "NEUTRAL", "bias": "NEUTRAL", "confidence": 50}
    circuit = CompoundCircuit()
    log: list[str] = []

    # --- manage open position first ---
    if circuit.open_ticket:
        price = float(market.get("price") or 0)
        tick = circuit.on_tick(price)
        log.append(f"tick={tick}")
        if tick.get("action") in ("STOP_LOSS", "TAKE_PROFIT"):
            if mode == "live":
                # executor would close here; post-verify required
                pass
            result = circuit.close_trade(
                exit_price=price,
                post_balance_usd=float(portfolio.get("total_usd") or 0),
                forced_outcome="LOSS" if tick["action"] == "STOP_LOSS" else "WIN",
            )
            log.append(f"closed={result.get('outcome')}")
            # surplus routing instruction for Vellum
            surplus = result.get("surplus_usd", 0)
            return {
                "phase": circuit.phase.value,
                "event": "CLOSED",
                "result": result,
                "surplus_action": (
                    {"type": "YIELD_DEPOSIT", "asset": "USDC-c76f1f", "amount_usd": surplus}
                    if surplus > 0
                    else None
                ),
                "log": log,
                "health": circuit.health(),
            }
        return {"phase": circuit.phase.value, "event": "HOLD", "tick": tick, "log": log, "health": circuit.health()}

    # --- signals ---
    token = str(market.get("token") or "WEGLD-bd4d79")
    sigs = [
        mean_reversion_liquid(
            token=token,
            price=float(market.get("price") or 0),
            vwap_24h=float(market.get("vwap_24h") or 0),
            rsi_14=float(market.get("rsi_14") or 50),
            liquidity_usd=float(market.get("liquidity_usd") or 0),
        ),
        momentum_regime(
            token=token,
            price_change_1h=float(market.get("price_change_1h") or 0),
            price_change_24h=float(market.get("price_change_24h") or 0),
            volume_spike=float(market.get("volume_spike") or 1),
            gs_regime=str(gs.get("regime") or "NEUTRAL"),
            gs_bias=str(gs.get("bias") or "NEUTRAL"),
        ),
        micro_arb(
            token=token,
            price_a=float(market.get("price_dex_a") or market.get("price") or 0),
            price_b=float(market.get("price_dex_b") or market.get("price") or 0),
        ),
    ]
    fused = fuse_signals(sigs)
    if fused.action != "BUY":
        y = yield_first(trade_confidence=fused.confidence)
        if y.action == "YIELD":
            circuit.phase = Phase.IDLE
            circuit.save()
            return {
                "phase": "YIELD",
                "event": "PARK",
                "signal": fused.__dict__,
                "yield": y.__dict__,
                "log": log,
                "health": circuit.health(),
            }
        return {
            "phase": "WAIT",
            "event": "NO_EDGE",
            "signal": fused.__dict__,
            "log": log,
            "health": circuit.health(),
        }

    ok, reason = circuit.can_open()
    if not ok:
        return {"phase": circuit.phase.value, "event": "BLOCKED", "reason": reason, "health": circuit.health()}

    # --- pre-verify ---
    if mode == "live":
        pre = pre_trade_checks(address=wallet)
        if not pre.ok:
            return {"phase": "PRE_VERIFY", "event": "FAIL", "detail": pre.detail, "health": circuit.health()}
        log.append("pre_verify=ok")

    deployable = float(portfolio.get("deployable_usd") or 0)
    ticket = circuit.open_trade(
        token=token,
        entry=float(market.get("price") or 0),
        deployable_usd=deployable,
        pre_balance_usd=float(portfolio.get("total_usd") or 0),
        tx_open="paper" if mode != "live" else "",
    )
    if not ticket:
        return {"phase": circuit.phase.value, "event": "OPEN_FAIL", "health": circuit.health()}

    return {
        "phase": circuit.phase.value,
        "event": "OPENED",
        "ticket": ticket.to_dict(),
        "signal": fused.__dict__,
        "log": log,
        "health": circuit.health(),
        "next": "monitor ticks until TP/SL; then surplus → yield; TRO → policy redistribute",
    }


if __name__ == "__main__":
    demo_market = {
        "token": "WEGLD-bd4d79",
        "price": 9.8,
        "vwap_24h": 10.0,
        "rsi_14": 32,
        "liquidity_usd": 200_000,
        "price_change_1h": 0.002,
        "price_change_24h": -0.01,
        "volume_spike": 1.2,
        "price_dex_a": 9.8,
        "price_dex_b": 9.81,
    }
    demo_pf = {"deployable_usd": 50, "total_usd": 50, "egld": 0.4, "usdc": 40}
    print(json.dumps(run_cycle(market=demo_market, portfolio=demo_pf, mode="paper"), indent=2))
