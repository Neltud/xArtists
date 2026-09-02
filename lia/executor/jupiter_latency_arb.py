"""
Jupiter Latency-Aware Micro-Arbitrage
=====================================
Objectif: capturer un écart cross-venue / cross-route uniquement si:
  1. Quote fraîche (âge < max_quote_age_ms)
  2. Edge net > fees + safety après re-quote
  3. Re-quote immédiat avant broadcast (anti-staleness)
  4. Abort si drift prix > max_drift_bps entre quote1 et quote2

LIA autonome: paper par défaut; live seulement LIA_SOL_LIVE=1.
"""
from __future__ import annotations

import time
from dataclasses import asdict, dataclass
from typing import Any, Optional

from lia.executor.jupiter_solana import (
    DEFAULT_SLIPPAGE_BPS,
    JupiterExecutor,
    JupiterResult,
    get_quote,
    resolve_mint,
)


@dataclass
class ArbConfig:
    max_quote_age_ms: float = 400.0       # discard stale quotes
    max_drift_bps: float = 15.0           # abort if re-quote moves > 15 bps
    min_edge_bps: float = 25.0            # net edge after fees
    estimated_fee_bps: float = 10.0       # Jupiter + priority fee buffer
    slippage_bps: int = 30                # tighter than default for arb
    max_notional_usd: float = 80.0
    min_notional_usd: float = 5.0
    re_quote_mandatory: bool = True


@dataclass
class ArbOpportunity:
    ok: bool
    input_mint: str
    output_mint: str
    amount: int
    edge_bps: float
    quote_age_ms: float
    out_amount: str
    route: str
    reason: str
    quote: Optional[dict] = None

    def to_dict(self) -> dict[str, Any]:
        d = asdict(self)
        if self.quote and len(str(self.quote)) > 2000:
            d["quote"] = {"truncated": True, "outAmount": self.out_amount}
        return d


class JupiterLatencyArb:
    def __init__(self, cfg: Optional[ArbConfig] = None) -> None:
        self.cfg = cfg or ArbConfig()
        self.jup = JupiterExecutor()

    def scan(
        self,
        *,
        input_mint: str,
        output_mint: str,
        amount: int,
        reference_out: Optional[int] = None,
    ) -> ArbOpportunity:
        """
        Scan one leg. If reference_out provided (expected fair out),
        edge = (quoted_out - reference_out) / reference_out.
        Else edge estimated vs mid impact only (conservative: require low impact).
        """
        t0 = time.time()
        try:
            q = get_quote(
                input_mint=input_mint,
                output_mint=output_mint,
                amount=amount,
                slippage_bps=self.cfg.slippage_bps,
            )
        except Exception as e:
            return ArbOpportunity(
                False, input_mint, output_mint, amount, 0.0, 0.0, "", "",
                f"quote_error: {e}",
            )

        age_ms = (time.time() - t0) * 1000.0
        if age_ms > self.cfg.max_quote_age_ms:
            return ArbOpportunity(
                False, input_mint, output_mint, amount, 0.0, age_ms,
                str(q.get("outAmount") or ""), "",
                f"stale quote {age_ms:.0f}ms > {self.cfg.max_quote_age_ms}ms",
                q,
            )

        out_amt = int(q.get("outAmount") or 0)
        impact = abs(float(q.get("priceImpactPct") or 0)) * 10000  # to bps approx if pct
        # priceImpactPct is already in percent (e.g. 0.01 = 0.01%)
        impact_bps = abs(float(q.get("priceImpactPct") or 0)) * 100.0

        if reference_out and reference_out > 0:
            edge_bps = (out_amt - reference_out) / reference_out * 10_000.0
        else:
            # Without external ref: require very low impact as proxy for edge quality
            edge_bps = max(0.0, self.cfg.min_edge_bps + self.cfg.estimated_fee_bps - impact_bps)

        net_edge = edge_bps - self.cfg.estimated_fee_bps
        route_plan = q.get("routePlan") or []
        labels = [
            (s.get("swapInfo") or {}).get("label") or ""
            for s in route_plan[:4]
        ]
        route = " → ".join(x for x in labels if x) or "jupiter"

        if net_edge < self.cfg.min_edge_bps:
            return ArbOpportunity(
                False, input_mint, output_mint, amount, net_edge, age_ms,
                str(out_amt), route,
                f"edge {net_edge:.1f}bps < min {self.cfg.min_edge_bps}",
                q,
            )

        return ArbOpportunity(
            True, input_mint, output_mint, amount, net_edge, age_ms,
            str(out_amt), route, "edge_ok", q,
        )

    def execute_if_fresh(
        self,
        opp: ArbOpportunity,
        *,
        force_paper: bool = True,
    ) -> dict[str, Any]:
        """Re-quote then execute only if drift acceptable."""
        if not opp.ok or not opp.quote:
            return {"ok": False, "reason": opp.reason, "venue": "jupiter"}

        first_out = int(opp.out_amount or 0)
        t0 = time.time()
        try:
            q2 = get_quote(
                input_mint=opp.input_mint,
                output_mint=opp.output_mint,
                amount=opp.amount,
                slippage_bps=self.cfg.slippage_bps,
            )
        except Exception as e:
            return {"ok": False, "reason": f"requote_error: {e}", "venue": "jupiter"}

        age2 = (time.time() - t0) * 1000.0
        second_out = int(q2.get("outAmount") or 0)
        if first_out <= 0 or second_out <= 0:
            return {"ok": False, "reason": "invalid out amounts", "venue": "jupiter"}

        drift_bps = abs(second_out - first_out) / first_out * 10_000.0
        if drift_bps > self.cfg.max_drift_bps:
            return {
                "ok": False,
                "reason": f"drift {drift_bps:.1f}bps > max {self.cfg.max_drift_bps}",
                "venue": "jupiter",
                "first_out": first_out,
                "second_out": second_out,
            }

        # Use fresher quote for execution
        res: JupiterResult = self.jup.execute_swap(
            input_mint=opp.input_mint,
            output_mint=opp.output_mint,
            amount=opp.amount,
            slippage_bps=self.cfg.slippage_bps,
            force_paper=force_paper,
        )
        return {
            **res.to_dict(),
            "ok": res.ok,
            "arb_edge_bps": opp.edge_bps,
            "quote_age_ms": opp.quote_age_ms,
            "requote_age_ms": age2,
            "drift_bps": round(drift_bps, 2),
            "venue": "jupiter",
            "strategy": "JUPITER_ARB",
        }

    def try_arb(
        self,
        *,
        input_mint: str = "SOL",
        output_mint: str = "USDC",
        amount: int = 10_000_000,
        reference_out: Optional[int] = None,
        force_paper: bool = True,
    ) -> dict[str, Any]:
        opp = self.scan(
            input_mint=input_mint,
            output_mint=output_mint,
            amount=amount,
            reference_out=reference_out,
        )
        if not opp.ok:
            return {"ok": False, "opportunity": opp.to_dict(), "executed": None}
        executed = self.execute_if_fresh(opp, force_paper=force_paper)
        return {"ok": bool(executed.get("ok")), "opportunity": opp.to_dict(), "executed": executed}
