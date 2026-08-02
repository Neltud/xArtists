"""
Thin API for Vellum / compound_engine to select take-profit mode.
Does not replace fixed target in open_trade; attaches a parallel TpPlan.
"""
from __future__ import annotations

from typing import Any

from lia.circuit.take_profit_curves import (
    TpMode,
    build_tp_plan,
    validate_plan,
    simulate_path,
    compound_projection,
)


def make_plan(entry: float, gross_required: float, mode: str = "log") -> dict[str, Any]:
    m: TpMode = mode if mode in ("fixed", "exp", "log", "ladder") else "fixed"  # type: ignore
    plan = build_tp_plan(m, entry, gross_for_fixed=gross_required)
    v = validate_plan(plan)
    if not v["ok"]:
        # fallback safe
        plan = build_tp_plan("fixed", entry, gross_for_fixed=gross_required)
        v = validate_plan(plan)
    return {"plan": plan.to_dict(), "validation": v, "mode": plan.mode}


def tick_plan(plan_dict: dict[str, Any], price: float) -> dict[str, Any]:
    from lia.circuit.take_profit_curves import TpLevel, TpPlan

    levels = [TpLevel(**{**lv, "hit": bool(lv.get("hit", False))}) for lv in plan_dict.get("levels", [])]
    plan = TpPlan(
        mode=plan_dict["mode"],
        entry=float(plan_dict["entry"]),
        levels=levels,
        runner_frac=float(plan_dict.get("runner_frac", 0.0)),
        realized_frac=float(plan_dict.get("realized_frac", 0.0)),
    )
    newly = plan.on_price_long(price)
    return {
        "action": "PARTIAL_TP" if newly else "NONE",
        "newly_hit": [lv.to_dict() for lv in newly],
        "plan": plan.to_dict(),
        "realized_frac": plan.realized_frac,
        "all_levels_done": len(plan.pending()) == 0 and plan.runner_frac <= 0,
    }


def demo_validate() -> dict[str, Any]:
    out = {}
    for mode in ("fixed", "exp", "log", "ladder"):
        out[mode] = make_plan(10.0, 0.02, mode)
    out["projection"] = compound_projection(100.0, wins=50, partial_efficiency=0.75)
    out["sim_log"] = simulate_path(
        build_tp_plan("log", 10.0),
        [10.05, 10.1, 10.2, 10.35, 10.5],
    )
    return out


if __name__ == "__main__":
    import json

    print(json.dumps(demo_validate(), indent=2))
