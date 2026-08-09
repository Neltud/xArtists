"""
Swarm ↔ CompoundCircuit bridge
==============================
Wires autonomous swarm decisions into CompoundCircuit lifecycle.

Flow:
  1. collect_proposals + coordinate (+ PreFlight inside coord)
  2. If BUY/SELL allowed → circuit.open_trade (paper)
  3. Optional synthetic tick path → on_tick → close_trade
  4. settle via path_executor_hooks / profit lock

Safety: LIA_LIVE_TRADING must stay 0; no PEM signing here.
"""
from __future__ import annotations

import os
import time
from typing import Any, Optional

from lia.agents.swarm_coord import SwarmDecision, coordinate, paper_fill
from lia.agents.swarm_roles import BookSnapshot, MarketSnapshot, collect_proposals
from lia.circuit.compound_engine import CompoundCircuit

LIVE = os.getenv("LIA_LIVE_TRADING", "0") == "1"


def _snapshots(
    market: dict[str, Any], book: dict[str, Any]
) -> tuple[MarketSnapshot, BookSnapshot]:
    m = MarketSnapshot(
        token=str(market.get("token") or "WEGLD-bd4d79"),
        price=float(market.get("price") or 0),
        vwap_24h=float(market.get("vwap_24h") or market.get("price") or 0),
        rsi_14=float(market.get("rsi_14") or 50),
        trend_7d_pct=float(market.get("trend_7d_pct") or 0),
        price_change_1h=float(market.get("price_change_1h") or 0),
        price_change_24h=float(market.get("price_change_24h") or 0),
        liquidity_usd=float(market.get("liquidity_usd") or 100_000),
        volume_spike=float(market.get("volume_spike") or 1.0),
        dex_a=float(market.get("dex_a") or market.get("price_dex_a") or 0),
        dex_b=float(market.get("dex_b") or market.get("price_dex_b") or 0),
        fear_greed=float(market.get("fear_greed") or 50),
        gs_regime=str(market.get("gs_regime") or "NEUTRAL"),
        gs_bias=str(market.get("gs_bias") or "NEUTRAL"),
    )
    b = BookSnapshot(
        equity_usd=float(book.get("equity_usd") or book.get("total_usd") or 100),
        deployable_usd=float(book.get("deployable_usd") or 40),
        drawdown=float(book.get("drawdown") or 0),
        consecutive_wins=int(book.get("consecutive_wins") or 0),
        consecutive_losses=int(book.get("consecutive_losses") or 0),
        realized_vol=float(book.get("realized_vol") or 0.02),
        compound_intensity=float(book.get("compound_intensity") or 0.4),
    )
    return m, b


def decide_swarm(
    market: dict[str, Any], book: dict[str, Any]
) -> tuple[SwarmDecision, list[dict[str, Any]]]:
    m, b = _snapshots(market, book)
    props = collect_proposals(m, b)
    decision = coordinate(props, m, b)
    return decision, [p.to_dict() for p in props]


def _settle(closed: dict[str, Any], equity: float) -> dict[str, Any]:
    pnl = float(closed.get("net_pnl_usd") or 0)
    try:
        from lia.circuit.path_executor_hooks import after_trade_close

        return after_trade_close(
            net_pnl_usd=pnl, equity_usd=equity, persist_ledger=True, publish_path=False
        )
    except Exception as e:
        try:
            from lia.circuit.million_path import settle_win

            return settle_win(pnl, equity)
        except Exception as e2:
            return {"error": str(e), "fallback": str(e2), "pnl": pnl}


def run_integrated_cycle(
    *,
    market: Optional[dict[str, Any]] = None,
    book: Optional[dict[str, Any]] = None,
    circuit: Optional[CompoundCircuit] = None,
    simulate_fill: bool = True,
    exit_price: Optional[float] = None,
    persist_circuit: bool = True,
) -> dict[str, Any]:
    if LIVE:
        return {
            "ok": False,
            "error": "LIA_LIVE_TRADING=1 blocked in swarm_compound_bridge",
            "hint": "export LIA_LIVE_TRADING=0",
        }

    market = market or {}
    book = book or {}
    decision, proposals = decide_swarm(market, book)
    circuit = circuit or CompoundCircuit()
    equity = float(book.get("equity_usd") or book.get("total_usd") or 100)
    deployable = float(book.get("deployable_usd") or equity * 0.4)
    price = float(market.get("price") or 0)

    out: dict[str, Any] = {
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "live_flag": False,
        "decision": decision.to_dict(),
        "proposals": proposals,
        "circuit_before": circuit.health(),
        "opened": False,
        "tick": None,
        "close": None,
        "settlement": None,
    }

    if circuit.open_ticket and price > 0:
        tick = circuit.on_tick(price)
        out["tick"] = tick
        if tick.get("action") in ("STOP_LOSS", "TAKE_PROFIT", "TRAIL_STOP"):
            closed = circuit.close_trade(
                exit_price=price, reason=str(tick.get("action") or "tick")
            )
            out["close"] = closed
            out["settlement"] = _settle(closed, equity)
            if persist_circuit:
                circuit.save()
            out["circuit_after"] = circuit.health()
            return out

    action = decision.action.upper()
    if action in ("BUY", "SELL") and decision.size_usd > 0 and decision.preflight.get("allow", True):
        notional_hint = float(decision.preflight.get("notional_usd") or decision.size_usd)
        deployable_eff = max(
            deployable,
            notional_hint / max(circuit.cfg.risk_per_trade_pct, 1e-6) * circuit.cfg.stop_loss_pct,
        )
        ok, reason = circuit.can_open()
        out["can_open"] = {"ok": ok, "reason": reason}
        if ok and price > 0:
            ticket = circuit.open_trade(
                token=decision.token,
                entry=price,
                deployable_usd=deployable_eff,
                pre_balance_usd=equity,
                strategy=decision.lead_agent,
                meta={
                    "swarm_confidence": decision.confidence,
                    "swarm_reason": decision.reason,
                    "phase": decision.phase,
                    "preflight": decision.preflight,
                },
                tp_mode=os.getenv("LIA_TP_MODE", "log"),
            )
            if ticket:
                out["opened"] = True
                out["ticket"] = {
                    "token": ticket.token,
                    "entry": ticket.entry,
                    "notional_usd": ticket.notional_usd,
                    "stop": ticket.stop,
                    "target": ticket.target,
                    "strategy": ticket.strategy,
                }
                if simulate_fill:
                    tgt = ticket.target
                    px = float(exit_price) if exit_price is not None else (
                        price + (tgt - price) * 0.85
                    )
                    tick = circuit.on_tick(px)
                    out["tick"] = tick
                    closed = circuit.close_trade(
                        exit_price=px,
                        reason=str(tick.get("action") or "sim_exit"),
                    )
                    out["close"] = closed
                    out["settlement"] = _settle(closed, equity)
            else:
                out["open_fail"] = True
        elif not ok:
            out["blocked"] = reason
    elif action == "YIELD":
        out["yield"] = {
            "size_usd": decision.size_usd,
            "note": "no directional open — yield sleeve narrative",
        }
        if decision.size_usd > 0:
            circuit.streak.yield_sleeve_usd += decision.size_usd * 0.0001
            if persist_circuit:
                circuit.save()
    else:
        out["paper"] = paper_fill(decision)

    if persist_circuit:
        circuit.save()
    out["circuit_after"] = circuit.health()
    return out
