"""
Boucle ouverte autonome LIA — STATARB intégré
=============================================
1. Refresh mémoire on-chain
2. build_fused_signal (pairs_market → STATARB prioritaires)
3. Multi-horizon decision
4. Circuit ST si BUY
5. DCA / YIELD / REBALANCE selon fusion
6. Persist décisions + cadence timestamps
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

from lia.circuit.signal_hub import build_fused_signal
from lia.decision.multi_horizon import decide, Intent
from lia.memory.onchain_memory import build_memory, hours_since_last_swap, should_pace_trade, DEFAULT_WALLET

STATE_PATH = Path("data/lia_autonomous_state.json")


def _load_state() -> dict[str, Any]:
    try:
        return json.loads(STATE_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {
            "last_dca_ts": 0,
            "last_rebalance_ts": 0,
            "decisions": [],
            "updated_at": "",
        }


def _save_state(state: dict[str, Any]) -> None:
    state["updated_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    state["decisions"] = state.get("decisions", [])[-100:]
    STATE_PATH.write_text(json.dumps(state, indent=2), encoding="utf-8")


def run_autonomous_cycle(
    *,
    market: dict[str, Any],
    portfolio: dict[str, Any],
    gs: Optional[dict[str, Any]] = None,
    signal: Optional[dict[str, Any]] = None,
    pairs_market: Optional[list[dict[str, Any]]] = None,
    circuit_can_open: bool = True,
    circuit_reason: str = "OK",
    profit_validated: bool = False,
    fetch_memory: bool = True,
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
    signal = fused_sig

    state = _load_state()
    now = time.time()

    memory_meta: dict[str, Any] = {}
    hours_swap = 999.0
    if fetch_memory:
        try:
            snap = build_memory(address=wallet, size=50)
            hours_swap = hours_since_last_swap(snap)
            pace_ok, pace_msg = should_pace_trade(snap, min_hours_between=0.33)
            memory_meta = {
                "tx_count": snap.tx_count,
                "by_kind": snap.by_kind,
                "success_rate": snap.success_rate,
                "avg_gap_sec_swaps": snap.avg_gap_sec_swaps,
                "pace_ok": pace_ok,
                "pace_msg": pace_msg,
                "last_swap_ts": snap.last_swap_ts,
            }
            if not pace_ok:
                circuit_can_open = False
                circuit_reason = pace_msg
        except Exception as e:
            memory_meta = {"error": str(e), "pace_ok": True}

    hours_dca = (now - float(state.get("last_dca_ts") or 0)) / 3600.0
    hours_reb = (now - float(state.get("last_rebalance_ts") or 0)) / 3600.0

    weights = portfolio.get("weights") or {}
    if not weights and portfolio.get("total_usd"):
        total = float(portfolio.get("total_usd") or 1)
        weights = {
            "USDC": float(portfolio.get("usdc_usd") or 0) / total,
            "EGLD": float(portfolio.get("egld_usd") or 0) / total,
            "WBTC": float(portfolio.get("wbtc_usd") or 0) / total,
        }

    fused = decide(
        signal_action=str(signal.get("action") or "WAIT"),
        signal_conf=float(signal.get("confidence") or 0.5),
        signal_strategy=str(signal.get("strategy") or ""),
        circuit_can_open=circuit_can_open,
        circuit_reason=circuit_reason,
        gs_regime=str(gs.get("regime") or "NEUTRAL"),
        gs_bias=str(gs.get("bias") or "NEUTRAL"),
        profit_validated=profit_validated,
        hours_since_swap=hours_swap,
        hours_since_dca=hours_dca,
        hours_since_rebalance=hours_reb,
        trend_7d_pct=float(market.get("trend_7d_pct") or 0),
        rsi_14=float(market.get("rsi_14") or 50),
        deployable_usd=float(portfolio.get("deployable_usd") or 0),
        total_usd=float(portfolio.get("total_usd") or 0),
        weights=weights,
    )

    if fused.intent == Intent.ACCUMULATE.value:
        state["last_dca_ts"] = now
    if fused.intent == Intent.REBALANCE.value:
        state["last_rebalance_ts"] = now

    state.setdefault("decisions", []).append(
        {
            "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "intent": fused.intent,
            "confidence": fused.confidence,
            "veto": fused.veto,
            "signal_strategy": signal.get("strategy"),
            "signal_action": signal.get("action"),
            "reinvest": fused.reinvest,
        }
    )
    _save_state(state)

    return {
        "decision": fused.to_dict(),
        "signal": signal,
        "memory": memory_meta,
        "explorer": f"https://explorer.multiversx.com/accounts/{wallet}",
        "state_path": str(STATE_PATH),
        "note": "Open-loop: STATARB via signal_hub; execute reinvest.actions via UniversalExecutor; never hold TRO",
    }


if __name__ == "__main__":
    out = run_autonomous_cycle(
        market={"trend_7d_pct": -4, "rsi_14": 40, "token": "WEGLD-bd4d79", "price": 9.5},
        portfolio={
            "deployable_usd": 40,
            "total_usd": 50,
            "usdc_usd": 30,
            "egld_usd": 15,
            "wbtc_usd": 5,
        },
        pairs_market=[
            {
                "token_a": "WEGLD-bd4d79",
                "token_b": "USDC-c76f1f",
                "price_a": 9.5,
                "price_b": 1.0,
                "liquidity_a": 150000,
                "liquidity_b": 400000,
                "half_life_h": 12,
                "cointegration_score": 0.8,
            }
        ],
        profit_validated=True,
        fetch_memory=False,
    )
    print(json.dumps(out, indent=2))
