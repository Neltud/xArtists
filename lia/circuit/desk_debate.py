"""
Desk debate — lightweight multi-role signal (TradingAgents-inspired).

Roles (paper, no PEM):
  - technical / momentum
  - mean-reversion
  - sentiment (GSN + social bias)
  - bull researcher
  - bear researcher
  - risk officer  → can veto BUY

Does NOT replace Guardian or TradingStack. Output is advisory for mode/agent.
LIA_LIVE_TRADING never flipped here.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any, Optional


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
    roles: list[RoleView] = field(default_factory=list)
    rationale: str = ""

    def to_dict(self) -> dict[str, Any]:
        return {
            "action": self.action,
            "confidence": round(self.confidence, 4),
            "net_score": round(self.net_score, 4),
            "risk_veto": self.risk_veto,
            "roles": [asdict(r) for r in self.roles],
            "rationale": self.rationale,
            "paper": True,
            "source": "lia.circuit.desk_debate",
        }


def _clamp(x: float, lo: float = -1.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, x))


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

    # --- Technical / momentum ---
    mom = 0.0
    mom += _clamp(price_change_1h / 0.03) * 0.4
    mom += _clamp(price_change_24h / 0.08) * 0.4
    mom += _clamp((volume_spike - 1.0) / 1.0) * 0.2
    roles.append(
        RoleView(
            "technical",
            "BULL" if mom > 0.15 else "BEAR" if mom < -0.15 else "NEUTRAL",
            _clamp(mom),
            f"1h={price_change_1h:.3f} 24h={price_change_24h:.3f} volx={volume_spike:.2f}",
        )
    )

    # --- Mean reversion ---
    mr = 0.0
    if vwap_24h > 0 and price > 0:
        dev = (price - vwap_24h) / vwap_24h
        # fade extremes
        mr = -_clamp(dev / 0.04)
    if rsi_14 >= 70:
        mr -= 0.35
    elif rsi_14 <= 30:
        mr += 0.35
    roles.append(
        RoleView(
            "mean_reversion",
            "BULL" if mr > 0.2 else "BEAR" if mr < -0.2 else "NEUTRAL",
            _clamp(mr),
            f"rsi={rsi_14:.1f} vwap_dev",
        )
    )

    # --- Sentiment (GSN + fear) ---
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
            "BULL" if sent > 0.2 else "BEAR" if sent < -0.2 else "NEUTRAL",
            _clamp(sent),
            f"gs={gs_regime}/{gs_bias} fg={fear_greed} rumor={rumor_flag}",
        )
    )

    # --- Arb edge (structural) ---
    arb = _clamp(spread_edge / 0.02) if spread_edge else 0.0
    roles.append(
        RoleView(
            "micro_arb",
            "BULL" if arb > 0.3 else "NEUTRAL",
            _clamp(arb),
            f"spread_edge={spread_edge:.4f}",
        )
    )

    # --- Bull / Bear researchers (aggregate narrative) ---
    tech_s = roles[0].score
    mr_s = roles[1].score
    sent_s = roles[2].score
    bull_score = _clamp(0.5 * max(tech_s, 0) + 0.3 * max(sent_s, 0) + 0.2 * max(arb, 0))
    bear_score = _clamp(
        0.5 * max(-tech_s, 0) + 0.3 * max(-sent_s, 0) + 0.2 * max(-mr_s, 0)
    )
    roles.append(RoleView("bull_researcher", "BULL", bull_score, "long case"))
    roles.append(RoleView("bear_researcher", "BEAR", -bear_score, "short case"))

    # --- Risk officer (veto) ---
    risk_veto = False
    risk_note = "ok"
    if (gs_regime or "").upper() == "RISK_OFF":
        risk_veto = True
        risk_note = "RISK_OFF regime"
    if drawdown >= 0.12:
        risk_veto = True
        risk_note = f"drawdown={drawdown:.2%}"
    if fear_greed is not None and fear_greed <= 20:
        risk_veto = True
        risk_note = f"fear_greed={fear_greed}"
    if rumor_flag and sent_s < 0:
        risk_veto = True
        risk_note = "rumor + negative sentiment"
    roles.append(
        RoleView(
            "risk_officer",
            "VETO" if risk_veto else "NEUTRAL",
            -1.0 if risk_veto else 0.0,
            risk_note,
        )
    )

    # Net: bull - bear + light MR, risk can force HOLD/YIELD
    net = _clamp(bull_score - bear_score + 0.15 * mr_s + 0.1 * arb)
    conf = min(1.0, abs(net) * 1.2 + (0.15 if arb > 0.4 else 0))

    if risk_veto:
        action = "HOLD" if drawdown >= 0.12 else "YIELD"
        rationale = f"risk veto: {risk_note}"
        conf = min(conf, 0.35)
    elif arb > 0.45 and not risk_veto:
        action = "BUY"
        rationale = "micro-arb edge dominates desk"
        conf = max(conf, 0.62)
    elif net >= 0.25:
        action = "BUY"
        rationale = "bull desk majority"
    elif net <= -0.25:
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
        roles=roles,
        rationale=rationale,
    )


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
