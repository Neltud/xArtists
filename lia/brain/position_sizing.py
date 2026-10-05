"""
Risk-adjusted position sizing (paper + Beta preflight).
Fractional Kelly + volatility targeting — conservative.
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class SizeResult:
    size_usd: float
    fraction: float
    method: str
    note: str


def size_position(
    *,
    equity_usd: float = 1000.0,
    confidence: float = 0.5,
    volatility: float = 0.35,
    edge_hint: float | None = None,
    max_usd: float = 15.0,
    max_equity_frac: float = 0.02,
) -> SizeResult:
    """
    vol-adjusted size:
      base = equity * max_equity_frac * confidence
      scale down by vol / target_vol
    optional fractional Kelly if edge_hint provided (edge * conf / vol^2).
    """
    equity = max(0.0, float(equity_usd))
    conf = min(1.0, max(0.0, float(confidence)))
    vol = max(0.08, float(volatility))
    target_vol = 0.30

    base_frac = max_equity_frac * conf
    vol_scale = min(1.5, target_vol / vol)
    frac = base_frac * vol_scale

    method = "vol_target"
    if edge_hint is not None and edge_hint > 0:
        # fractional Kelly (quarter-Kelly)
        kelly = (edge_hint * conf) / (vol * vol)
        frac = min(frac, 0.25 * kelly)
        method = "fractional_kelly"

    frac = max(0.0, min(max_equity_frac, frac))
    size = min(max_usd, equity * frac)
    # floor for paper visibility
    if size > 0:
        size = max(1.0, size)

    return SizeResult(
        size_usd=round(size, 2),
        fraction=round(frac, 6),
        method=method,
        note=f"conf={conf:.2f} vol={vol:.2f} equity={equity:.0f}",
    )
