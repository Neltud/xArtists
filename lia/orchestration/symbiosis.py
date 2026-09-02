"""
Strategy Symbiosis Orchestrator
===============================
Plusieurs cerveaux / stratégies DeFi tournent en parallèle (TP1, TP3, TP5,
LIABrain, Contrarian, Yield, Risk, circuit +1%, STATARB, JUPITER_ARB).

Priorité (haute → basse):
  1. Risk BLOCK / DELEVERAGE
  2. Exits (SL / TP / SELL force)
  3. Multi-horizon veto / RISK_OFF → YIELD
  4. Ranked entries by confidence × edge, budget normalisé
  5. Yield idle USDC
"""
from __future__ import annotations

import json
import time
from dataclasses import asdict, dataclass, field
from typing import Any, Optional


STRATEGY_REGISTRY: dict[str, dict[str, Any]] = {
    "TP1": {
        "role": "scalp",
        "tp_pct": 1.0,
        "sl_pct": 1.0,
        "default_budget_pct": 0.14,
        "max_budget_pct": 0.22,
        "horizon": "ST",
    },
    "TP3": {
        "role": "swing_short",
        "tp_pct": 3.0,
        "sl_pct": 1.5,
        "default_budget_pct": 0.14,
        "max_budget_pct": 0.22,
        "horizon": "ST",
    },
    "TP5": {
        "role": "swing_mid",
        "tp_pct": 5.0,
        "sl_pct": 2.5,
        "default_budget_pct": 0.10,
        "max_budget_pct": 0.18,
        "horizon": "MT",
    },
    "LIABrain": {
        "role": "core_macro",
        "tp_pct": 15.0,
        "sl_pct": 8.0,
        "default_budget_pct": 0.18,
        "max_budget_pct": 0.30,
        "horizon": "LT",
        "tokens": ["WBTC", "WEGLD", "USDC"],
    },
    "Contrarian": {
        "role": "hedge",
        "tp_pct": 0.5,
        "sl_pct": 1.0,
        "default_budget_pct": 0.04,
        "max_budget_pct": 0.06,
        "horizon": "ST",
    },
    "CIRCUIT_1PCT": {
        "role": "compound_loop",
        "tp_pct": 1.0,
        "sl_pct": 0.9,
        "default_budget_pct": 0.10,
        "max_budget_pct": 0.15,
        "horizon": "ST",
        "max_positions": 1,
    },
    "STATARB": {
        "role": "pairs_mean_reversion",
        "tp_pct": 1.0,
        "sl_pct": 0.9,
        "default_budget_pct": 0.12,
        "max_budget_pct": 0.20,
        "horizon": "ST",
        "priority_boost": 1.05,
    },
    "JUPITER_ARB": {
        "role": "latency_micro_arb",
        "tp_pct": 0.3,
        "sl_pct": 0.2,
        "default_budget_pct": 0.05,
        "max_budget_pct": 0.08,
        "horizon": "ST",
        "venue": "jupiter",
    },
    "YieldAgent": {
        "role": "idle_yield",
        "tp_pct": 0.0,
        "sl_pct": 0.0,
        "default_budget_pct": 0.40,
        "max_budget_pct": 0.50,
        "horizon": "LT",
    },
    "RiskAgent": {
        "role": "veto",
        "tp_pct": 0.0,
        "sl_pct": 0.0,
        "default_budget_pct": 0.0,
        "max_budget_pct": 0.0,
        "horizon": "ALL",
    },
}

GLOBAL_ENTRY_BUDGET_CAP = 0.85


@dataclass
class StrategyVote:
    strategy: str
    decision: str
    confidence: float
    token: str = ""
    amount_usd: float = 0.0
    budget_pct: float = 0.0
    reason: str = ""
    actions: list[dict[str, Any]] = field(default_factory=list)
    meta: dict[str, Any] = field(default_factory=dict)

    def conf01(self) -> float:
        c = float(self.confidence)
        return c / 100.0 if c > 1.0 else c


