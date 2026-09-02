"""Coordinator + PreFlight sizing for autonomous swarm."""
from __future__ import annotations

import os
from dataclasses import asdict, dataclass, field
from typing import Any

from lia.agents.swarm_roles import AgentProposal, BookSnapshot, MarketSnapshot

LIVE = os.getenv("LIA_LIVE_TRADING", "0") == "1"


@dataclass
class SwarmDecision:
    action: str
    token: str
    size_usd: float
    confidence: float
    lead_agent: str
    reason: str
    paper: bool = True
    live_blocked: bool = True
    preflight: dict[str, Any] = field(default_factory=dict)
    phase: str = ""
    proposals: list[dict[str, Any]] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def _preflight_size(
    action: str, token: str, size: float, book: BookSnapshot, conf: float,
) -> dict[str, Any]:
    try:
        from lia.guardian.preflight import (
            PortfolioSnapshot,
            PreFlightValidator,
            ProposedOrder,
        )

        order = ProposedOrder(
            side=action if action in ("BUY", "SELL") else "BUY",
            symbol=token,
            notional_usd=size,
            signal_confidence=conf,
            signal_edge=1.5,
            live=LIVE,
            chain="mvx",
        )
        snap = PortfolioSnapshot(
            equity_usd=book.equity_usd,
            drawdown=book.drawdown,
            consecutive_wins=book.consecutive_wins,
            consecutive_losses=book.consecutive_losses,
            realized_vol=book.realized_vol,
            compound_intensity=book.compound_intensity,
            mode="DEFENSE" if action == "VETO" else "COMPOUND",
        )
        r = PreFlightValidator().validate(order, snap)
        return {
            "allow": r.allow,
            "action": r.action,
            "notional_usd": r.notional_usd,
            "reason": r.reason,
            "kelly_f": r.kelly_f,
            "var_usd": r.var_usd,
            "kill_state": r.kill_state,
            "latency_ms": r.latency_hint_ms,
        }
    except Exception as e:
        return {"allow": False, "reason": f"preflight_unavailable:{e}", "notional_usd": 0.0}


def coordinate(
    proposals: list[AgentProposal], m: MarketSnapshot, book: BookSnapshot,
) -> SwarmDecision:
    props = sorted(proposals, key=lambda p: p.priority, reverse=True)
    prop_dicts = [p.to_dict() for p in props]

    phase = ""
    path_size = book.deployable_usd * 0.25
    try:
        from lia.circuit.million_path import phase_for, size_for_path

        phase = phase_for(book.equity_usd).value
        path_size = float(size_for_path(book.equity_usd)["notional_usd"])
    except Exception:
        phase = "UNKNOWN"

    for p in props:
        if p.action == "VETO":
            return SwarmDecision(
                "WAIT", m.token, 0.0, p.confidence, p.agent, p.reason,
                True, True, {"allow": False, "reason": "defense_veto"}, phase, prop_dicts,
            )

    for p in props:
        if p.action in ("BUY", "SELL") and p.confidence >= 0.62:
            raw_size = min(path_size, book.deployable_usd, book.equity_usd * 0.2)
            pf = _preflight_size(p.action, p.token, raw_size, book, p.confidence)
            size = float(pf.get("notional_usd") or 0) if pf.get("allow") else 0.0
            if not pf.get("allow") or size <= 0:
                continue
            return SwarmDecision(
                p.action, p.token, round(size, 4), p.confidence, p.agent, p.reason,
                not LIVE, not LIVE, pf, phase, prop_dicts,
            )

    for p in props:
        if p.action == "YIELD":
            return SwarmDecision(
                "YIELD", p.token,
                round(min(p.size_usd, book.deployable_usd * 0.25), 4),
                p.confidence, p.agent, p.reason, True, True,
                {"allow": True, "reason": "yield_no_directional"}, phase, prop_dicts,
            )

    return SwarmDecision(
        "WAIT", m.token, 0.0, 0.5, "COORDINATOR", "no consensus edge",
        True, True, {}, phase, prop_dicts,
    )


def paper_fill(decision: SwarmDecision, *, win: bool | None = None) -> dict[str, Any]:
    if decision.action not in ("BUY", "SELL") or decision.size_usd <= 0:
        return {"filled": False, "pnl_usd": 0.0, "note": decision.action}
    if win is None:
        win = decision.confidence >= 0.7
    pnl = decision.size_usd * (0.01 if win else -0.01)
    return {
        "filled": True, "paper": True, "side": decision.action,
        "size_usd": decision.size_usd, "pnl_usd": round(pnl, 6),
        "win": win, "live": False,
    }
