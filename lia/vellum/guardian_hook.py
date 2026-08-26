"""Guardian + RiskManager + RWA hook for Vellum (before Brain size-up)."""
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
    # 1) Risk Manager hard lock (drawdown ceiling)
    risk: dict[str, Any] = {}
    try:
        from lia.security.risk_manager import RiskManager

        rm = RiskManager(persist=True)
        rv = rm.check_safety_status(float(drawdown))
        risk = rv.to_dict()
        if rv.locked or not rv.ok:
            return {
                "allow": False,
                "reason": f"risk_manager:{rv.reason}",
                "max_notional": 0.0,
                "spiral_score": 1.0,
                "effective_leverage": 0.0,
                "kill_state": "TRIPPED",
                "risk_manager": risk,
            }
    except Exception as e:
        risk = {"error": str(e)}

    # 2) Guardian spiral / Kelly / mode
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
        "kill_state": "ARMED" if v.allow else "BLOCK",
        "risk_manager": risk,
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
    """After paper/live close: Risk tick + Guardian → optional RWA EscrowIntent."""
    try:
        from lia.security.risk_manager import RiskManager

        RiskManager(persist=True).check_safety_status(float(drawdown))
    except Exception:
        pass

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
        "intent": None
        if intent is None
        else {
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
