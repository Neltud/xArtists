"""
Multi-capital router — paper / design-complete.

LIA produces ONE decision; this module fans it out across staked agents
with per-pack strategy filters and per-agent capital caps.

NOT wired to live execution. No PEM. No user funds movement.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any, Iterable, Optional

# Pack → strategies allowed (align apps/frontend config/agentPacks.ts)
PACK_STRATEGY_ALLOW: dict[str, set[str]] = {
    "pulse": {"MICRO_ARB", "MOMENTUM", "MEAN_REVERSION", "DEFENSE", "COMPOUND"},
    "yield": {"YIELD", "COMPOUND", "DEFENSE"},
    "sentinel": {"DEFENSE", "SOCIAL_WATCH", "ADVISOR"},
}

PACK_MAX_RISK_FRAC: dict[str, float] = {
    "pulse": 0.08,  # max fraction of agent capital per ticket
    "yield": 0.05,
    "sentinel": 0.02,
}

MIN_TICKET_USD = 5.0


@dataclass
class StakedAgent:
    agent_id: str
    pack: str  # pulse | yield | sentinel
    owner: str
    capital_usd: float
    staked: bool = True


@dataclass
class LiaDecision:
    """Single brain output."""
    strategy: str
    action: str  # BUY | SELL | HOLD | REDUCE
    confidence: float  # 0..1
    defense_active: bool = False
    venue: str = "mvx"
    meta: dict[str, Any] = field(default_factory=dict)


@dataclass
class CapitalTicket:
    agent_id: str
    pack: str
    owner: str
    strategy: str
    action: str
    size_usd: float
    venue: str
    reason: str
    ok: bool

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def _size_usd(capital: float, conf: float, pack: str) -> float:
    cap = PACK_MAX_RISK_FRAC.get(pack, 0.03)
    conf = max(0.0, min(1.0, conf))
    # linear in confidence; defense handled upstream
    return capital * cap * conf


def route_decision(
    decision: LiaDecision,
    agents: Iterable[StakedAgent],
    *,
    min_ticket_usd: float = MIN_TICKET_USD,
) -> list[CapitalTicket]:
    """
    Fan-out one LIA decision onto many agent capitals.

    Rules:
    - defense_active or action HOLD → no new risk tickets (REDUCE allowed)
    - pack must allow strategy
    - agent must be staked and capital >= min
    - size proportional to agent capital × pack risk × confidence
    """
    tickets: list[CapitalTicket] = []
    strat = decision.strategy.upper()
    action = decision.action.upper()

    for ag in agents:
        pack = ag.pack.lower()
        allow = PACK_STRATEGY_ALLOW.get(pack, set())

        if not ag.staked:
            tickets.append(
                CapitalTicket(
                    ag.agent_id, pack, ag.owner, strat, action, 0.0, decision.venue,
                    "not_staked", False,
                )
            )
            continue

        if decision.defense_active and action in ("BUY", "SELL"):
            # only reduce / flat under global defense
            if action != "REDUCE":
                tickets.append(
                    CapitalTicket(
                        ag.agent_id, pack, ag.owner, strat, "HOLD", 0.0, decision.venue,
                        "defense_blocks_new_risk", False,
                    )
                )
                continue

        if strat not in allow and action not in ("REDUCE", "HOLD"):
            tickets.append(
                CapitalTicket(
                    ag.agent_id, pack, ag.owner, strat, action, 0.0, decision.venue,
                    f"pack_{pack}_blocks_{strat}", False,
                )
            )
            continue

        if ag.capital_usd < min_ticket_usd:
            tickets.append(
                CapitalTicket(
                    ag.agent_id, pack, ag.owner, strat, action, 0.0, decision.venue,
                    "capital_below_min", False,
                )
            )
            continue

        if action in ("HOLD",):
            tickets.append(
                CapitalTicket(
                    ag.agent_id, pack, ag.owner, strat, action, 0.0, decision.venue,
                    "hold", True,
                )
            )
            continue

        size = _size_usd(ag.capital_usd, decision.confidence, pack)
        if size < min_ticket_usd and action in ("BUY", "SELL"):
            tickets.append(
                CapitalTicket(
                    ag.agent_id, pack, ag.owner, strat, action, 0.0, decision.venue,
                    "size_below_min", False,
                )
            )
            continue

        tickets.append(
            CapitalTicket(
                ag.agent_id,
                pack,
                ag.owner,
                strat,
                action,
                round(size, 4),
                decision.venue,
                "ok_paper_ticket",
                True,
            )
        )

    return tickets


def net_tickets(tickets: Iterable[CapitalTicket]) -> list[dict[str, Any]]:
    """Aggregate ok tickets by (venue, strategy, action) for gas-efficient execution."""
    buckets: dict[tuple[str, str, str], dict[str, Any]] = {}
    for t in tickets:
        if not t.ok or t.size_usd <= 0:
            continue
        key = (t.venue, t.strategy, t.action)
        b = buckets.setdefault(
            key,
            {"venue": t.venue, "strategy": t.strategy, "action": t.action, "size_usd": 0.0, "agents": []},
        )
        b["size_usd"] += t.size_usd
        b["agents"].append({"agent_id": t.agent_id, "size_usd": t.size_usd, "owner": t.owner})
    return list(buckets.values())


def demo() -> dict[str, Any]:
    decision = LiaDecision(
        strategy="MICRO_ARB",
        action="BUY",
        confidence=0.72,
        defense_active=False,
    )
    agents = [
        StakedAgent("ag_pulse_1", "pulse", "erd1user…a", 100.0),
        StakedAgent("ag_pulse_2", "pulse", "erd1user…b", 40.0),
        StakedAgent("ag_yield_1", "yield", "erd1user…c", 80.0),
        StakedAgent("ag_sent_1", "sentinel", "erd1user…d", 50.0),
        StakedAgent("ag_pulse_x", "pulse", "erd1user…e", 3.0),  # below min
    ]
    tickets = route_decision(decision, agents)
    return {
        "decision": asdict(decision),
        "tickets": [t.to_dict() for t in tickets],
        "netted": net_tickets(tickets),
        "note": "paper only — no execution",
    }


if __name__ == "__main__":
    import json

    print(json.dumps(demo(), indent=2))