@dataclass
class SymbiosisResult:
    mode: str
    approved_actions: list[dict[str, Any]]
    rejected: list[dict[str, Any]]
    budget_map: dict[str, float]
    total_budget_pct: float
    conflicts_resolved: list[str]
    risk_status: str
    notes: list[str]
    ts: str = ""

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def _norm_decision(d: str) -> str:
    d = (d or "WAIT").upper()
    if d in ("STRONG_BUY", "ACCUMULATE"):
        return "BUY"
    if d in ("EXIT", "TAKE_PROFIT", "STOP_LOSS"):
        return "SELL"
    if d in ("PASS",):
        return "WAIT"
    return d


def _token_key(token: str) -> str:
    t = (token or "").upper()
    if not t:
        return ""
    return t.split("-")[0]


def fuse_votes(
    votes: list[StrategyVote],
    *,
    deployable_usd: float,
    gs_regime: str = "NEUTRAL",
    max_entry_budget_pct: float = GLOBAL_ENTRY_BUDGET_CAP,
) -> SymbiosisResult:
    notes: list[str] = []
    conflicts: list[str] = []
    rejected: list[dict[str, Any]] = []
    approved: list[dict[str, Any]] = []
    budget_map: dict[str, float] = {}

    if not votes:
        return SymbiosisResult(
            mode="YIELD_ONLY",
            approved_actions=[],
            rejected=[],
            budget_map={},
            total_budget_pct=0.0,
            conflicts_resolved=[],
            risk_status="NO_VOTES",
            notes=["empty votes"],
            ts=_now(),
        )

    risk_votes = [
        v
        for v in votes
        if v.strategy in ("RiskAgent", "RISK") or v.decision.upper() in ("BLOCK", "DELEVERAGE")
    ]
    for rv in risk_votes:
        dec = _norm_decision(rv.decision)
        if dec == "BLOCK":
            notes.append(f"Risk BLOCK: {rv.reason}")
            return SymbiosisResult(
                mode="BLOCKED",
                approved_actions=list(rv.actions) if rv.actions else [{"type": "HALT", "reason": rv.reason}],
                rejected=[
                    {"strategy": v.strategy, "decision": v.decision, "reason": "risk_block"}
                    for v in votes
                    if v is not rv
                ],
                budget_map={},
                total_budget_pct=0.0,
                conflicts_resolved=["all_entries_suppressed_by_risk"],
                risk_status="BLOCK",
                notes=notes,
                ts=_now(),
            )
        if dec == "DELEVERAGE":
            for a in rv.actions or [{"type": "DELEVERAGE", "reason": rv.reason}]:
                approved.append({**a, "strategy": rv.strategy, "priority": 0})
            notes.append(f"Risk DELEVERAGE: {rv.reason}")

    if str(gs_regime).upper() == "RISK_OFF":
        notes.append("GS RISK_OFF → suppress new BUY entries")

    sells = [v for v in votes if _norm_decision(v.decision) == "SELL"]
    for v in sells:
        approved.append(
            {
                "type": "SELL",
                "token": v.token,
                "amount_usd": v.amount_usd,
                "strategy": v.strategy,
                "confidence": v.conf01(),
                "reason": v.reason,
                "priority": 1,
                "venue": (STRATEGY_REGISTRY.get(v.strategy) or {}).get("venue", "auto"),
            }
        )
        budget_map[v.strategy] = budget_map.get(v.strategy, 0.0)

    sell_tokens = {_token_key(v.token) for v in sells if v.token}

    buys = [v for v in votes if _norm_decision(v.decision) == "BUY"]
    if str(gs_regime).upper() == "RISK_OFF":
        for v in buys:
            rejected.append(
                {
                    "strategy": v.strategy,
                    "decision": "BUY",
                    "reason": "RISK_OFF_suppressed",
                    "token": v.token,
                }
            )
        buys = []

    filtered_buys: list[StrategyVote] = []
    for v in buys:
        tk = _token_key(v.token)
        if tk and tk in sell_tokens:
            conflicts.append(f"{v.strategy} BUY {tk} vs SELL — keep SELL")
            rejected.append(
                {
                    "strategy": v.strategy,
                    "decision": "BUY",
                    "reason": "conflict_sell_priority",
                    "token": v.token,
                }
            )
        else:
            filtered_buys.append(v)

    def _rank(v: StrategyVote) -> float:
        boost = float((STRATEGY_REGISTRY.get(v.strategy) or {}).get("priority_boost") or 1.0)
        # STATARB / JUPITER_ARB slight preference at equal conf
        extra = 0.02 if v.strategy in ("STATARB", "JUPITER_ARB") else 0.0
        return v.conf01() * boost + extra

    filtered_buys.sort(key=_rank, reverse=True)
    remaining_cap = max_entry_budget_pct

    for v in filtered_buys:
        reg = STRATEGY_REGISTRY.get(v.strategy, {})
        max_pct = float(reg.get("max_budget_pct", 0.15))
        default_pct = float(reg.get("default_budget_pct", 0.10))
        requested = v.budget_pct if v.budget_pct > 0 else default_pct
        requested = min(requested, max_pct)

        if remaining_cap <= 0.01:
            rejected.append(
                {
                    "strategy": v.strategy,
                    "decision": "BUY",
                    "reason": "budget_cap_exhausted",
                    "token": v.token,
                }
            )
            conflicts.append(f"{v.strategy} dropped — global budget cap")
            continue

        alloc = min(requested, remaining_cap)
        remaining_cap -= alloc
        budget_map[v.strategy] = alloc
        amount = v.amount_usd if v.amount_usd > 0 else round(deployable_usd * alloc, 4)

        if v.strategy in ("CIRCUIT_1PCT", "STATARB"):
            existing = [
                a
                for a in approved
                if a.get("strategy") in ("CIRCUIT_1PCT", "STATARB") and a.get("type") == "BUY"
            ]
            if existing and v.strategy == "CIRCUIT_1PCT":
                rejected.append(
                    {
                        "strategy": v.strategy,
                        "decision": "BUY",
                        "reason": "circuit_max_1_position",
                        "token": v.token,
                    }
                )
                continue

        approved.append(
            {
                "type": "BUY",
                "token": v.token,
                "amount_usd": amount,
                "budget_pct": round(alloc, 4),
                "strategy": v.strategy,
                "confidence": v.conf01(),
                "reason": v.reason,
                "priority": 2,
                "sl_pct": reg.get("sl_pct"),
                "tp_pct": reg.get("tp_pct"),
                "venue": reg.get("venue", "auto"),
            }
        )

    yields = [v for v in votes if _norm_decision(v.decision) == "YIELD"]
    entry_buys = [a for a in approved if a.get("type") == "BUY"]
    if yields and (not entry_buys or str(gs_regime).upper() == "RISK_OFF"):
        for v in yields:
            for a in v.actions or [
                {
                    "type": "HATOM_SUPPLY",
                    "amount_usd": v.amount_usd or deployable_usd * 0.3,
                    "reason": v.reason,
                }
            ]:
                approved.append({**a, "strategy": v.strategy, "priority": 3})
            budget_map[v.strategy] = budget_map.get(v.strategy, 0.0) + float(
                STRATEGY_REGISTRY.get("YieldAgent", {}).get("default_budget_pct", 0.3)
            )

    total_pct = round(sum(budget_map.values()), 4)
    if total_pct > max_entry_budget_pct + 0.001:
        notes.append(f"AUDIT WARN: total_budget_pct={total_pct} > cap={max_entry_budget_pct}")

    if any(a.get("type") in ("HALT", "DELEVERAGE") for a in approved) and not entry_buys:
        mode = "BLOCKED" if any(a.get("type") == "HALT" for a in approved) else "MIXED"
    elif entry_buys:
        mode = "TRADE"
    elif any(a.get("type") in ("HATOM_SUPPLY", "YIELD", "PARK_STABLE") for a in approved):
        mode = "YIELD_ONLY"
    elif sells:
        mode = "MIXED"
    else:
        mode = "YIELD_ONLY"

    risk_status = "OK"
    for rv in risk_votes:
        if _norm_decision(rv.decision) == "DELEVERAGE":
            risk_status = "DELEVERAGE"

    approved.sort(key=lambda a: int(a.get("priority", 9)))

    return SymbiosisResult(
        mode=mode,
        approved_actions=approved,
        rejected=rejected,
        budget_map={k: round(v, 4) for k, v in budget_map.items()},
        total_budget_pct=min(total_pct, max_entry_budget_pct),
        conflicts_resolved=conflicts,
        risk_status=risk_status,
        notes=notes,
        ts=_now(),
    )


