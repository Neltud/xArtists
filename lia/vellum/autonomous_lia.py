"""
Autonomous LIA Cycle — Vellum-native
====================================
Objectif unique: profit (compounding trades + yields).

Pipeline autonome:
  1. ErrorBus status (halt?)
  2. Signal hub (STATARB + aux) + optional Jupiter latency arb scan
  3. Brains votes → Symbiosis fusion
  4. Guards preflight + CompoundCircuit
  5. MultiVenueExecutor (PEM/HL keys only from Vellum secrets / env)
  6. Performance reporter + streak persist
  7. Surplus → yield sleeve instruction

PEM: LIA_WALLET_PEM_PATH / LIA_WALLET_PEM — never hardcoded.
Live flags: LIA_LIVE_TRADING, LIA_SOL_LIVE, LIA_HL_LIVE (default 0).
"""
from __future__ import annotations

import json
import os
import time
from pathlib import Path
from typing import Any, Optional

from lia.circuit.compound_engine import CompoundCircuit
from lia.circuit.guards import CircuitGuards
from lia.circuit.signal_hub import build_fused_signal
from lia.executor.jupiter_latency_arb import JupiterLatencyArb
from lia.executor.multi_venue import MultiVenueExecutor
from lia.orchestration.symbiosis import (
    STRATEGY_REGISTRY,
    StrategyVote,
    fuse_votes,
    votes_from_brain_outputs,
)
from lia.vellum.error_bus import ErrorBus

ROOT = Path(__file__).resolve().parents[2]
PERF_PATH = ROOT / "data" / "lia_performance.json"


def _pem_ready() -> bool:
    path = os.getenv("LIA_WALLET_PEM_PATH", "")
    if path and Path(path).is_file():
        return True
    # Some Vellum setups inject PEM content into env var (not a path)
    return bool(os.getenv("LIA_WALLET_PEM", ""))


