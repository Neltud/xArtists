"""Risk-adjusted sizing + slippage adaptive cut (P4.5)."""
from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DELTA = ROOT / "data" / "performance_delta.json"


@dataclass(frozen=True)
class SizeResult:
    size_usd: float
    fraction: float
    method: str
    note: str


def _realized_slippage(strategy: str | None = None) -> float | None:
    if not DELTA.is_file():
        return None
    try:
        d = json.loads(DELTA.read_text(encoding="utf-8"))
        if strategy:
            s = (d.get("strategies") or {}).get(strategy) or {}
            if s.get("avg_slippage") is not None:
                return float(s["avg_slippage"])
        g = d.get("avg_slippage_global")
        return float(g) if g is not None else None
    except Exception:
        return None


def size_position(
    *,
    equity_usd: float = 1000.0,
    confidence: float = 0.5,
    volatility: float = 0.35,
    edge_hint: float | None = None,
    max_usd: float = 15.0,
    max_equity_frac: float = 0.02,
    strategy: str | None = None,
) -> SizeResult:
    equity = max(0.0, float(equity_usd))
    conf = min(1.0, max(0.0, float(confidence)))
    vol = max(0.08, float(volatility))
    target_vol = 0.30

    base_frac = max_equity_frac * conf
    vol_scale = min(1.5, target_vol / vol)
    frac = base_frac * vol_scale
    method = "vol_target"
    notes = [f"conf={conf:.2f}", f"vol={vol:.2f}"]

    if edge_hint is not None and edge_hint > 0:
        kelly = (edge_hint * conf) / (vol * vol)
        frac = min(frac, 0.25 * kelly)
        method = "fractional_kelly"

    # P4.5: if realized slip > 2%, cut size 50%
    slip = _realized_slippage(strategy)
    if slip is not None and slip > 0.02:
        frac *= 0.5
        max_usd = max_usd * 0.5
        method = f"{method}+slip_cut50"
        notes.append(f"slip={slip:.4f}>2%→size×0.5")

    frac = max(0.0, min(max_equity_frac, frac))
    size = min(max_usd, equity * frac)
    if size > 0:
        size = max(1.0, size)

    return SizeResult(
        size_usd=round(size, 2),
        fraction=round(frac, 6),
        method=method,
        note=" ".join(notes),
    )