def audit_registry_budgets() -> dict[str, Any]:
    entry_keys = ("TP1", "TP3", "TP5", "LIABrain", "Contrarian", "CIRCUIT_1PCT", "STATARB", "JUPITER_ARB")
    new_defaults = sum(float(STRATEGY_REGISTRY[k]["default_budget_pct"]) for k in entry_keys if k in STRATEGY_REGISTRY)
    return {
        "new_default_sum": round(new_defaults, 4),
        "new_default_ok": new_defaults <= GLOBAL_ENTRY_BUDGET_CAP + 0.15,  # yield separate
        "global_cap": GLOBAL_ENTRY_BUDGET_CAP,
        "registry": STRATEGY_REGISTRY,
    }


def votes_from_brain_outputs(outputs: list[dict[str, Any]]) -> list[StrategyVote]:
    votes: list[StrategyVote] = []
    for o in outputs:
        name = str(o.get("strategy") or o.get("agent") or o.get("name") or "UNKNOWN")
        nu = name.upper()
        if "STATARB" in nu:
            name = "STATARB"
        elif "JUPITER" in nu or "JUP_ARB" in nu:
            name = "JUPITER_ARB"
        elif "TP1" in nu:
            name = "TP1"
        elif "TP3" in nu:
            name = "TP3"
        elif "TP5" in nu:
            name = "TP5"
        elif "CONTRARIAN" in nu:
            name = "Contrarian"
        elif "RISK" in nu:
            name = "RiskAgent"
        elif "YIELD" in nu:
            name = "YieldAgent"
        elif "CIRCUIT" in nu or "COMPOUND" in nu:
            name = "CIRCUIT_1PCT"
        elif "LIA" in nu:
            name = "LIABrain"

        decision = str(o.get("decision") or "WAIT")
        conf = float(o.get("confidence") or 0)
        actions = list(o.get("actions") or [])
        token = str(o.get("best_token") or o.get("token") or "")
        if not token and actions:
            token = str(actions[0].get("token_id") or actions[0].get("token") or "")
        amount = float(o.get("allocated_budget_usd") or o.get("amount_usd") or 0)
        if not amount and actions:
            amount = float(actions[0].get("amount_usd") or 0)
        budget_pct = float(o.get("budget_allocation_pct") or 0)
        if budget_pct > 1:
            budget_pct = budget_pct / 100.0

        votes.append(
            StrategyVote(
                strategy=name,
                decision=decision,
                confidence=conf,
                token=token,
                amount_usd=amount,
                budget_pct=budget_pct,
                reason=str(o.get("reasoning") or o.get("reason") or ""),
                actions=actions,
                meta=o,
            )
        )
    return votes


def _now() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


if __name__ == "__main__":
    print(json.dumps(audit_registry_budgets(), indent=2)[:2500])
