"""
Hard digital cage — intercept every autonomous intent before broadcast.
"""
from __future__ import annotations

import json
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
STATE = ROOT / "data" / "risk_enforcer_state.json"

# Strict autonomous dust bounds (CEO session)
MAX_TRADE_EGLD = 0.005
MAX_TRADE_USD = 15.0
MAX_DAILY_LOSS_USD = 25.0
MAX_GAS = 40_000_000
MIN_RESERVE_EGLD = 0.05
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
    return {"daily_loss_usd": 0.0, "day": "", "halt": False, "trades_today": 0}


def _save_state(st: dict[str, Any]) -> None:
    STATE.parent.mkdir(parents=True, exist_ok=True)
    STATE.write_text(json.dumps(st, indent=2), encoding="utf-8")


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
    st = _load_state()
    day = time.strftime("%Y-%m-%d", time.gmtime())
    if st.get("day") != day:
        st = {"daily_loss_usd": 0.0, "day": day, "halt": False, "trades_today": 0}
        _save_state(st)

    if st.get("halt"):
        return RiskVerdict(False, "EMERGENCY_HALT", {"state": st})

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
    if tid not in {x.upper() for x in ALLOWED_TOKENS} and asset_type.upper() == "TOKEN":
        # allow EGLD native
        if tid != "EGLD":
            return RiskVerdict(False, f"token_not_allowlisted:{token_id}", checks)

    if amount_egld > MAX_TRADE_EGLD + 1e-12:
        return RiskVerdict(False, f"size_egld>{MAX_TRADE_EGLD}", checks)
    if amount_usd > MAX_TRADE_USD + 1e-9:
        return RiskVerdict(False, f"size_usd>{MAX_TRADE_USD}", checks)
    if gas_limit > MAX_GAS:
        return RiskVerdict(False, f"gas>{MAX_GAS}", checks)

    if wallet_egld is not None and wallet_egld < amount_egld + MIN_RESERVE_EGLD:
        return RiskVerdict(False, "insufficient_reserve", checks)

    if float(st.get("daily_loss_usd") or 0) >= MAX_DAILY_LOSS_USD:
        st["halt"] = True
        _save_state(st)
        return RiskVerdict(False, "DAILY_LOSS_HALT", checks)

    checks["max_trade_egld"] = MAX_TRADE_EGLD
    checks["trades_today"] = st.get("trades_today")
    return RiskVerdict(True, "PASS", checks)


def record_trade_result(*, loss_usd: float = 0.0) -> None:
    st = _load_state()
    day = time.strftime("%Y-%m-%d", time.gmtime())
    if st.get("day") != day:
        st = {"daily_loss_usd": 0.0, "day": day, "halt": False, "trades_today": 0}
    st["trades_today"] = int(st.get("trades_today") or 0) + 1
    if loss_usd > 0:
        st["daily_loss_usd"] = float(st.get("daily_loss_usd") or 0) + loss_usd
    if float(st["daily_loss_usd"]) >= MAX_DAILY_LOSS_USD:
        st["halt"] = True
    _save_state(st)


def emergency_halt(reason: str = "ops") -> None:
    st = _load_state()
    st["halt"] = True
    st["halt_reason"] = reason
    _save_state(st)
    from lia.guardian.kill_switch import get_kill_switch

    get_kill_switch().trigger(f"risk_halt:{reason}")
