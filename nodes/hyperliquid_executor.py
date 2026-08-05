"""Hyperliquid Vellum executor node."""
from __future__ import annotations

from typing import Any

from vellum.workflows import BaseNode

from lia.executor.hyperliquid_exec import HyperliquidExecutor


class HyperliquidExecutorNode(BaseNode):
    force_mode: str = "paper"
    coin: str = "BTC"
    is_buy: bool = True
    size: float = 0.001
    amount_usd: float = 0.0
    price: float = 0.0
    order_type: str = "limit"  # limit | market
    tif: str = "Gtc"
    reduce_only: bool = False

    class Outputs(BaseNode.Outputs):
        ok: bool
        mode: str
        order_id: str
        status: str
        detail: str
        mid: float
        health: dict[str, Any]

    class Display(BaseNode.Display):
        icon = "vellum:icon:function"
        color = "blue"

    def run(self) -> "HyperliquidExecutorNode.Outputs":
        ex = HyperliquidExecutor()
        mid = ex.mid_price(self.coin) or 0.0
        size = float(self.size)
        if size <= 0 and self.amount_usd > 0 and mid > 0:
            size = self.amount_usd / mid

        paper = self.force_mode != "live"
        res = ex.place_order(
            coin=self.coin,
            is_buy=bool(self.is_buy),
            size=size,
            price=float(self.price) if self.price > 0 else None,
            order_type=self.order_type,
            tif=self.tif,
            reduce_only=bool(self.reduce_only),
            force_paper=paper,
        )
        self._log("INFO", f"📈 HL {self.coin} {res.mode} ok={res.ok} {res.detail}")
        return self.Outputs(
            ok=res.ok,
            mode=res.mode,
            order_id=res.order_id or "",
            status=res.status or "",
            detail=res.detail,
            mid=float(mid),
            health=ex.health(),
        )

    def _log(self, severity: str, message: str) -> None:
        self._context.emit_log_event(severity=severity, message=message)
