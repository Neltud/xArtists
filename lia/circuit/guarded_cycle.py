"""
Guarded cycle — STATARB + CircuitGuards + Guardian spiral + Compound
====================================================================
Entry point Vellum / cron:
  run_guarded_cycle(...)
    0. build_fused_signal
    1. Build context (streak, memory, portfolio)
    2. preflight ALL guards (risk scale dynamique)
    2b. Guardian spiral / defense (before open)
    3. If ok + BUY intent → open with strategy/meta + armed stops
    4. If open ticket → runtime_action (SL/BE/trail/TIME_STOP)
    5. On close → record + optional RWA intent
"""
from __future__ import annotations

import json
import sys
import time
from pathlib import Path
from typing import Any, Optional

_ROOT = Path(__file__).resolve().parents[2]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from lia.circuit.compound_engine import CompoundCircuit, Phase
from lia.circuit.guards import CircuitGuards
from lia.circuit.signal_hub import build_fused_signal
from lia.decision.multi_horizon import decide, Intent

try:
    from lia.memory.onchain_memory import build_memory, hours_since_last_swap, DEFAULT_WALLET
except Exception:
    DEFAULT_WALLET = "erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6"

    def build_memory(*a, **k):
        raise RuntimeError("memory unavailable")

    def hours_since_last_swap(snap):
        return 999.0