def _append_perf(trade: dict[str, Any]) -> dict[str, Any]:
    try:
        state = json.loads(PERF_PATH.read_text(encoding="utf-8")) if PERF_PATH.exists() else {}
    except Exception:
        state = {}
    state.setdefault("trades", []).append(trade)
    if trade.get("type") == "exit":
        state.setdefault("closed_trades", []).append(trade)
    state["updated_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    PERF_PATH.parent.mkdir(parents=True, exist_ok=True)
    PERF_PATH.write_text(json.dumps(state, indent=2), encoding="utf-8")
    return state


def run_autonomous_lia(
    *,
    market: Optional[dict[str, Any]] = None,
    portfolio: Optional[dict[str, Any]] = None,
    pairs_market: Optional[list[dict[str, Any]]] = None,
    brain_outputs: Optional[list[dict[str, Any]]] = None,
    gs: Optional[dict[str, Any]] = None,
    force_mode: str = "paper",  # paper | live
    enable_jupiter_arb: bool = True,
    jupiter_arb_amount: int = 10_000_000,
) -> dict[str, Any]:
    market = market or {}
    portfolio = portfolio or {"deployable_usd": 0, "total_usd": 0}
    gs = gs or {"regime": "NEUTRAL", "bias": "NEUTRAL"}
    errors = ErrorBus()
    log: list[str] = []

    out: dict[str, Any] = {
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "mode": force_mode,
        "objective": "profit_compound_yield",
        "pem_configured": _pem_ready(),
    }

    if errors.halted:
        out["event"] = "HALTED"
        out["error_bus"] = errors.status()
        out["log"] = ["error_bus halt"]
        return out

    # --- 1. Signals (STATARB priority) ---
    try:
        signal = build_fused_signal(
            pairs_market=pairs_market,
            market=market,
            gs=gs,
            include_aux=True,
        )
        log.append(f"signal={signal.get('strategy')}:{signal.get('action')} conf={signal.get('confidence')}")
    except Exception as e:
        errors.report("signal_hub", e)
        signal = {"action": "WAIT", "confidence": 0.3, "strategy": "ERR", "reason": str(e)}

    # --- 2. Jupiter latency arb (optional micro edge) ---
    arb_result = None
    if enable_jupiter_arb and str(gs.get("regime") or "").upper() != "RISK_OFF":
        try:
            arb = JupiterLatencyArb()
            arb_result = arb.try_arb(
                input_mint=str(market.get("jup_input") or "SOL"),
                output_mint=str(market.get("jup_output") or "USDC"),
                amount=int(market.get("jup_amount") or jupiter_arb_amount),
                force_paper=(force_mode != "live"),
            )
            if arb_result.get("ok"):
                log.append(f"jup_arb filled edge={arb_result.get('executed', {}).get('arb_edge_bps')}")
                _append_perf(
                    {
                        "type": "exit",
                        "venue": "jupiter",
                        "strategy": "JUPITER_ARB",
                        "pnl_usd": 0,  # filled by reporter when known
                        "meta": arb_result.get("executed"),
                        "ts": out["ts"],
                    }
                )
            else:
                log.append(f"jup_arb skip: {(arb_result.get('opportunity') or {}).get('reason')}")
        except Exception as e:
            errors.report("jupiter_arb", e)
            log.append(f"jup_arb error: {e}")

    # --- 3. Symbiosis votes ---
    brains = list(brain_outputs or [])
    # Inject STATARB / circuit vote from signal hub
    if signal.get("action") in ("BUY", "SELL"):
        brains.append(
            {
                "strategy": "STATARB" if signal.get("strategy") == "STATARB" else "CIRCUIT_1PCT",
                "decision": signal.get("action"),
                "confidence": float(signal.get("confidence") or 0) * (100 if float(signal.get("confidence") or 0) <= 1 else 1),
                "token": signal.get("token") or market.get("token") or "",
                "amount_usd": float(portfolio.get("deployable_usd") or 0) * 0.12,
                "budget_allocation_pct": 0.12,
                "reasoning": signal.get("reason") or "",
                "actions": [
                    {
                        "type": f"{signal.get('action')}_{signal.get('token') or 'TOKEN'}",
                        "token_id": signal.get("token"),
                        "amount_usd": float(portfolio.get("deployable_usd") or 0) * 0.12,
                        "strategy": signal.get("strategy"),
                        "venue": signal.get("meta", {}).get("venue") or "auto",
                        "meta": signal.get("meta") or {},
                    }
                ],
            }
        )
    if arb_result and arb_result.get("ok"):
        brains.append(
            {
                "strategy": "JUPITER_ARB",
                "decision": "BUY",
                "confidence": 85,
                "token": "SOL",
                "reasoning": "latency arb filled",
                "budget_allocation_pct": 0.05,
            }
        )

    try:
        votes = votes_from_brain_outputs(brains) if brains else []
        if not votes and signal.get("action") == "WAIT":
            votes = [
                StrategyVote(
                    "YieldAgent", "YIELD", 70,
                    amount_usd=float(portfolio.get("deployable_usd") or 0) * 0.3,
                    reason="no trade edge",
                )
            ]
        sym = fuse_votes(
            votes,
            deployable_usd=float(portfolio.get("deployable_usd") or 0),
            gs_regime=str(gs.get("regime") or "NEUTRAL"),
        )
    except Exception as e:
        errors.report("symbiosis", e)
        out["event"] = "ERROR"
        out["error"] = str(e)
        out["log"] = log
        return out

    # --- 4. Guards + compound open path ---
    guards = CircuitGuards()
    circuit = CompoundCircuit()
    deployable = float(portfolio.get("deployable_usd") or 0)

    executor_actions = []
    for a in sym.approved_actions:
        t = str(a.get("type") or "").upper()
        if t == "BUY":
            executor_actions.append(
                {
                    "type": f"BUY_{str(a.get('token') or 'TOKEN').split('-')[0]}",
                    "token_id": a.get("token"),
                    "amount_usd": a.get("amount_usd"),
                    "strategy": a.get("strategy"),
                    "venue": a.get("venue") or "auto",
                    "side": "buy",
                    "reason": a.get("reason"),
                }
            )
        elif t == "SELL":
            executor_actions.append(
                {
                    "type": f"SELL_{str(a.get('token') or 'TOKEN').split('-')[0]}",
                    "token_id": a.get("token"),
                    "amount_usd": a.get("amount_usd"),
                    "strategy": a.get("strategy"),
                    "venue": a.get("venue") or "auto",
                    "side": "sell",
                }
            )
        elif t in ("HATOM_SUPPLY", "YIELD", "PARK_STABLE"):
            executor_actions.append(
                {
                    "type": "YIELD",
                    "amount_usd": a.get("amount_usd"),
                    "strategy": a.get("strategy") or "YieldAgent",
                    "venue": "mvx",
                }
            )

    # Preflight first BUY
    pre = {"ok": True, "blockers": []}
    open_ticket = None
    buys = [a for a in executor_actions if str(a.get("type", "")).startswith("BUY")]
    if buys and deployable > 0:
        token = str(buys[0].get("token_id") or market.get("token") or "WEGLD-bd4d79")
        pre = guards.preflight(
            token=token,
            deployable_usd=deployable,
            liquidity_usd=float(market.get("liquidity_usd") or 1e12),
            gs_regime=str(gs.get("regime") or "NEUTRAL"),
            hatom_hf=float(portfolio.get("hatom_hf") or 999),
            hours_since_swap=float(market.get("hours_since_swap") or 999),
            consecutive_losses=circuit.streak.consecutive_losses,
            consecutive_wins=circuit.streak.consecutive_wins,
            halted_flag=circuit.streak.halted,
            halt_reason=circuit.streak.halt_reason,
            cooldown_until=circuit.streak.cooldown_until,
            total_closed_trades=circuit.streak.wins + circuit.streak.losses,
            equity_usd=float(circuit.streak.compound_equity_usd + circuit.streak.yield_sleeve_usd),
            peak_usd=float(circuit.streak.peak_equity_usd or 0),
            confidence=float(signal.get("confidence") or 0.6),
            strategy=str(signal.get("strategy") or buys[0].get("strategy") or ""),
            intent="BUY",
            profit_validated=True,
        )
        if pre.get("ok") and not circuit.streak.halted:
            entry = float(market.get("price") or signal.get("entry_hint") or 0)
            if entry > 0:
                open_ticket = circuit.open_trade(
                    token=token,
                    entry=entry,
                    deployable_usd=min(deployable, float(pre.get("max_notional") or deployable)),
                    pre_balance_usd=float(portfolio.get("total_usd") or 0),
                    tx_open="paper" if force_mode != "live" else "",
                    strategy=str(buys[0].get("strategy") or ""),
                    meta=signal.get("meta") or {},
                )
                if open_ticket:
                    guards.record_trade_opened()
                    log.append(f"opened {open_ticket.id} {token}")

    # --- 5. Multi-venue execute (paper/live) ---
    exec_report = {"ok": True, "executed": [], "failed": []}
    if executor_actions and pre.get("ok"):
        try:
            mv = MultiVenueExecutor()
            # live only if forced AND pem/keys ready for that venue
            paper = force_mode != "live"
            if force_mode == "live" and not _pem_ready():
                # still allow jupiter/hl if their keys exist; mvx stays paper
                log.append("PEM missing — MVX forced paper")
            exec_report = mv.execute_many(executor_actions, force_paper=paper)
            if exec_report.get("fail_count", 0) > 0:
                for f in exec_report.get("executed") or []:
                    if not f.get("ok"):
                        errors.report("executor", f.get("error") or f.get("detail") or "exec fail", f)
            else:
                errors.success()
        except Exception as e:
            errors.report("executor", e)
            exec_report = {"ok": False, "error": str(e)}

    # --- 6. Report ---
    if open_ticket:
        _append_perf(
            {
                "type": "entry",
                "id": open_ticket.id,
                "token": open_ticket.token,
                "amount_usd": open_ticket.notional_usd,
                "price": open_ticket.entry,
                "strategy": open_ticket.strategy,
                "ts": out["ts"],
            }
        )

    event = "IDLE"
    if open_ticket:
        event = "OPENED"
    elif arb_result and arb_result.get("ok"):
        event = "ARB_FILLED"
    elif sym.mode == "YIELD_ONLY":
        event = "YIELD"
    elif not pre.get("ok"):
        event = "BLOCKED"
    elif sym.mode == "BLOCKED":
        event = "BLOCKED"

    out.update(
        {
            "event": event,
            "signal": signal,
            "symbiosis": sym.to_dict(),
            "preflight": pre,
            "ticket": open_ticket.to_dict() if open_ticket else None,
            "executor": exec_report,
            "jupiter_arb": arb_result,
            "compound_health": circuit.health(),
            "error_bus": errors.status(),
            "log": log,
            "next": (
                "monitor TP/SL/time-stop; surplus→yield sleeve; "
                "PEM stays in Vellum secrets; compound equity persists"
            ),
        }
    )
    return out


if __name__ == "__main__":
    r = run_autonomous_lia(
        market={
            "token": "WEGLD-bd4d79",
            "price": 9.6,
            "liquidity_usd": 200_000,
            "rsi_14": 38,
            "vwap_24h": 10.0,
        },
        portfolio={"deployable_usd": 50, "total_usd": 60, "hatom_hf": 3.0},
        pairs_market=[
            {
                "token_a": "WEGLD-bd4d79",
                "token_b": "USDC-c76f1f",
                "price_a": 9.6,
                "price_b": 1.0,
                "liquidity_a": 200000,
                "liquidity_b": 500000,
                "half_life_h": 10,
                "cointegration_score": 0.82,
            }
        ],
        force_mode="paper",
        enable_jupiter_arb=True,
    )
    print(json.dumps(r, indent=2, default=str)[:4000])
