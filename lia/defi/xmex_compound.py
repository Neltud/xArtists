"""
xMEX / farm rewards compounding (xExchange economics).

Model (docs.xexchange.com):
  - Farms pay xMEX by default (lockable)
  - Unlock xMEX → MEX when liquid rewards preferred
  - Energy / lock boosts farm rewards (Energy DAO pattern)
  - Weekly cadence is a practical ops schedule for claim+compound

Paper-first: builds compound plans, does not broadcast.
"""
from __future__ import annotations

import json
import time
from dataclasses import asdict, dataclass, field
from typing import Any, Optional

from lia.defi.yield_risk import assess_position_risk


@dataclass
class XmexPlan:
    action: str  # claim | lock | unlock | restake_farm | skip | compound_weekly
    amount_hint: float
    ok: bool
    reason: str
    steps: list[dict[str, Any]] = field(default_factory=list)
    paper: bool = True
    next_run_sec: float = 0.0
    meta: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


WEEK_SEC = 7 * 24 * 3600


def should_run_weekly(last_ts: float, now: Optional[float] = None) -> bool:
    now = time.time() if now is None else now
    if last_ts <= 0:
        return True
    return (now - last_ts) >= WEEK_SEC * 0.95  # small slack


def compound_weekly_plan(
    *,
    pending_xmex: float = 0.0,
    pending_mex: float = 0.0,
    farm_lp_staked: bool = False,
    prefer_lock: bool = True,
    defense_active: bool = False,
    last_compound_ts: float = 0.0,
    hatom_hf: float = 999.0,
    now: Optional[float] = None,
) -> XmexPlan:
    now = time.time() if now is None else now

    if defense_active:
        return XmexPlan(
            "skip",
            0.0,
            False,
            "defense: no farm compound",
            next_run_sec=now + 3600,
        )

    if not should_run_weekly(last_compound_ts, now):
        return XmexPlan(
            "skip",
            0.0,
            False,
            "weekly window not reached",
            next_run_sec=last_compound_ts + WEEK_SEC,
            meta={"last": last_compound_ts},
        )

    steps: list[dict[str, Any]] = []
    if pending_xmex > 0 or pending_mex > 0 or farm_lp_staked:
        steps.append({"op": "claim_farm_rewards", "asset": "xMEX/MEX"})

    if prefer_lock and (pending_xmex > 0 or farm_lp_staked):
        steps.append({"op": "lock_xmex", "note": "energy boost for farms"})
        action = "compound_weekly"
        reason = "claim + lock xMEX (energy path)"
    elif pending_xmex > 0:
        steps.append({"op": "unlock_xmex_to_mex", "note": "prefer liquid MEX"})
        action = "unlock"
        reason = "claim + unlock to MEX"
    else:
        action = "skip"
        reason = "no pending rewards"
        return XmexPlan(action, 0.0, False, reason, next_run_sec=now + WEEK_SEC)

    if farm_lp_staked:
        steps.append({"op": "optional_restake_lp", "note": "keep farm position"})

    # Optional: MEX as Hatom collateral only if HF high and not defense
    mex_collateral = None
    if pending_mex > 0 and hatom_hf >= 2.0 and not prefer_lock:
        risk = assess_position_risk(kind="lend", hatom_hf=hatom_hf)
        if risk["ok"]:
            steps.append(
                {
                    "op": "hatom_supply_mex_optional",
                    "note": "MEX as collateral only if market listed + HF ok",
                    "risk": risk,
                }
            )
            mex_collateral = True

    return XmexPlan(
        action,
        float(pending_xmex + pending_mex),
        True,
        reason,
        steps=steps,
        paper=True,
        next_run_sec=now + WEEK_SEC,
        meta={"mex_as_collateral_hint": mex_collateral, "prefer_lock": prefer_lock},
    )


if __name__ == "__main__":
    print(json.dumps(compound_weekly_plan(pending_xmex=10, farm_lp_staked=True).to_dict(), indent=2))