def run_guarded_cycle(
    *,
    market: dict[str, Any],
    portfolio: dict[str, Any],
    gs: Optional[dict[str, Any]] = None,
    signal: Optional[dict[str, Any]] = None,
    pairs_market: Optional[list[dict[str, Any]]] = None,
    profit_validated: bool = True,
    fetch_memory: bool = False,
    pre_chain_ok: bool = True,
    pre_chain_detail: str = "skipped",
    mode: str = "paper",
    wallet: str = DEFAULT_WALLET,
    pairs_path: str = "data/lia_statarb_pairs.json",
) -> dict[str, Any]:
    gs = gs or {}

    fused_sig = build_fused_signal(
        pairs_market=pairs_market,
        market=market,
        gs=gs,
        external_signal=signal,
        pairs_path=pairs_path,
        include_aux=True,
    )
    if signal and str(signal.get("action", "WAIT")).upper() in ("BUY", "SELL"):
        if fused_sig.get("action") == "WAIT":
            fused_sig = {
                "action": signal.get("action"),
                "confidence": float(signal.get("confidence") or 0.5),
                "strategy": str(signal.get("strategy") or "EXT"),
                "reason": str(signal.get("reason") or "external"),
                "token": str(signal.get("token") or market.get("token") or ""),
                "meta": signal.get("meta") or {},
                "entry_hint": float(signal.get("entry_hint") or market.get("price") or 0),
                "components": fused_sig.get("components") or [],
            }

    signal = fused_sig
    guards = CircuitGuards()
    circuit = CompoundCircuit()

    if circuit.open_ticket:
        price = float(market.get("price") or 0)
        t = circuit.open_ticket
        if pairs_market:
            for snap in pairs_market:
                if str(snap.get("token_a") or "") == t.token and float(snap.get("price_a") or 0) > 0:
                    price = float(snap["price_a"])
                    break

        rt = guards.runtime_action(
            entry=t.entry,
            price=price,
            stop=t.stop,
            target=t.target,
            hwm=t.hwm,
            trail_active=t.trail_active,
            opened_at=getattr(t, "opened_at", None),
        )
        tick = circuit.on_tick(price)
        action = rt["action"] if rt["action"] != "HOLD" else tick.get("action", "HOLD")

        if action in ("STOP_LOSS", "TAKE_PROFIT", "TIME_STOP"):
            forced = "LOSS" if action in ("STOP_LOSS", "TIME_STOP") else "WIN"
            if action == "TIME_STOP":
                forced = None
            result = circuit.close_trade(
                exit_price=price,
                post_balance_usd=float(portfolio.get("total_usd") or 0),
                forced_outcome=forced,
            )
            rwa_out: dict[str, Any] = {}
            try:
                from lia.vellum.guardian_hook import on_trade_settled

                pnl = 0.0
                if isinstance(result, dict):
                    pnl = float(result.get("net_pnl_usd") or result.get("pnl_usd") or 0)
                equity = float(
                    circuit.streak.compound_equity_usd + circuit.streak.yield_sleeve_usd
                )
                rwa_out = on_trade_settled(
                    trade_id=str(getattr(t, "id", None) or f"close-{int(time.time())}"),
                    pnl_usd=pnl,
                    equity_usd=equity or float(portfolio.get("total_usd") or 0),
                    notional_usd=float(getattr(t, "notional_usd", 0) or 0),
                    ret_roe=float(portfolio.get("ret_roe") or 0),
                    drawdown=float(portfolio.get("drawdown") or 0),
                    compound_intensity=float(portfolio.get("compound_intensity") or 0.2),
                    consecutive_wins=int(circuit.streak.consecutive_wins or 0),
                    mode=str(market.get("lia_mode") or "COMPOUND"),
                    persist=True,
                )
            except Exception as e:
                rwa_out = {"error": str(e)}
            return {
                "event": "CLOSED",
                "action": action,
                "result": result,
                "rwa_intent": rwa_out,
                "signal": signal,
                "guards": guards.status(),
                "phase": circuit.phase.value,
            }
        return {
            "event": "HOLD",
            "runtime": rt,
            "tick": tick,
            "signal": signal,
            "guards": guards.status(),
            "phase": circuit.phase.value,
        }

    hours_swap = 999.0
    memory_meta: dict[str, Any] = {}
    if fetch_memory:
        try:
            snap = build_memory(address=wallet, size=40)
            hours_swap = hours_since_last_swap(snap)
            memory_meta = {"tx_count": snap.tx_count, "by_kind": snap.by_kind}
        except Exception as e:
            memory_meta = {"error": str(e)}

    can_open, reason = circuit.can_open()
    equity = float(circuit.streak.compound_equity_usd + circuit.streak.yield_sleeve_usd)
    peak = float(circuit.streak.peak_equity_usd or equity)
    if equity <= 0:
        equity = float(portfolio.get("total_usd") or portfolio.get("equity_usd") or 0)

    token = str(
        signal.get("token")
        or market.get("token")
        or "WEGLD-bd4d79"
    )
    entry = float(market.get("price") or 0)
    if signal.get("entry_hint"):
        entry = float(signal["entry_hint"]) or entry
    if pairs_market and token:
        for snap in pairs_market:
            if str(snap.get("token_a") or "") == token and float(snap.get("price_a") or 0) > 0:
                entry = float(snap["price_a"])
                if not market.get("liquidity_usd"):
                    market = {**market, "liquidity_usd": float(snap.get("liquidity_a") or 0)}
                break

    pre = guards.preflight(
        token=token,
        deployable_usd=float(portfolio.get("deployable_usd") or 0),
        liquidity_usd=float(market.get("liquidity_usd") or 1e12),
        gs_regime=str(gs.get("regime") or "NEUTRAL"),
        hatom_hf=float(portfolio.get("hatom_hf") or 999),
        hours_since_swap=hours_swap,
        has_open_position=circuit.open_ticket is not None,
        consecutive_losses=circuit.streak.consecutive_losses,
        consecutive_wins=circuit.streak.consecutive_wins,
        halted_flag=circuit.streak.halted,
        halt_reason=circuit.streak.halt_reason,
        cooldown_until=circuit.streak.cooldown_until,
        total_closed_trades=circuit.streak.wins + circuit.streak.losses,
        equity_usd=equity,
        peak_usd=peak,
        intent=str(signal.get("action") or "BUY"),
        profit_validated=profit_validated,
        pre_chain_ok=pre_chain_ok,
        pre_chain_detail=pre_chain_detail,
        atr_pct=float(market["atr_pct"]) if market.get("atr_pct") is not None else None,
        confidence=float(signal.get("confidence") or 0.5),
        strategy=str(signal.get("strategy") or ""),
    )

    fused = decide(
        signal_action=str(signal.get("action") or "WAIT"),
        signal_conf=float(signal.get("confidence") or 0.5),
        signal_strategy=str(signal.get("strategy") or ""),
        circuit_can_open=can_open and pre["ok"],
        circuit_reason=reason if not can_open else ("guards_blocked" if not pre["ok"] else "OK"),
        gs_regime=str(gs.get("regime") or "NEUTRAL"),
        gs_bias=str(gs.get("bias") or "NEUTRAL"),
        profit_validated=profit_validated and pre["ok"],
        hours_since_swap=hours_swap,
        trend_7d_pct=float(market.get("trend_7d_pct") or 0),
        rsi_14=float(market.get("rsi_14") or 50),
        deployable_usd=float(portfolio.get("deployable_usd") or 0),
        total_usd=float(portfolio.get("total_usd") or 0),
        weights=portfolio.get("weights"),
    )

    if fused.veto or fused.intent in (Intent.WAIT.value, Intent.HOLD.value, Intent.YIELD.value, Intent.HALT.value):
        return {
            "event": fused.intent,
            "decision": fused.to_dict(),
            "signal": signal,
            "preflight": pre,
            "memory": memory_meta,
            "guards": guards.status(),
            "phase": circuit.phase.value,
        }

    if fused.intent != Intent.BUY.value and fused.intent != Intent.ACCUMULATE.value:
        return {
            "event": fused.intent,
            "decision": fused.to_dict(),
            "signal": signal,
            "preflight": pre,
            "guards": guards.status(),
        }

    if not pre["ok"]:
        return {
            "event": "BLOCKED",
            "preflight": pre,
            "decision": fused.to_dict(),
            "signal": signal,
            "guards": guards.status(),
            "phase": Phase.IDLE.value,
        }

    if entry <= 0:
        return {"event": "ERROR", "error": "invalid entry price", "preflight": pre, "signal": signal}

    size_mult = float(fused.size_mult or 1.0)
    risk_scale = float(pre.get("risk_scale") or 1.0)
    deployable = float(portfolio.get("deployable_usd") or 0) * min(1.0, max(0.05, size_mult * risk_scale))

    # Guardian spiral — before Brain open
    lia_mode = str(
        market.get("lia_mode")
        or ("DEFENSE" if str(gs.get("regime") or "").upper() in ("RISK_OFF", "FEAR") else "COMPOUND")
    )
    guardian: dict[str, Any] = {}
    try:
        from lia.vellum.guardian_hook import check_before_open

        guardian = check_before_open(
            equity_usd=max(equity, float(portfolio.get("total_usd") or 0), 1.0),
            notional_usd=deployable,
            ret_roe=float(portfolio.get("ret_roe") or 0),
            drawdown=float(portfolio.get("drawdown") or 0),
            compound_intensity=float(portfolio.get("compound_intensity") or 0.25),
            consecutive_wins=int(circuit.streak.consecutive_wins or 0),
            mode=lia_mode,
        )
        if not guardian.get("allow"):
            return {
                "event": "GUARDIAN_BLOCK",
                "guardian": guardian,
                "preflight": pre,
                "decision": fused.to_dict(),
                "signal": signal,
                "guards": guards.status(),
                "phase": Phase.IDLE.value,
            }
        max_n = float(guardian.get("max_notional") or deployable)
        deployable = min(deployable, max_n) if max_n > 0 else deployable
    except Exception as e:
        return {
            "event": "GUARDIAN_ERROR",
            "error": str(e),
            "preflight": pre,
            "signal": signal,
        }

    strategy = str(signal.get("strategy") or "")
    meta = signal.get("meta") or {}
    if strategy:
        meta = {**meta, "strategy": strategy}
    meta = {**meta, "guardian": guardian}

    ticket = circuit.open_trade(
        token=token,
        entry=entry,
        deployable_usd=deployable,
        pre_balance_usd=float(portfolio.get("total_usd") or 0),
        tx_open="paper" if mode != "live" else "",
        strategy=strategy,
        meta=meta,
    )
    if not ticket:
        return {
            "event": "OPEN_FAIL",
            "preflight": pre,
            "guardian": guardian,
            "can_open": circuit.can_open(),
            "signal": signal,
            "guards": guards.status(),
        }

    armed = guards.arm_stops(entry, ticket.notional_usd)
    ticket.stop = max(ticket.stop, armed["stop"])
    if strategy != "STATARB":
        ticket.target = armed["target"]
        ticket.gross_required_pct = armed["gross_required_pct"]
    circuit.open_ticket = ticket
    circuit.save()
    guards.record_trade_opened()

    return {
        "event": "OPENED",
        "ticket": ticket.to_dict(),
        "armed_stops": armed,
        "guardian": guardian,
        "decision": fused.to_dict(),
        "signal": signal,
        "preflight": pre,
        "memory": memory_meta,
        "guards": guards.status(),
        "phase": circuit.phase.value,
        "mode": mode,
    }


if __name__ == "__main__":
    out = run_guarded_cycle(
        market={
            "token": "WEGLD-bd4d79",
            "price": 9.5,
            "liquidity_usd": 150_000,
            "rsi_14": 40,
            "trend_7d_pct": -2,
            "vwap_24h": 10.0,
        },
        portfolio={"deployable_usd": 40, "total_usd": 50, "hatom_hf": 3.0},
        pairs_market=[
            {
                "token_a": "WEGLD-bd4d79",
                "token_b": "USDC-c76f1f",
                "price_a": 9.5,
                "price_b": 1.0,
                "liquidity_a": 150_000,
                "liquidity_b": 400_000,
                "half_life_h": 12.0,
                "cointegration_score": 0.8,
            }
        ],
        profit_validated=True,
        gs={"regime": "NEUTRAL", "bias": "NEUTRAL"},
        mode="paper",
    )
    print(json.dumps(out, indent=2))
