"""Jupiter (Solana) Vellum executor node."""
from __future__ import annotations

from typing import Any

from vellum.workflows import BaseNode

from lia.executor.jupiter_solana import JupiterExecutor


class JupiterExecutorNode(BaseNode):
    force_mode: str = "paper"
    input_mint: str = "SOL"
    output_mint: str = "USDC"
    amount: int = 10_000_000  # lamports / smallest units
    amount_usd: float = 0.0
    slippage_bps: int = 50
    side: str = "sell"  # sell input→output ; buy flips USDC→token

    class Outputs(BaseNode.Outputs):
        ok: bool
        mode: str
        tx_sig: str
        in_amount: str
        out_amount: str
        price_impact_pct: float
        route: str
        detail: str
        health: dict[str, Any]

    class Display(BaseNode.Display):
        icon = "vellum:icon:function"
        color = "green"

    def run(self) -> "JupiterExecutorNode.Outputs":
        ex = JupiterExecutor()
        inp, out = self.input_mint, self.output_mint
        if self.side.lower() == "buy":
            inp, out = "USDC", self.output_mint if self.output_mint != "USDC" else self.input_mint

        amount = int(self.amount)
        if self.amount_usd > 0 and "USDC" in inp.upper():
            amount = int(self.amount_usd * 1_000_000)

        paper = self.force_mode != "live"
        res = ex.execute_swap(
            input_mint=inp,
            output_mint=out,
            amount=amount,
            slippage_bps=int(self.slippage_bps),
            force_paper=paper,
        )
        self._log("INFO", f"🪐 Jupiter {res.mode} ok={res.ok} {res.detail}")
        return self.Outputs(
            ok=res.ok,
            mode=res.mode,
            tx_sig=res.tx_sig or "",
            in_amount=res.in_amount or "",
            out_amount=res.out_amount or "",
            price_impact_pct=float(res.price_impact_pct or 0),
            route=res.route or "",
            detail=res.detail,
            health=ex.health(),
        )

    def _log(self, severity: str, message: str) -> None:
        self._context.emit_log_event(severity=severity, message=message)
