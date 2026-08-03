"""
LIA AI Agent — MultiversX base layer
====================================
Single-chain settlement agent:
  - consumes core + venue signals (MVX preferred)
  - produces Orchestrator-ready decision
  - optional: catalog agent pack metadata for /agents

Does NOT sign txs (UniversalExecutor + PEM in Vellum).
Does NOT route size to Solana/HL.
"""
from __future__ import annotations

import json
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Optional

from lia.circuit.strategies_venues import collect_core_signals, collect_venue_signals, fuse_all

ROOT = Path(__file__).resolve().parents[2]


@dataclass
class AgentDecision:
    action: str  # BUY | SELL | WAIT | YIELD
    token: str
    confidence: float
    size_usd_hint: float
    strategy: str
    reason: str
    chain: str = "multiversx"
    executable: bool = True
    meta: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def _clamp_size(confidence: float, base: float = 10.0, max_usd: float = 50.0) -> float:
    if confidence < 0.62:
        return 0.0
    return round(min(max_usd, base * confidence), 2)


def decide(
    *,
    token: str = "WEGLD-bd4d79",
    price: float = 0.0,
    vwap_24h: float = 0.0,
    rsi_14: float = 50.0,
    liquidity_usd: float = 100_000.0,
    price_change_1h: float = 0.0,
    price_change_24h: float = 0.0,
    volume_spike: float = 1.0,
    gs_regime: str = "NEUTRAL",
    gs_bias: str = "NEUTRAL",
    price_dex_a: float = 0.0,
    price_dex_b: float = 0.0,
    include_cross_chain_signals: bool = False,
) -> AgentDecision:
    core = collect_core_signals(
        token=token,
        price=price or 1.0,
        vwap_24h=vwap_24h,
        rsi_14=rsi_14,
        liquidity_usd=liquidity_usd,
        price_change_1h=price_change_1h,
        price_change_24h=price_change_24h,
        volume_spike=volume_spike,
        gs_regime=gs_regime,
        gs_bias=gs_bias,
        price_dex_a=price_dex_a,
        price_dex_b=price_dex_b,
    )
    venues = collect_venue_signals(
        token=token,
        trade_confidence=max((s.confidence for s in core if s.action == "BUY"), default=0.4),
        price_xex=price_dex_a or price,
        price_onedex=price_dex_b or price,
        include_planned=include_cross_chain_signals,
    )
    fused = fuse_all(core, venues)

    # Force non-executable tags off the settlement path
    executable = True
    if fused.meta and fused.meta.get("executable") is False:
        executable = False
    if fused.strategy in ("JUP", "HL_FUND", "SOUL"):
        executable = False

    size = _clamp_size(fused.confidence) if executable and fused.action in ("BUY", "SELL") else 0.0

    return AgentDecision(
        action=fused.action,
        token=fused.token or token,
        confidence=round(fused.confidence, 4),
        size_usd_hint=size,
        strategy=fused.strategy,
        reason=fused.reason,
        chain="multiversx",
        executable=executable and fused.action in ("BUY", "SELL", "YIELD"),
        meta={
            **(fused.meta or {}),
            "gs_regime": gs_regime,
            "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        },
    )


def agent_pack_public_meta() -> dict[str, Any]:
    """Metadata for limited LIA agents listed on /agents (not the full brain)."""
    return {
        "id": "lia-mvx-core",
        "name": "LIA MVX Core",
        "chain": "multiversx",
        "description": "Spot compound + yield sleeve on MultiversX only",
        "capabilities": ["MR", "MOM", "ARB", "YIELD", "TP_LOG"],
        "not_included": ["solana_exec", "hyperliquid_exec", "soul_zk_live"],
        "fee_bps_marketplace": 300,
    }


def write_status(path: Optional[str] = None) -> Path:
    out = Path(path) if path else ROOT / "data" / "lia_mvx_agent.json"
    payload = {
        "updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "agent": agent_pack_public_meta(),
        "last_decision_demo": decide(price=10.0, vwap_24h=10.15, rsi_14=32, liquidity_usd=80_000).to_dict(),
    }
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return out


if __name__ == "__main__":
    d = decide(price=10.0, vwap_24h=10.2, rsi_14=30, liquidity_usd=90_000)
    print(json.dumps(d.to_dict(), indent=2))
    print("wrote", write_status())
