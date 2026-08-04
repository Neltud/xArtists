"""
Single entry for Vellum: fuse strategies + GSN + social + DEFENSE + mode selection.
Paper-safe: does not sign. Caller enforces LIA_LIVE_TRADING + micro_trade.
"""
from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any, Optional

from lia.circuit.defense_circuit import DefenseCircuit, filter_action
from lia.circuit.strategies import Signal
from lia.circuit.strategies_venues import collect_core_signals, collect_venue_signals, fuse_all
from lia.circuit.trading_modes import ModeSpec, mode_allows_action, select_mode, MODES
from lia.signals.social_intel import SocialBias, SocialIntel

_ROOT = Path(__file__).resolve().parents[2]


def run_cycle(
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
    fear_greed: Optional[float] = None,
    has_open_position: bool = False,
    drawdown_pct: float = 0.0,
    equity_usd: float = 0.0,
    peak_usd: float = 0.0,
    hatom_hf: float = 999.0,
    consecutive_losses: int = 0,
    social: Optional[SocialBias] = None,
    run_social: bool = True,
    persist_path: Optional[Path] = None,
) -> dict[str, Any]:
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
        trade_confidence=max((s.confidence for s in core if s.action == "BUY"), default=0.0),
        price_xex=price_dex_a or None,
        price_onedex=price_dex_b or None,
    )
    fused: Signal = fuse_all(core, venues)

    if social is None and run_social:
        social = SocialIntel().run(persist=True)
    elif social is None:
        social = SocialBias("WAIT", 0.0, 0.0, False, 0)

    blended = SocialIntel().blend_with_lia(fused.action, fused.confidence, social)
    decision = blended["decision"]
    confidence = float(blended["confidence"])

    # --- DEFENSE CIRCUIT (before mode allows BUY) ---
    peak = peak_usd if peak_usd > 0 else (equity_usd / (1 - drawdown_pct) if drawdown_pct < 1 and equity_usd > 0 else equity_usd)
    if peak_usd <= 0 and drawdown_pct > 0 and equity_usd > 0:
        peak = equity_usd / max(1e-9, (1 - drawdown_pct))
    defense_c = DefenseCircuit()
    defense_snap = defense_c.update(
        gs_regime=gs_regime,
        fear_greed=fear_greed,
        equity_usd=equity_usd if equity_usd > 0 else 0.0,
        peak_usd=peak if peak > 0 else equity_usd,
        hatom_hf=hatom_hf,
        consecutive_losses=consecutive_losses,
        social_rumor=social.rumor_flag,
        social_bias=social.bias,
        social_weight=social.weight,
    )
    def_filter = filter_action(decision, defense_snap)
    decision = def_filter["action"]
    if def_filter["blocked"]:
        confidence = min(confidence, 0.35)

    if defense_snap.active:
        mode: ModeSpec = MODES["DEFENSE"]
    else:
        mode = select_mode(
            gs_regime=gs_regime,
            fuse_action=fused.action,
            fuse_strategy=fused.strategy,
            fuse_confidence=fused.confidence,
            fear_greed=fear_greed,
            rumor_flag=social.rumor_flag,
            has_open_position=has_open_position,
            drawdown_pct=defense_snap.drawdown_pct or drawdown_pct,
        )

    allowed = mode_allows_action(mode, decision, fused.strategy)
    if decision == "BUY" and not defense_snap.allow_buy:
        allowed = False
    if not allowed:
        decision = "WAIT"
        confidence = min(confidence, 0.4)

    report = {
        "timestamp": time.time(),
        "token": token,
        "fused": {
            "action": fused.action,
            "strategy": fused.strategy,
            "confidence": fused.confidence,
            "reason": fused.reason,
        },
        "social": social.to_dict(),
        "blend_source": blended.get("source"),
        "defense": defense_snap.to_dict(),
        "defense_filter": def_filter,
        "mode": mode.to_dict(),
        "final": {
            "action": decision,
            "confidence": confidence,
            "allowed_by_mode": allowed,
            "allow_buy": defense_snap.allow_buy,
            "max_notional_usd": mode.max_notional_usd if defense_snap.allow_buy else 0.0,
            "max_trades_per_day": mode.max_trades_per_day,
            "paper_only": mode.paper_only or not defense_snap.allow_buy and decision == "BUY",
            "recommend_halt": defense_snap.recommend_halt,
        },
        "note": "Caller must still check LIA_LIVE_TRADING=0 and should_skip_micro_trade",
    }

    path = persist_path or (_ROOT / "data" / "lia_mode_cycle.json")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return report


if __name__ == "__main__":
    print(json.dumps(run_cycle(price=10.0, rsi_14=32, vwap_24h=10.3, fear_greed=20), indent=2))
