"""
Digital fortress — size, NFT, velocity, drawdown, gas budget (CRITICAL).
Halt is file-backed (not env-only).
"""
from __future__ import annotations

import json
import os
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
STATE = ROOT / "data" / "risk_enforcer_state.json"

MAX_TRADE_EGLD = 0.01
MAX_TRADE_USD = 15.0
MAX_DAILY_LOSS_USD = 25.0
MAX_DRAWDOWN_PCT = 0.12
MAX_GAS = 40_000_000
MIN_RESERVE_EGLD = 0.05
MAX_TX_PER_HOUR = 8
MAX_TX_PER_DAY = 24
MIN_SECONDS_BETWEEN_TX = 45
MAX_GAS_SPEND_EGLD_DAY = 0.02
ALLOWED_TOKENS = frozenset({"EGLD", "WEGLD-bd4d79", "USDC-c76f1f", "TRO-94c925"})


@dataclass
class RiskVerdict:
    ok: bool
    reason: str = ""
    checks: dict[str, Any] = field(default_factory=dict)


def _load_state() -> dict[str, Any]:
    if STATE.is_file():
        try:
            return json.loads(STATE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {
        "daily_loss_usd": 0.0,
        "realized_loss_usd": 0.0,
        "gas_spend_egld_day": 0.0,
        "day": "",
        "halt": False,
        "trades_today": 0,
        "tx_timestamps": [],
        "equity_peak_usd": 0.0,
        "equity_now_usd": 0.0,
    }


def _save_state(st: dict[str, Any]) -> None:
    STATE.parent.mkdir(parents=True, exist_ok=True)
    STATE.write_text(json.dumps(st, indent=2), encoding="utf-8")
    for dest in (
        ROOT / "apps" / "frontend" / "public" / "data" / "risk_enforcer_state.json",
        ROOT / "docs" / "data" / "risk_enforcer_state.json",
    ):
        try:
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(json.dumps(st, indent=2), encoding="utf-8")
        except OSError:
            pass


def _roll_day(st: dict[str, Any]) -> dict[str, Any]:
    day = time.strftime("%Y-%m-%d", time.gmtime())
    if st.get("day") != day:
        st = {
            "daily_loss_usd": 0.0,
            "realized_loss_usd": float(st.get("realized_loss_usd") or 0),
            "gas_spend_egld_day": 0.0,
            "day": day,
            "halt": bool(st.get("halt")),
            "halt_reason": st.get("halt_reason"),
            "trades_today": 0,
            "tx_timestamps": [],
            "equity_peak_usd": float(st.get("equity_peak_usd") or 0),
            "equity_now_usd": float(st.get("equity_now_usd") or 0),
            "drawdown_pct": st.get("drawdown_pct"),
        }
        _save_state(st)
    return st


def is_halted() -> bool:
    """File-backed halt — source of truth across processes."""
    st = _roll_day(_load_state())
    return bool(st.get("halt"))


def update_equity(equity_usd: float) -> dict[str, Any]:
    st = _roll_day(_load_state())
    eq = float(equity_usd)
    st["equity_now_usd"] = eq
    peak = float(st.get("equity_peak_usd") or 0)
    if eq > peak:
        st["equity_peak_usd"] = eq
        peak = eq
    dd = 0.0 if peak <= 0 else max(0.0, (peak - eq) / peak)
    st["drawdown_pct"] = round(dd, 6)
    if dd >= MAX_DRAWDOWN_PCT:
        st["halt"] = True
        st["halt_reason"] = f"drawdown_{dd:.2%}>={MAX_DRAWDOWN_PCT:.0%}"
        try:
            from lia.guardian.kill_switch import get_kill_switch

            get_kill_switch().trigger(st["halt_reason"], event_type="DRAWDOWN_HALT")
        except Exception:
            pass
    _save_state(st)
    return st


def enforce(
    *,
    asset_type: str = "TOKEN",
    token_id: str = "EGLD",
    amount_egld: float = 0.0,
    amount_usd: float = 0.0,
    gas_limit: int = 0,
    wallet_egld: float | None = None,
    equity_usd: float | None = None,
    projected_gas_egld: float = 0.0,
) -> RiskVerdict:
    checks: dict[str, Any] = {}
    st = _roll_day(_load_state())

    if equity_usd is not None:
        st = update_equity(equity_usd)

    # CRITICAL: file halt beats env
    if st.get("halt"):
        return RiskVerdict(False, f"EMERGENCY_HALT:{st.get('halt_reason')}", {"state": st})

    from lia.brain.agent_constraints import assert_tradable_asset
    from lia.guardian.kill_switch import get_kill_switch

    ks = get_kill_switch()
    checks["kill_switch"] = ks.is_locked
    if ks.is_locked:
        return RiskVerdict(False, f"kill_switch:{ks.reason}", checks)

    guard = assert_tradable_asset(target_asset_type=asset_type, token_id=token_id)
    checks["nft_guard"] = guard
    if not guard.get("ok"):
        return RiskVerdict(False, "NO_NFT_RULE", checks)

    tid = (token_id or "EGLD").upper()
    allowed = {x.upper() for x in ALLOWED_TOKENS}
    if tid not in allowed and tid != "EGLD":
        return RiskVerdict(False, f"token_not_allowlisted:{token_id}", checks)

    if amount_egld > MAX_TRADE_EGLD + 1e-12:
        return RiskVerdict(False, f"size_egld>{MAX_TRADE_EGLD}", checks)
    if amount_usd > MAX_TRADE_USD + 1e-9:
        return RiskVerdict(False, f"size_usd>{MAX_TRADE_USD}", checks)
    if gas_limit > MAX_GAS:
        return RiskVerdict(False, f"gas>{MAX_GAS}", checks)

    gas_day = float(st.get("gas_spend_egld_day") or 0) + float(projected_gas_egld or 0)
    checks["gas_spend_egld_day_projected"] = round(gas_day, 8)
    if gas_day > MAX_GAS_SPEND_EGLD_DAY:
        return RiskVerdict(False, f"GAS_BUDGET_DAY>{MAX_GAS_SPEND_EGLD_DAY}", checks)

    if wallet_egld is not None and wallet_egld < amount_egld + MIN_RESERVE_EGLD:
        return RiskVerdict(False, "insufficient_reserve", checks)

    if float(st.get("daily_loss_usd") or 0) >= MAX_DAILY_LOSS_USD:
        st["halt"] = True
        st["halt_reason"] = "DAILY_LOSS_HALT"
        _save_state(st)
        return RiskVerdict(False, "DAILY_LOSS_HALT", checks)

    now = time.time()
    ts = [float(t) for t in (st.get("tx_timestamps") or []) if now - float(t) < 86400]
    hour = [t for t in ts if now - t < 3600]
    checks["tx_last_hour"] = len(hour)
    checks["tx_today"] = len(ts)
    if len(hour) >= MAX_TX_PER_HOUR:
        return RiskVerdict(False, "VELOCITY_HOUR", checks)
    if len(ts) >= MAX_TX_PER_DAY:
        return RiskVerdict(False, "VELOCITY_DAY", checks)
    if ts and (now - max(ts)) < MIN_SECONDS_BETWEEN_TX:
        return RiskVerdict(False, f"VELOCITY_COOLDOWN_{MIN_SECONDS_BETWEEN_TX}s", checks)

    checks["drawdown_pct"] = float(st.get("drawdown_pct") or 0)
    checks["max_trade_egld"] = MAX_TRADE_EGLD
    checks["trades_today"] = st.get("trades_today")
    return RiskVerdict(True, "PASS", checks)


def record_trade_result(*, loss_usd: float = 0.0, gas_egld: float = 0.0) -> None:
    st = _roll_day(_load_state())
    now = time.time()
    ts = [float(t) for t in (st.get("tx_timestamps") or []) if now - float(t) < 86400]
    ts.append(now)
    st["tx_timestamps"] = ts[-50:]
    st["trades_today"] = int(st.get("trades_today") or 0) + 1
    st["gas_spend_egld_day"] = float(st.get("gas_spend_egld_day") or 0) + float(gas_egld or 0)
    if loss_usd > 0:
        st["daily_loss_usd"] = float(st.get("daily_loss_usd") or 0) + loss_usd
        st["realized_loss_usd"] = float(st.get("realized_loss_usd") or 0) + loss_usd
    # Gas always counts toward economic pressure (convert approx at record time via loss if fail)
    if float(st["daily_loss_usd"]) >= MAX_DAILY_LOSS_USD:
        st["halt"] = True
        st["halt_reason"] = "DAILY_LOSS_HALT"
    if float(st["gas_spend_egld_day"]) >= MAX_GAS_SPEND_EGLD_DAY:
        st["halt"] = True
        st["halt_reason"] = "GAS_BUDGET_HALT"
    _save_state(st)


def emergency_halt(reason: str = "ops") -> None:
    st = _roll_day(_load_state())
    st["halt"] = True
    st["halt_reason"] = reason
    _save_state(st)
    from lia.guardian.kill_switch import get_kill_switch

    get_kill_switch().trigger(f"risk_halt:{reason}")
