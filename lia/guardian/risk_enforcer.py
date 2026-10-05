"""
Digital fortress — size, NFT, velocity, cumulative drawdown, daily halt.
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

# Tier 1 Dust (scaling tiers documented in docs/SCALING_TIERS.md)
MAX_TRADE_EGLD = 0.01
MAX_TRADE_USD = 15.0
MAX_DAILY_LOSS_USD = 25.0
MAX_DRAWDOWN_PCT = 0.12  # 12% of equity session
MAX_GAS = 40_000_000
MIN_RESERVE_EGLD = 0.05
MAX_TX_PER_HOUR = 8
MAX_TX_PER_DAY = 24
MIN_SECONDS_BETWEEN_TX = 45
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
        "session_equity_usd": 100.0,
        "realized_loss_usd": 0.0,
        "day": "",
        "halt": False,
        "trades_today": 0,
        "tx_timestamps": [],
        "halt_reason": "",
    }


def _save_state(st: dict[str, Any]) -> None:
    STATE.parent.mkdir(parents=True, exist_ok=True)
    STATE.write_text(json.dumps(st, indent=2), encoding="utf-8")
    # UI mirror
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
            "session_equity_usd": float(st.get("session_equity_usd") or 100.0),
            "realized_loss_usd": 0.0,
            "day": day,
            "halt": False,
            "trades_today": 0,
            "tx_timestamps": [],
            "halt_reason": "",
        }
        _save_state(st)
    return st


def _velocity_ok(st: dict[str, Any]) -> tuple[bool, str]:
    now = time.time()
    ts = [float(t) for t in (st.get("tx_timestamps") or []) if now - float(t) < 86400]
    st["tx_timestamps"] = ts
    hour = [t for t in ts if now - t < 3600]
    if len(hour) >= MAX_TX_PER_HOUR:
        return False, f"velocity_hour>={MAX_TX_PER_HOUR}"
    if len(ts) >= MAX_TX_PER_DAY:
        return False, f"velocity_day>={MAX_TX_PER_DAY}"
    if ts and (now - max(ts)) < MIN_SECONDS_BETWEEN_TX:
        return False, f"velocity_spacing<{MIN_SECONDS_BETWEEN_TX}s"
    return True, "ok"


def enforce(
    *,
    asset_type: str = "TOKEN",
    token_id: str = "EGLD",
    amount_egld: float = 0.0,
    amount_usd: float = 0.0,
    gas_limit: int = 0,
    wallet_egld: float | None = None,
) -> RiskVerdict:
    checks: dict[str, Any] = {}
    st = _roll_day(_load_state())

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
    if tid not in {x.upper() for x in ALLOWED_TOKENS} and tid != "EGLD":
        return RiskVerdict(False, f"token_not_allowlisted:{token_id}", checks)

    if amount_egld > MAX_TRADE_EGLD + 1e-12:
        return RiskVerdict(False, f"size_egld>{MAX_TRADE_EGLD}", checks)
    if amount_usd > MAX_TRADE_USD + 1e-9:
        return RiskVerdict(False, f"size_usd>{MAX_TRADE_USD}", checks)
    if gas_limit > MAX_GAS:
        return RiskVerdict(False, f"gas>{MAX_GAS}", checks)

    if wallet_egld is not None and wallet_egld < amount_egld + MIN_RESERVE_EGLD:
        return RiskVerdict(False, "insufficient_reserve", checks)

    vok, vreason = _velocity_ok(st)
    checks["velocity"] = vreason
    if not vok:
        return RiskVerdict(False, vreason, checks)

    equity = float(st.get("session_equity_usd") or 100.0)
    realized = float(st.get("realized_loss_usd") or 0.0)
    daily = float(st.get("daily_loss_usd") or 0.0)
    dd = (realized / equity) if equity > 0 else 0.0
    checks["drawdown_pct"] = round(dd, 4)
    checks["daily_loss_usd"] = daily

    if daily >= MAX_DAILY_LOSS_USD:
        st["halt"] = True
        st["halt_reason"] = "DAILY_LOSS"
        _save_state(st)
        _disable_autonomous()
        return RiskVerdict(False, "DAILY_LOSS_HALT", checks)

    if dd >= MAX_DRAWDOWN_PCT:
        st["halt"] = True
        st["halt_reason"] = "CUMULATIVE_DRAWDOWN"
        _save_state(st)
        _disable_autonomous()
        return RiskVerdict(False, "DRAWDOWN_HALT", checks)

    checks["max_trade_egld"] = MAX_TRADE_EGLD
    checks["trades_today"] = st.get("trades_today")
    return RiskVerdict(True, "PASS", checks)


def _disable_autonomous() -> None:
    os.environ["LIA_AUTONOMOUS_DUST"] = "0"
    try:
        from lia.guardian.kill_switch import get_kill_switch

        get_kill_switch().trigger("risk_drawdown_or_daily_loss")
    except Exception:
        pass


def record_trade_result(*, loss_usd: float = 0.0, equity_usd: float | None = None) -> None:
    st = _roll_day(_load_state())
    st["trades_today"] = int(st.get("trades_today") or 0) + 1
    ts = list(st.get("tx_timestamps") or [])
    ts.append(time.time())
    st["tx_timestamps"] = ts[-100:]
    if equity_usd is not None:
        st["session_equity_usd"] = float(equity_usd)
    if loss_usd > 0:
        st["daily_loss_usd"] = float(st.get("daily_loss_usd") or 0) + loss_usd
        st["realized_loss_usd"] = float(st.get("realized_loss_usd") or 0) + loss_usd
    equity = float(st.get("session_equity_usd") or 100.0)
    if float(st["daily_loss_usd"]) >= MAX_DAILY_LOSS_USD:
        st["halt"] = True
        st["halt_reason"] = "DAILY_LOSS"
        _disable_autonomous()
    elif equity > 0 and float(st.get("realized_loss_usd") or 0) / equity >= MAX_DRAWDOWN_PCT:
        st["halt"] = True
        st["halt_reason"] = "CUMULATIVE_DRAWDOWN"
        _disable_autonomous()
    _save_state(st)


def emergency_halt(reason: str = "ops") -> None:
    st = _roll_day(_load_state())
    st["halt"] = True
    st["halt_reason"] = reason
    _save_state(st)
    _disable_autonomous()
