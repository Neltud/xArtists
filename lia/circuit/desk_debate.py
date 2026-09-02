"""
Desk debate — multi-role signal (TradingAgents-inspired), optimized.

Roles (paper, no PEM):
  technical, mean_reversion, sentiment, micro_arb,
  bull/bear researchers, risk_officer (veto).

Does NOT replace Guardian or TradingStack.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any, Optional

# Role weights for net score (sum ~1 for directional sleeve)
_WEIGHTS = {
    "technical": 0.28,
    "mean_reversion": 0.18,
    "sentiment": 0.22,
    "micro_arb": 0.17,
    "bull_researcher": 0.08,
    "bear_researcher": 0.07,
}


@dataclass
class RoleView:
    role: str
    stance: str  # BULL | BEAR | NEUTRAL | VETO
    score: float  # -1 .. +1
    note: str = ""


@dataclass
class DeskVerdict:
    action: str  # BUY | SELL | HOLD | YIELD
    confidence: float  # 0..1
    net_score: float
    risk_veto: bool
    agreement: float = 0.0  # 0..1 how aligned non-risk roles are
    roles: list[RoleView] = field(default_factory=list)
    rationale: str = ""

    def to_dict(self) -> dict[str, Any]:
        return {
            "action": self.action,
            "confidence": round(self.confidence, 4),
            "net_score": round(self.net_score, 4),
            "risk_veto": self.risk_veto,
            "agreement": round(self.agreement, 4),
            "roles": [asdict(r) for r in self.roles],
            "rationale": self.rationale,
            "paper": True,
            "source": "lia.circuit.desk_debate",
        }


def _clamp(x: float, lo: float = -1.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, x))


def _stance(score: float, bull: float = 0.15, bear: float = -0.15) -> str:
    if score > bull:
        return "BULL"
    if score < bear:
        return "BEAR"
    return "NEUTRAL"


def _agreement(roles: list[RoleView]) -> float:
    """Fraction of non-risk roles sharing the majority sign of score."""
    scored = [r for r in roles if r.role != "risk_officer" and abs(r.score) > 0.05]
    if not scored:
        return 0.5
    pos = sum(1 for r in scored if r.score > 0)
    neg = sum(1 for r in scored if r.score < 0)
    maj = max(pos, neg)
    return maj / len(scored)


def debate(
    *,
    price: float = 0.0,
    vwap_24h: float = 0.0,
    rsi_14: float = 50.0,
    price_change_1h: float = 0.0,
    price_change_24h: float = 0.0,
    volume_spike: float = 1.0,
    gs_regime: str = "NEUTRAL",
    gs_bias: str = "NEUTRAL",
    fear_greed: Optional[float] = None,
    rumor_flag: bool = False,
    drawdown: float = 0.0,
    spread_edge: float = 0.0,
) -> DeskVerdict:
    roles: list[RoleView] = []

    # Technical / momentum
    mom = (
        _clamp(price_change_1h / 0.03) * 0.4
        + _clamp(price_change_24h / 0.08) * 0.4
        + _clamp((volume_spike - 1.0) / 1.0) * 0.2
    )
    roles.append(
        RoleView(
            "technical",
            _stance(mom),
            _clamp(mom),
            f"1h={price_change_1h:.3f} 24h={price_change_24h:.3f} volx={volume_spike:.2f}",
        )
    )

    # Mean reversion
    mr = 0.0
    if vwap_24h > 0 and price > 0:
        mr = -_clamp((price - vwap_24h) / vwap_24h / 0.04)
    if rsi_14 >= 70:
        mr -= 0.35
    elif rsi_14 <= 30:
        mr += 0.35
    roles.append(
        RoleView(
            "mean_reversion",
            _stance(mr, 0.2, -0.2),
            _clamp(mr),
            f"rsi={rsi_14:.1f}",
        )
    )

    # Sentiment
    sent = 0.0
    bias = (gs_bias or "NEUTRAL").upper()
    if bias in ("BULLISH", "BUY", "ACCUMULATE"):
        sent += 0.45
    elif bias in ("BEARISH", "SELL", "DISTRIBUTE"):
        sent -= 0.45
    if (gs_regime or "").upper() == "RISK_OFF":
        sent -= 0.5
    if fear_greed is not None:
        if fear_greed <= 25:
            sent -= 0.4
        elif fear_greed >= 75:
            sent += 0.15
    if rumor_flag:
        sent -= 0.35
    roles.append(
        RoleView(
            "sentiment",
            _stance(sent, 0.2, -0.2),
            _clamp(sent),
            f"gs={gs_regime}/{gs_bias} fg={fear_greed} rumor={rumor_flag}",
        )
    )

    # Micro-arb
    arb = _clamp(spread_edge / 0.02) if spread_edge else 0.0
    roles.append(
        RoleView(
            "micro_arb",
            "BULL" if arb > 0.3 else "NEUTRAL",
            _clamp(arb),
            f"spread_edge={spread_edge:.4f}",
        )
    )

    tech_s, mr_s, sent_s = roles[0].score, roles[1].score, roles[2].score
    bull_score = _clamp(0.5 * max(tech_s, 0) + 0.3 * max(sent_s, 0) + 0.2 * max(arb, 0))
    bear_score = _clamp(
        0.5 * max(-tech_s, 0) + 0.3 * max(-sent_s, 0) + 0.2 * max(-mr_s, 0)
    )
    roles.append(RoleView("bull_researcher", "BULL", bull_score, "long case"))
    roles.append(RoleView("bear_researcher", "BEAR", -bear_score, "short case"))

    # Risk officer
    risk_veto = False
    risk_note = "ok"
    if (gs_regime or "").upper() == "RISK_OFF":
        risk_veto, risk_note = True, "RISK_OFF regime"
    elif drawdown >= 0.12:
        risk_veto, risk_note = True, f"drawdown={drawdown:.2%}"
    elif fear_greed is not None and fear_greed <= 20:
        risk_veto, risk_note = True, f"fear_greed={fear_greed}"
    elif rumor_flag and sent_s < 0:
        risk_veto, risk_note = True, "rumor + negative sentiment"
    roles.append(
        RoleView(
            "risk_officer",
            "VETO" if risk_veto else "NEUTRAL",
            -1.0 if risk_veto else 0.0,
            risk_note,
        )
    )

    # Weighted net (researchers already compress tech/sent)
    net = 0.0
    for r in roles:
        w = _WEIGHTS.get(r.role)
        if w:
            net += w * r.score
    net = _clamp(net)

    agree = _agreement(roles)
    conf = min(1.0, abs(net) * 1.15 * (0.7 + 0.3 * agree) + (0.12 if arb > 0.4 else 0))

    if risk_veto:
        action = "HOLD" if drawdown >= 0.12 else "YIELD"
        rationale = f"risk veto: {risk_note}"
        conf = min(conf, 0.35)
    elif arb > 0.45:
        action = "BUY"
        rationale = "micro-arb edge dominates desk"
        conf = max(conf, 0.62)
    elif net >= 0.22 and agree >= 0.5:
        action = "BUY"
        rationale = "bull desk majority"
    elif net <= -0.22 and agree >= 0.5:
        action = "SELL"
        rationale = "bear desk majority"
    elif abs(net) < 0.12:
        action = "YIELD"
        rationale = "no edge → yield sleeve"
    else:
        action = "HOLD"
        rationale = "mixed desk"

    return DeskVerdict(
        action=action,
        confidence=float(conf),
        net_score=float(net),
        risk_veto=risk_veto,
        agreement=float(agree),
        roles=roles,
        rationale=rationale,
    )


def fuse_agent_desk(
    agent_action: str,
    agent_confidence: float,
    desk: DeskVerdict,
    *,
    agent_size_hint: float = 0.0,
) -> dict[str, Any]:
    """
    Soft fusion for reporting / mode hints.
    Desk risk_veto always wins. Guardian still separate.
    Confidence agent may be 0-100 or 0-1.
    """
    ac = float(agent_confidence or 0)
    if ac > 1.0:
        ac = ac / 100.0
    aa = (agent_action or "WAIT").upper()
    if desk.risk_veto:
        return {
            "action": desk.action,
            "confidence": min(desk.confidence, 0.4),
            "source": "desk_veto",
            "size_usd_hint": 0.0,
        }
    if aa in ("BUY", "SELL") and ac >= 0.62 and not desk.risk_veto:
        # agreement boost
        conf = min(1.0, 0.6 * ac + 0.4 * desk.confidence)
        if desk.action != aa and desk.agreement > 0.6 and abs(desk.net_score) > 0.25:
            return {
                "action": "HOLD",
                "confidence": conf * 0.5,
                "source": "agent_desk_conflict",
                "size_usd_hint": 0.0,
            }
        return {
            "action": aa,
            "confidence": conf,
            "source": "agent_primary",
            "size_usd_hint": float(agent_size_hint or 0),
        }
    if desk.action in ("BUY", "SELL") and desk.confidence >= 0.62:
        return {
            "action": desk.action,
            "confidence": desk.confidence,
            "source": "desk_primary",
            "size_usd_hint": float(agent_size_hint or 0) * 0.5,
        }
    return {
        "action": desk.action if desk.action != "HOLD" else aa or "HOLD",
        "confidence": max(ac, desk.confidence) * 0.5,
        "source": "soft",
        "size_usd_hint": 0.0,
    }


if __name__ == "__main__":
    import json

    v = debate(
        price=2.7,
        vwap_24h=2.65,
        rsi_14=55,
        price_change_1h=0.01,
        price_change_24h=0.03,
        volume_spike=1.4,
        gs_bias="BULLISH",
        fear_greed=48,
    )
    print(json.dumps(v.to_dict(), indent=2))
    print(json.dumps(fuse_agent_desk("BUY", 70, v, agent_size_hint=15), indent=2))
