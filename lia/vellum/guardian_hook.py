"""Guardian + RWA hook for Vellum / orchestrator (before Brain size-up)."""
from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any, Optional

from lia.guardian.spiral import (
    GuardianVerdict,
    PolicyLimits,
    guardian_gate,
    sol_perps_allowed,
)
from lia.rwa.bridge_events import EscrowIntent, TradeSettled, plan_rwa_escrow_from_trade

ROOT = Path(__file__).resolve().parents[2]


def check_before_open(
    *,
    equity_usd: float,
    notional_usd: float,
    ret_roe: float = 0.0,
    drawdown: float = 0.0,
    compound_intensity: float = 0.0,
    consecutive_wins: int = 0,
    mode: str = "COMPOUND",
    policy: Optional[PolicyLimits] = None,
) -> dict[str, Any]:
    v = guardian_gate(
        equity=equity_usd,
        notional=notional_usd,
        ret_roe=ret_roe,
        drawdown=drawdown,
        compound_intensity=compound_intensity,
        consecutive_wins=consecutive_wins,
        mode=mode,
        policy=policy,
    )
    return {
        "allow": v.allow,
        "reason": v.reason,
        "max_notional": v.max_notional,
        "spiral_score": v.spiral_score,
        "effective_leverage": v.effective_leverage,
    }


def check_sol_perps(*, live: bool, leverage: float) -> dict[str, Any]:
    v = sol_perps_allowed(live=live, requested_leverage=leverage)
    return {
        "allow": v.allow,
        "reason": v.reason,
        "effective_leverage": v.effective_leverage,
    }


def on_trade_settled(
    *,
    trade_id: str,
    pnl_usd: float,
    equity_usd: float,
    notional_usd: float,
    ret_roe: float = 0.0,
    drawdown: float = 0.0,
    compound_intensity: float = 0.0,
    consecutive_wins: int = 0,
    mode: str = "COMPOUND",
    rwa_bucket_bps: int = 3000,
    meta_hash_hint: str = "",
    persist: bool = True,
) -> dict[str, Any]:
    """After paper/live close: Guardian → optional RWA EscrowIntent (no chain tx)."""
    event = TradeSettled(
        trade_id=trade_id,
        pnl_usd=pnl_usd,
        equity_usd=equity_usd,
        notional_usd=notional_usd,
        ret_roe=ret_roe,
        drawdown=drawdown,
        compound_intensity=compound_intensity,
        consecutive_wins=consecutive_wins,
        mode=mode,
        rwa_bucket_bps=rwa_bucket_bps,
    )
    intent = plan_rwa_escrow_from_trade(event, meta_hash_hint=meta_hash_hint)
    payload: dict[str, Any] = {
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "trade_id": trade_id,
        "pnl_usd": pnl_usd,
        "intent": None if intent is None else {
            "trade_id": intent.trade_id,
            "amount_usd": intent.amount_usd,
            "reason": intent.reason,
            "endpoint": intent.endpoint,
            "meta_hash_hint": intent.meta_hash_hint,
            "guardian_allow": intent.guardian.allow,
            "guardian_reason": intent.guardian.reason,
            "spiral_score": intent.guardian.spiral_score,
        },
    }
    if persist:
        path = ROOT / "data" / "rwa_escrow_intents.json"
        try:
            data: dict[str, Any] = {"intents": []}
            if path.exists():
                data = json.loads(path.read_text(encoding="utf-8"))
            intents = list(data.get("intents") or [])
            intents.append(payload)
            data["intents"] = intents[-50:]
            data["updated"] = payload["ts"]
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(json.dumps(data, indent=2), encoding="utf-8")
            payload["persisted"] = str(path)
        except Exception as e:
            payload["persist_error"] = str(e)
    return payload


def verdict_to_dict(v: GuardianVerdict) -> dict[str, Any]:
    return {
        "allow": v.allow,
        "reason": v.reason,
        "max_notional": v.max_notional,
        "spiral_score": v.spiral_score,
        "effective_leverage": v.effective_leverage,
    }
