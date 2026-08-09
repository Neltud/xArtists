"""Specialized proposal functions for the autonomous swarm (no I/O)."""
from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any


@dataclass
class MarketSnapshot:
    token: str = "WEGLD-bd4d79"
    price: float = 0.0
    vwap_24h: float = 0.0
    rsi_14: float = 50.0
    trend_7d_pct: float = 0.0
    price_change_1h: float = 0.0
    price_change_24h: float = 0.0
    liquidity_usd: float = 100_000.0
    volume_spike: float = 1.0
    dex_a: float = 0.0
    dex_b: float = 0.0
    fear_greed: float = 50.0
    gs_regime: str = "NEUTRAL"
    gs_bias: str = "NEUTRAL"


@dataclass
class BookSnapshot:
    equity_usd: float = 100.0
    deployable_usd: float = 40.0
    drawdown: float = 0.0
    consecutive_wins: int = 0
    consecutive_losses: int = 0
    realized_vol: float = 0.02
    compound_intensity: float = 0.4


@dataclass
class AgentProposal:
    agent: str
    action: str
    token: str
    confidence: float
    size_usd: float
    reason: str
    priority: float = 0.0
    meta: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def agent_defense(m: MarketSnapshot, book: BookSnapshot) -> AgentProposal:
    reasons = []
    if m.fear_greed <= 25:
        reasons.append(f"fear={m.fear_greed}")
    if abs(book.drawdown) >= 0.12:
        reasons.append(f"dd={book.drawdown:.2%}")
    if book.consecutive_losses >= 5:
        reasons.append(f"loss_streak={book.consecutive_losses}")
    if m.gs_regime.upper() in ("RISK_OFF", "BEAR", "CRISIS"):
        reasons.append(f"gs={m.gs_regime}")
    if reasons:
        return AgentProposal(
            "DEFENSE", "VETO", m.token, 0.95, 0.0,
            "DEFENSE: " + ", ".join(reasons), priority=100.0,
        )
    return AgentProposal("DEFENSE", "WAIT", m.token, 0.5, 0.0, "DEFENSE clear", priority=0.0)


def agent_momentum(m: MarketSnapshot) -> AgentProposal:
    conf, action, reason = 0.4, "WAIT", "no trend"
    if m.trend_7d_pct > 2 and m.price_change_1h > 0 and m.gs_bias.upper() in (
        "BULL", "BULLISH", "NEUTRAL",
    ):
        conf = min(0.92, 0.55 + m.trend_7d_pct / 40 + max(0, m.price_change_1h) / 20)
        if m.gs_bias.upper() in ("BULL", "BULLISH"):
            conf = min(0.95, conf + 0.08)
        action, reason = "BUY", f"trend_7d={m.trend_7d_pct:.1f}% + gs={m.gs_bias}"
    elif m.trend_7d_pct < -3 and m.price_change_1h < 0:
        conf = min(0.9, 0.55 + abs(m.trend_7d_pct) / 40)
        action, reason = "SELL", f"downtrend {m.trend_7d_pct:.1f}%"
    return AgentProposal(
        "MOMENTUM", action, m.token, conf, 0.0, reason,
        priority=conf * 10 if action in ("BUY", "SELL") else 1.0,
    )


def agent_mean_rev(m: MarketSnapshot) -> AgentProposal:
    conf, action, reason = 0.4, "WAIT", "rsi neutral"
    vwap = m.vwap_24h or m.price
    dev = ((m.price - vwap) / vwap) if vwap > 0 and m.price > 0 else 0.0
    if m.rsi_14 <= 32 and dev < -0.01 and m.liquidity_usd >= 20_000:
        conf = min(0.9, 0.6 + (32 - m.rsi_14) / 50)
        action, reason = "BUY", f"RSI={m.rsi_14:.0f} below VWAP {dev:.2%}"
    elif m.rsi_14 >= 68 and dev > 0.01:
        conf = min(0.9, 0.6 + (m.rsi_14 - 68) / 50)
        action, reason = "SELL", f"RSI={m.rsi_14:.0f} above VWAP {dev:.2%}"
    return AgentProposal(
        "MEAN_REV", action, m.token, conf, 0.0, reason,
        priority=conf * 9 if action != "WAIT" else 1.0,
    )


def agent_micro_arb(m: MarketSnapshot) -> AgentProposal:
    a, b = m.dex_a or m.price, m.dex_b or m.price
    if a <= 0 or b <= 0:
        return AgentProposal("MICRO_ARB", "WAIT", m.token, 0.3, 0.0, "no dual quotes", 0.5)
    mid = (a + b) / 2
    spread = abs(a - b) / mid
    fee_proxy = 0.003
    if spread > 2.5 * fee_proxy and m.liquidity_usd >= 30_000:
        conf = min(0.88, 0.55 + spread * 20)
        return AgentProposal(
            "MICRO_ARB", "BUY", m.token, conf, 0.0, f"spread={spread:.2%} vs fees",
            conf * 12, meta={"spread": spread, "dex_a": a, "dex_b": b},
        )
    return AgentProposal(
        "MICRO_ARB", "WAIT", m.token, 0.4, 0.0, f"spread={spread:.2%} too tight", 0.5,
    )


def agent_yield(m: MarketSnapshot, book: BookSnapshot) -> AgentProposal:
    return AgentProposal(
        "YIELD", "YIELD", "USDC-c76f1f", 0.55,
        min(book.deployable_usd * 0.25, book.equity_usd * 0.2),
        "idle capital → yield sleeve", priority=3.0,
    )


def collect_proposals(m: MarketSnapshot, book: BookSnapshot) -> list[AgentProposal]:
    return [
        agent_defense(m, book),
        agent_momentum(m),
        agent_mean_rev(m),
        agent_micro_arb(m),
        agent_yield(m, book),
    ]
