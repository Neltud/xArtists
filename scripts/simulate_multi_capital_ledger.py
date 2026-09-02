#!/usr/bin/env python3
"""
P1 — Paper multi-capital simulation (no real money).
1 LIA signal → filter by pack → ticket sizes → simulated ledger JSON.
Auditable math for external review.
"""
from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from lia.agents.multi_capital_router import (  # noqa: E402
    LiaDecision,
    StakedAgent,
    net_tickets,
    route_decision,
)

OUT = ROOT / "data" / "simulated_ledger.json"

# Fixed virtual packs (deterministic for auditors)
AGENTS = [
    StakedAgent("ag_pulse_alice", "pulse", "erd1…alice", 100.0),
    StakedAgent("ag_pulse_bob", "pulse", "erd1…bob", 40.0),
    StakedAgent("ag_yield_carol", "yield", "erd1…carol", 80.0),
    StakedAgent("ag_sent_dave", "sentinel", "erd1…dave", 50.0),
    StakedAgent("ag_pulse_dust", "pulse", "erd1…dust", 3.0),
]


def run_once(decision: LiaDecision, agents: list[StakedAgent], pnl_bps: int = 50) -> dict:
    """pnl_bps: simulated mark-to-market on ticket notional (paper)."""
    tickets = route_decision(decision, agents)
    netted = net_tickets(tickets)
    ledger_rows = []
    for t in tickets:
        # Paper PnL only on ok risk-taking tickets
        pnl = 0.0
        if t.ok and t.size_usd > 0 and t.action in ("BUY", "SELL"):
            sign = 1.0 if t.action == "BUY" else -1.0
            pnl = round(sign * t.size_usd * (pnl_bps / 10_000), 6)
        ledger_rows.append(
            {
                **t.to_dict(),
                "pnl_usd_paper": pnl,
                "capital_after_paper": round(
                    next(a.capital_usd for a in agents if a.agent_id == t.agent_id) + pnl,
                    6,
                ),
            }
        )
    return {
        "decision": {
            "strategy": decision.strategy,
            "action": decision.action,
            "confidence": decision.confidence,
            "defense_active": decision.defense_active,
            "venue": decision.venue,
        },
        "tickets": [t.to_dict() for t in tickets],
        "netted_execution": netted,
        "ledger": ledger_rows,
        "totals": {
            "tickets_ok": sum(1 for t in tickets if t.ok and t.size_usd > 0),
            "notional_usd": round(sum(t.size_usd for t in tickets if t.ok), 4),
            "pnl_usd_paper": round(sum(r["pnl_usd_paper"] for r in ledger_rows), 6),
        },
    }


def main() -> int:
    # Scenario A: MICRO_ARB BUY — Pulse only
    d1 = LiaDecision("MICRO_ARB", "BUY", 0.72, defense_active=False)
    # Scenario B: YIELD — Yield pack
    d2 = LiaDecision("YIELD", "BUY", 0.65, defense_active=False)
    # Scenario C: DEFENSE blocks new risk
    d3 = LiaDecision("MICRO_ARB", "BUY", 0.9, defense_active=True)

    payload = {
        "version": 1,
        "mode": "paper",
        "no_real_money": True,
        "updated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "agents_input": [
            {"agent_id": a.agent_id, "pack": a.pack, "capital_usd": a.capital_usd, "staked": a.staked}
            for a in AGENTS
        ],
        "math_notes": {
            "size_usd": "capital * PACK_MAX_RISK_FRAC[pack] * confidence",
            "pulse_frac": 0.08,
            "yield_frac": 0.05,
            "sentinel_frac": 0.02,
            "min_ticket_usd": 5.0,
            "pnl_paper": "ticket * pnl_bps/10000 (demo +50 bps on BUY)",
        },
        "scenarios": {
            "A_micro_arb": run_once(d1, AGENTS, pnl_bps=50),
            "B_yield": run_once(d2, AGENTS, pnl_bps=30),
            "C_defense": run_once(d3, AGENTS, pnl_bps=0),
        },
        "auditor": "Recompute size_usd from math_notes; compare tickets.ok filters by pack.",
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"wrote": str(OUT), "scenarios": list(payload["scenarios"].keys()),
                      "A_totals": payload["scenarios"]["A_micro_arb"]["totals"]},
                     indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
