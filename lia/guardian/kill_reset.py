"""
Kill-Switch reset circuit — ops-controlled, never auto on live.

TRIPPED/KILLED → request_reset → PENDING → confirm_reset → ARMED
Hard kills require post_mortem_ref + longer cooldown.
LIVE requires KILL_RESET_ACK=1. Optional KILL_RESET_TOKEN.
Audit: data/guardian_kill_log.json
"""
from __future__ import annotations

import json
import os
import time
from dataclasses import asdict, dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List

HARD_REASONS = frozenset({"DRAWDOWN", "EQUITY_FLOOR", "DEATH_SPIRAL", "MANUAL"})

COOLDOWN_SOFT_SEC = float(os.getenv("KILL_RESET_COOLDOWN_SOFT", "60"))
COOLDOWN_HARD_SEC = float(os.getenv("KILL_RESET_COOLDOWN_HARD", "300"))
RESET_TOKEN = os.getenv("KILL_RESET_TOKEN", "")
LIVE = os.getenv("LIA_LIVE_TRADING", "0") == "1"
LIVE_ACK = os.getenv("KILL_RESET_ACK", "0") == "1"

ROOT = Path(__file__).resolve().parents[2]
LOG_PATH = Path(os.getenv("KILL_RESET_LOG", str(ROOT / "data" / "guardian_kill_log.json")))


class ResetPhase(str, Enum):
    NONE = "NONE"
    PENDING = "PENDING"


@dataclass
class ResetRequest:
    phase: ResetPhase = ResetPhase.NONE
    requested_at: float = 0.0
    requested_by: str = ""
    note: str = ""
    post_mortem_ref: str = ""


@dataclass
class ResetResult:
    ok: bool
    action: str
    detail: str
    state_before: str = ""
    state_after: str = ""
    ts: float = field(default_factory=time.time)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


def _append_log(entry: Dict[str, Any]) -> None:
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    items: List[Dict[str, Any]] = []
    if LOG_PATH.exists():
        try:
            items = json.loads(LOG_PATH.read_text()).get("events", [])
        except Exception:
            items = []
    items.append(entry)
    payload = {
        "updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "events": items[-500:],
    }
    LOG_PATH.write_text(json.dumps(payload, indent=2))


class KillResetCircuit:
    def __init__(self) -> None:
        self.request = ResetRequest()

    def cooldown_remaining(self, reason: str, tripped_at: float) -> float:
        hard = reason in HARD_REASONS
        need = COOLDOWN_HARD_SEC if hard else COOLDOWN_SOFT_SEC
        if tripped_at <= 0:
            return need
        elapsed = time.time() - tripped_at
        return max(0.0, need - elapsed)

    def request_reset(
        self,
        *,
        operator_id: str,
        state: str,
        reason: str,
        tripped_at: float,
        note: str = "",
    ) -> ResetResult:
        if state == "ARMED":
            return ResetResult(False, "noop", "already ARMED", state, state)
        if not operator_id or not operator_id.strip():
            return ResetResult(False, "reject", "operator_id required", state, state)
        remaining = self.cooldown_remaining(reason, tripped_at)
        if remaining > 0:
            return ResetResult(
                False, "cooldown", f"wait {remaining:.0f}s (reason={reason})", state, state
            )
        self.request = ResetRequest(
            phase=ResetPhase.PENDING,
            requested_at=time.time(),
            requested_by=operator_id.strip(),
            note=note or "",
        )
        _append_log(
            {
                "event": "request_reset",
                "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "operator": operator_id,
                "state": state,
                "reason": reason,
                "note": note,
            }
        )
        return ResetResult(True, "pending", "reset pending confirmation", state, state)

    def confirm_reset(
        self,
        *,
        operator_id: str,
        state: str,
        reason: str,
        tripped_at: float,
        post_mortem_ref: str = "",
        token: str = "",
    ) -> ResetResult:
        if state == "ARMED":
            return ResetResult(False, "noop", "already ARMED", state, state)
        if not operator_id or not operator_id.strip():
            return ResetResult(False, "reject", "operator_id required", state, state)
        if LIVE and not LIVE_ACK:
            r = ResetResult(
                False,
                "live_block",
                "LIA_LIVE_TRADING=1 requires KILL_RESET_ACK=1 for reset",
                state,
                state,
            )
            _append_log({**r.to_dict(), "event": "confirm_reset_denied", "operator": operator_id})
            return r
        if RESET_TOKEN and token != RESET_TOKEN:
            r = ResetResult(False, "reject", "invalid or missing KILL_RESET_TOKEN", state, state)
            _append_log({**r.to_dict(), "event": "confirm_reset_denied", "operator": operator_id})
            return r
        remaining = self.cooldown_remaining(reason, tripped_at)
        if remaining > 0:
            return ResetResult(False, "cooldown", f"wait {remaining:.0f}s", state, state)

        hard = reason in HARD_REASONS or state == "KILLED"
        if hard:
            if self.request.phase != ResetPhase.PENDING:
                return ResetResult(
                    False, "need_request", "hard kill requires request_reset first", state, state
                )
            if self.request.requested_by != operator_id.strip() and not post_mortem_ref:
                return ResetResult(
                    False,
                    "reject",
                    "confirmer != requester requires post_mortem_ref",
                    state,
                    state,
                )
            if not (post_mortem_ref or self.request.post_mortem_ref or self.request.note):
                return ResetResult(
                    False, "reject", "hard kill requires post_mortem_ref or note", state, state
                )
            self.request.post_mortem_ref = post_mortem_ref or self.request.post_mortem_ref

        if not hard and self.request.phase == ResetPhase.NONE:
            self.request = ResetRequest(
                phase=ResetPhase.PENDING,
                requested_at=time.time(),
                requested_by=operator_id.strip(),
            )

        _append_log(
            {
                "event": "confirm_reset",
                "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "operator": operator_id,
                "state_before": state,
                "reason": reason,
                "post_mortem_ref": post_mortem_ref or self.request.post_mortem_ref,
                "live": LIVE,
            }
        )
        self.request = ResetRequest()
        return ResetResult(True, "reset", "authorized → ARMED", state, "ARMED")

    def cancel_pending(self, operator_id: str = "ops") -> ResetResult:
        self.request = ResetRequest()
        _append_log(
            {
                "event": "cancel_pending",
                "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "operator": operator_id,
            }
        )
        return ResetResult(True, "cancelled", "pending cleared")


def apply_reset_to_kill_switch(kill: Any, result: ResetResult) -> bool:
    from typing import Any  # local for type hint without cycle

    if result.ok and result.action == "reset":
        kill.reset()
        return True
    return False
