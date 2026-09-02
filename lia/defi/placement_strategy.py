"""
Strategic process: choose best placement given mode + risk + catalog.

Priority (capital efficiency vs risk for LIA paper):
  1. DEFENSE → USDC lend or idle
  2. Claim / weekly xMEX if due
  3. Hatom supply (stable > EGLD)
  4. Arb (no LP) if edge
  5. LP+farm only if IL gate + not defense
  6. Soul experimental last / optional
"""
from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any, Optional

from lia.defi.hatom_routes import HatomAction, HatomRouter
from lia.defi.placement_catalog import CATALOG, best_tools_matrix, list_placements
from lia.defi.soul_routes import SoulRouter
from lia.defi.xmex_compound import compound_weekly_plan
from lia.defi.yield_risk import assess_position_risk

_ROOT = Path(__file__).resolve().parents[2]


def strategic_process(
    *,
    yield_sleeve_usd: float = 0.0,
    hatom_hf: float = 999.0,
    defense_active: bool = False,
    arb_edge_ok: bool = False,
    pending_xmex: float = 0.0,
    farm_lp_staked: bool = False,
    last_xmex_ts: float = 0.0,
    prefer_lock_xmex: bool = True,
    allow_lp_farm: bool = False,
    allow_soul: bool = False,
    expected_lp_move_pct: float = 0.1,
    persist: bool = True,
) -> dict[str, Any]:
    tools = best_tools_matrix()
    decisions: list[dict[str, Any]] = []

    # 1 Defense
    if defense_active:
        decisions.append(
            {
                "priority": 1,
                "choice": "hatom_mm_usdc_or_idle",
                "reason": "DEFENSE",
                "tools": tools["defense"],
            }
        )
        report = _finish(decisions, tools, yield_sleeve_usd, defense_active, persist)
        return report

    # 2 Weekly xMEX
    xmex = compound_weekly_plan(
        pending_xmex=pending_xmex,
        farm_lp_staked=farm_lp_staked,
        prefer_lock=prefer_lock_xmex,
        defense_active=False,
        last_compound_ts=last_xmex_ts,
        hatom_hf=hatom_hf,
    )
    if xmex.ok:
        decisions.append(
            {
                "priority": 2,
                "choice": "xmex_weekly_compound",
                "plan": xmex.to_dict(),
                "tools": tools["weekly_rewards"],
            }
        )

    # 3 Hatom lend
    if yield_sleeve_usd >= 5 and hatom_hf >= 1.8:
        h = HatomRouter().auto_route(
            yield_sleeve_usd=yield_sleeve_usd,
            hatom_hf=hatom_hf,
            prefer_loop=False,
        )
        if h.ok:
            decisions.append(
                {
                    "priority": 3,
                    "choice": "hatom_supply",
                    "plan": h.to_dict(),
                    "tools": tools["lend_stable"],
                }
            )

    # 4 Arb (no capital lock in LP)
    if arb_edge_ok:
        decisions.append(
            {
                "priority": 4,
                "choice": "micro_arb",
                "tools": tools["arb"],
                "note": "xEx vs OneDex vs Ash — block-time",
            }
        )

    # 5 LP + farm (IL gated)
    if allow_lp_farm and yield_sleeve_usd >= 20:
        il = assess_position_risk(
            kind="lp",
            price_move_expected_pct=expected_lp_move_pct,
            sleeve_usd=yield_sleeve_usd * 0.25,
        )
        if il["ok"]:
            decisions.append(
                {
                    "priority": 5,
                    "choice": "xex_lp_farm",
                    "il": il,
                    "tools": tools["lp_farm_xmex"],
                    "follow_up": "xmex weekly lock",
                }
            )

    # 6 Soul experimental
    if allow_soul and yield_sleeve_usd >= 10:
        s = SoulRouter().auto_route(amount_usd=yield_sleeve_usd * 0.2, health_factor=hatom_hf)
        if s.ok:
            decisions.append(
                {
                    "priority": 6,
                    "choice": "soul_experimental",
                    "plan": s.to_dict(),
                }
            )

    if not decisions:
        decisions.append({"priority": 99, "choice": "stable_idle", "reason": "no edge"})

    return _finish(decisions, tools, yield_sleeve_usd, defense_active, persist)


def _finish(decisions, tools, sleeve, defense, persist: bool) -> dict[str, Any]:
    report = {
        "timestamp": time.time(),
        "yield_sleeve_usd": sleeve,
        "defense_active": defense,
        "primary": decisions[0] if decisions else None,
        "pipeline": decisions,
        "catalog_size": len(CATALOG),
        "placements_low_med": list_placements(max_risk="medium"),
        "tools_matrix": tools,
        "paper": True,
        "LIA_note": "No broadcast; MICRO_PROOF + contracts before live",
    }
    if persist:
        path = _ROOT / "data" / "lia_placement_strategy.json"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return report


if __name__ == "__main__":
    print(json.dumps(strategic_process(yield_sleeve_usd=30, hatom_hf=3.0, pending_xmex=5), indent=2)[:2500])
