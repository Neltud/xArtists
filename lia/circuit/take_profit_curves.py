"""
Take-profit curves — logarithmic, exponential, ladder
=====================================================
Used by CompoundCircuit for scale-out.

Modes: fixed | exp | log | ladder
See docs/TP_COMPOUND_VALIDATION.md
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Any, Literal, Optional

TpMode = Literal["fixed", "exp", "log", "ladder"]


@dataclass
class TpLevel:
    index: int
    gross_pct: float
    price: float
    size_frac: float
    hit: bool = False

    def to_dict(self) -> dict[str, Any]:
        return {
            "index": self.index,
            "gross_pct": self.gross_pct,
            "price": self.price,
            "size_frac": self.size_frac,
            "hit": self.hit,
        }


@dataclass
class TpPlan:
    mode: TpMode
    entry: float
    levels: list[TpLevel] = field(default_factory=list)
    runner_frac: float = 0.0
    realized_frac: float = 0.0

    def pending(self) -> list[TpLevel]:
        return [lv for lv in self.levels if not lv.hit]

    def on_price_long(self, price: float) -> list[TpLevel]:
        newly: list[TpLevel] = []
        for lv in self.levels:
            if not lv.hit and price >= lv.price:
                lv.hit = True
                self.realized_frac = min(1.0, self.realized_frac + lv.size_frac)
                newly.append(lv)
        return newly

    def to_dict(self) -> dict[str, Any]:
        return {
            "mode": self.mode,
            "entry": self.entry,
            "runner_frac": self.runner_frac,
            "realized_frac": self.realized_frac,
            "levels": [lv.to_dict() for lv in self.levels],
        }


def _normalize_fracs(fracs: list[float], max_total: float = 0.9) -> list[float]:
    s = sum(fracs)
    if s <= 0:
        return fracs
    scale = min(1.0, max_total / s)
    return [f * scale for f in fracs]


def build_fixed_plan(entry: float, gross_pct: float) -> TpPlan:
    return TpPlan(
        mode="fixed",
        entry=entry,
        levels=[TpLevel(0, gross_pct, entry * (1 + gross_pct), 1.0)],
        runner_frac=0.0,
    )


def build_exp_plan(
    entry: float,
    *,
    g0: float = 0.008,
    phi: float = 1.6,
    n: int = 4,
    size_fracs: Optional[list[float]] = None,
) -> TpPlan:
    if size_fracs is None:
        size_fracs = [0.25, 0.25, 0.25, 0.15][:n]
    while len(size_fracs) < n:
        size_fracs.append(0.1)
    size_fracs = _normalize_fracs(size_fracs[:n], max_total=0.9)
    levels: list[TpLevel] = []
    for k in range(n):
        g = g0 * (phi**k)
        levels.append(TpLevel(k, g, entry * (1 + g), size_fracs[k]))
    runner = max(0.0, 1.0 - sum(size_fracs))
    return TpPlan(mode="exp", entry=entry, levels=levels, runner_frac=runner)


def build_log_plan(
    entry: float,
    *,
    g_min: float = 0.006,
    g_max: float = 0.04,
    n: int = 5,
    size_fracs: Optional[list[float]] = None,
) -> TpPlan:
    if n < 2:
        return build_fixed_plan(entry, g_min)
    if size_fracs is None:
        raw = [0.30, 0.25, 0.15, 0.10, 0.10]
        size_fracs = (raw + [0.08] * n)[:n]
    size_fracs = _normalize_fracs(size_fracs[:n], max_total=0.9)
    levels = []
    for k in range(n):
        u = k / (n - 1)
        g = g_min * math.exp(u * math.log(g_max / g_min))
        levels.append(TpLevel(k, g, entry * (1 + g), size_fracs[k]))
    runner = max(0.0, 1.0 - sum(size_fracs))
    return TpPlan(mode="log", entry=entry, levels=levels, runner_frac=runner)


def build_ladder_plan(
    entry: float,
    *,
    risk_pct: float = 0.01,
    r_multiples: Optional[list[float]] = None,
    size_fracs: Optional[list[float]] = None,
) -> TpPlan:
    if r_multiples is None:
        r_multiples = [1.0, 1.5, 2.0, 3.0]
    n = len(r_multiples)
    if size_fracs is None:
        size_fracs = [0.35, 0.25, 0.20, 0.10][:n]
    size_fracs = _normalize_fracs(size_fracs[:n], max_total=0.9)
    levels = []
    for i, r in enumerate(r_multiples):
        g = risk_pct * r
        levels.append(TpLevel(i, g, entry * (1 + g), size_fracs[i]))
    runner = max(0.0, 1.0 - sum(size_fracs))
    return TpPlan(mode="ladder", entry=entry, levels=levels, runner_frac=runner)


def build_tp_plan(
    mode: TpMode,
    entry: float,
    *,
    gross_for_fixed: float = 0.02,
    **kwargs: Any,
) -> TpPlan:
    if mode == "fixed":
        return build_fixed_plan(entry, gross_for_fixed)
    if mode == "exp":
        return build_exp_plan(
            entry, **{k: v for k, v in kwargs.items() if k in ("g0", "phi", "n", "size_fracs")}
        )
    if mode == "log":
        return build_log_plan(
            entry, **{k: v for k, v in kwargs.items() if k in ("g_min", "g_max", "n", "size_fracs")}
        )
    if mode == "ladder":
        return build_ladder_plan(
            entry,
            **{k: v for k, v in kwargs.items() if k in ("risk_pct", "r_multiples", "size_fracs")},
        )
    return build_fixed_plan(entry, gross_for_fixed)


def validate_plan(plan: TpPlan) -> dict[str, Any]:
    errors: list[str] = []
    warnings: list[str] = []
    if plan.entry <= 0:
        errors.append("entry must be > 0")
    total_frac = sum(lv.size_frac for lv in plan.levels) + plan.runner_frac
    if total_frac > 1.01:
        errors.append(f"size fractions sum {total_frac:.3f} > 1")
    if total_frac < 0.99:
        warnings.append(f"size fractions sum {total_frac:.3f} < 1")
    prices = [lv.price for lv in plan.levels]
    if prices != sorted(prices):
        errors.append("level prices must be non-decreasing for LONG")
    for lv in plan.levels:
        if lv.gross_pct <= 0:
            errors.append(f"level {lv.index} gross_pct <= 0")
        if lv.size_frac < 0:
            errors.append(f"level {lv.index} negative size")
    w_gross = sum(lv.gross_pct * lv.size_frac for lv in plan.levels)
    return {
        "ok": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
        "mode": plan.mode,
        "n_levels": len(plan.levels),
        "runner_frac": plan.runner_frac,
        "weighted_gross_if_all_hit": round(w_gross, 6),
        "levels": [lv.to_dict() for lv in plan.levels],
    }


def simulate_path(
    plan: TpPlan, prices: list[float], *, fee_roundtrip: float = 0.006
) -> dict[str, Any]:
    plan = TpPlan(
        mode=plan.mode,
        entry=plan.entry,
        levels=[
            TpLevel(lv.index, lv.gross_pct, lv.price, lv.size_frac, False)
            for lv in plan.levels
        ],
        runner_frac=plan.runner_frac,
    )
    realized = 0.0
    events = []
    for px in prices:
        for lv in plan.on_price_long(px):
            slice_gross = (lv.price - plan.entry) / plan.entry
            realized += lv.size_frac * slice_gross
            events.append(
                {"price": px, "level": lv.index, "gross": slice_gross, "frac": lv.size_frac}
            )
    fee = fee_roundtrip * plan.realized_frac
    net = realized - fee
    return {
        "realized_gross": round(realized, 6),
        "fee_drag": round(fee, 6),
        "realized_net": round(net, 6),
        "realized_frac": plan.realized_frac,
        "events": events,
        "pending_levels": len(plan.pending()),
    }


def compound_projection(
    start_usd: float,
    *,
    net_per_full_win: float = 0.01,
    compound_fraction: float = 0.70,
    wins: int = 100,
    partial_efficiency: float = 1.0,
) -> dict[str, Any]:
    r = 1 + net_per_full_win * compound_fraction * partial_efficiency
    end = start_usd * (r**wins)
    return {
        "start_usd": start_usd,
        "wins": wins,
        "rate_per_win": r - 1,
        "end_usd": round(end, 4),
        "multiple": round(end / start_usd, 4) if start_usd else None,
        "partial_efficiency": partial_efficiency,
    }


if __name__ == "__main__":
    e = 10.0
    for mode in ("fixed", "exp", "log", "ladder"):
        plan = build_tp_plan(mode, e, gross_for_fixed=0.02)  # type: ignore
        print(mode, validate_plan(plan))
        print(" path", simulate_path(plan, [10.05, 10.1, 10.2, 10.35, 10.5]))
    print("compound", compound_projection(100, wins=50, partial_efficiency=0.75))
