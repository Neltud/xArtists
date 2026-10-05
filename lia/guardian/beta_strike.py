"""
Parse config/beta_strike.yaml and enforce hard limits.
No broadcast if preflight fails. LIA_LIVE_TRADING still required separately.
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
CFG_PATH = ROOT / "config" / "beta_strike.yaml"


def _simple_yaml(text: str) -> dict[str, Any]:
    """Minimal indented YAML subset (no nested lists of maps)."""
    try:
        import yaml  # type: ignore

        return yaml.safe_load(text) or {}
    except Exception:
        pass
    # Fallback: only top-level scalars we need via defaults
    return {}


@dataclass(frozen=True)
class BetaStrikeConfig:
    max_capital_exposure_egld: float = 0.05
    max_trade_size_egld: float = 0.005
    max_trade_size_usd: float = 15.0
    max_daily_notional_usd: float = 40.0
    max_trades_per_day: int = 3
    max_drawdown_stop: float = 0.12
    min_confidence_level: float = 0.62
    min_wallet_egld_reserve: float = 0.05
    allowlist: tuple[str, ...] = ("EGLD", "WEGLD-bd4d79", "USDC-c76f1f", "TRO-94c925")
    default_slippage_bps: int = 100
    raw: dict[str, Any] = field(default_factory=dict, compare=False)


def load_beta_strike(path: Path | None = None) -> BetaStrikeConfig:
    p = path or CFG_PATH
    raw: dict[str, Any] = {}
    if p.is_file():
        raw = _simple_yaml(p.read_text(encoding="utf-8")) or {}
    capital = raw.get("capital") or {}
    risk = raw.get("risk") or {}
    allow = raw.get("allowlist") or {}
    tokens = allow.get("tokens") if isinstance(allow, dict) else None
    dex = raw.get("dex") or {}
    return BetaStrikeConfig(
        max_capital_exposure_egld=float(capital.get("max_capital_exposure_egld", 0.05)),
        max_trade_size_egld=float(capital.get("max_trade_size_egld", 0.005)),
        max_trade_size_usd=float(capital.get("max_trade_size_usd", 15)),
        max_daily_notional_usd=float(capital.get("max_daily_notional_usd", 40)),
        max_trades_per_day=int(capital.get("max_trades_per_day", 3)),
        max_drawdown_stop=float(risk.get("max_drawdown_stop", 0.12)),
        min_confidence_level=float(risk.get("min_confidence_level", 0.62)),
        min_wallet_egld_reserve=float(risk.get("min_wallet_egld_reserve", 0.05)),
        allowlist=tuple(tokens) if isinstance(tokens, list) else BetaStrikeConfig().allowlist,
        default_slippage_bps=int(dex.get("default_slippage_bps", 100)),
        raw=raw,
    )


@dataclass
class PreflightResult:
    ok: bool
    reason: str
    size_usd: float
    size_egld: float
    scaled: bool = False


def preflight_trade(
    *,
    confidence: float,
    size_usd: float,
    size_egld: float | None = None,
    token: str = "EGLD",
    trades_today: int = 0,
    daily_notional_usd: float = 0.0,
    wallet_egld: float | None = None,
    drawdown: float | None = None,
    live_trading: bool | None = None,
    cfg: BetaStrikeConfig | None = None,
) -> PreflightResult:
    """Hard gates before any live broadcast."""
    c = cfg or load_beta_strike()
    live = (
        live_trading
        if live_trading is not None
        else os.environ.get("LIA_LIVE_TRADING", "0").strip() in ("1", "true", "TRUE")
    )

    from lia.guardian.kill_switch import get_kill_switch

    ks = get_kill_switch()
    if ks.is_locked:
        return PreflightResult(False, f"kill_switch:{ks.reason}", 0.0, 0.0)

    if not live:
        # Paper path always allowed through preflight for simulation
        return PreflightResult(True, "paper_path_ok", size_usd, size_egld or 0.0)

    t = (token or "").upper()
    allowed = {x.upper() for x in c.allowlist}
    if t not in allowed and token not in c.allowlist:
        return PreflightResult(False, f"token_not_allowlisted:{token}", 0.0, 0.0)

    if confidence < c.min_confidence_level:
        return PreflightResult(False, f"confidence_lt_{c.min_confidence_level}", 0.0, 0.0)

    if drawdown is not None and drawdown > c.max_drawdown_stop:
        ks.trigger("drawdown_breach")
        return PreflightResult(False, "kill_switch_drawdown", 0.0, 0.0)

    if trades_today >= c.max_trades_per_day:
        return PreflightResult(False, "max_trades_per_day", 0.0, 0.0)

    if daily_notional_usd + size_usd > c.max_daily_notional_usd:
        return PreflightResult(False, "max_daily_notional", 0.0, 0.0)

    if wallet_egld is not None and wallet_egld < c.min_wallet_egld_reserve:
        return PreflightResult(False, "below_egld_reserve", 0.0, 0.0)

    scaled = False
    out_usd = size_usd
    if out_usd > c.max_trade_size_usd:
        out_usd = c.max_trade_size_usd
        scaled = True

    out_egld = size_egld if size_egld is not None else 0.0
    if out_egld > c.max_trade_size_egld:
        out_egld = c.max_trade_size_egld
        scaled = True

    if out_usd <= 0 and out_egld <= 0:
        return PreflightResult(False, "size_zero_after_scale", 0.0, 0.0)

    return PreflightResult(True, "scale_down" if scaled else "ok", out_usd, out_egld, scaled)
