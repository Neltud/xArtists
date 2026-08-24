"""Soft-fail pipeline step for Vellum production_run."""
from __future__ import annotations
from typing import Any

def run_step(ctx: dict[str, Any] | None = None) -> dict[str, Any]:
    ctx = ctx or {}
    try:
        from lia.compounding.simulate_paper import run
        seed = ctx.get("compounding_seed", 42)
        n = int(ctx.get("compounding_legs", 10))
        payload = run(n_legs_per_echelon=n, seed=seed)
        agg = payload.get("aggregate") or {}
        return {
            "ok": True,
            "soft": True,
            "module": "compounding",
            "equity_usd": agg.get("equity_usd"),
            "net_pnl_usd": agg.get("net_pnl_usd"),
            "trades": agg.get("trades"),
            "win_rate": agg.get("win_rate"),
            "variance_pnl": agg.get("variance_pnl"),
        }
    except Exception as e:
        return {"ok": False, "soft": True, "module": "compounding", "error": str(e)}
