"""
Dynamic trailing stop — production wrapper around trailing_stop.py
==================================================================
Adds:
  - ATR auto-refresh
  - Slippage-aware stop execution price
  - Integration hooks for TradingStack / Secure TP
  - Batch mark-to-market for multi-position books
"""
from __future__ import annotations

from typing import Any, Optional

from lia.risk.slippage import effective_fill_price, recommended_slippage_bps
from lia.risk.trailing_stop import DynamicTrailingStopManager, DynamicPosition


class DynamicTrailService:
    def __init__(self, state_path: str = "data/lia_trailing_state.json"):
        self.mgr = DynamicTrailingStopManager(state_path=state_path)
        try:
            self.mgr.load()
        except Exception:
            pass

    def open_long(
        self,
        *,
        id: str,
        token: str,
        entry: float,
        size_usd: float,
        atr: float = 0.0,
        trail_pct: float = 0.06,
        atr_mult: float = 2.0,
        trail_mode: str = "hybrid",
        be_trigger_pct: float = 0.012,
        venue_id: str = "xexchange",
    ) -> dict[str, Any]:
        pos = self.mgr.open(
            id=id,
            token=token,
            entry=entry,
            size_usd=size_usd,
            side="LONG",
            atr=atr,
            trail_pct=trail_pct,
            atr_mult=atr_mult,
            trail_mode=trail_mode,
            be_trigger_pct=be_trigger_pct,
        )
        self.mgr.persist()
        return {
            "ok": True,
            "position": pos.to_dict(),
            "venue_id": venue_id,
            "initial_stop": pos.stop,
        }

    def mark(
        self,
        id: str,
        price: float,
        *,
        atr: Optional[float] = None,
        venue_id: str = "xexchange",
        size_usd: Optional[float] = None,
    ) -> dict[str, Any]:
        res = self.mgr.on_price(id, price, atr=atr)
        pos = self.mgr.positions.get(id)

        # If STOP, estimate realistic exit with slippage
        if res.get("action") == "STOP" and pos:
            notional = size_usd if size_usd is not None else pos.size_usd
            slip = recommended_slippage_bps(
                notional_usd=notional,
                venue_id=venue_id,
            )
            exit_px = effective_fill_price(
                price,
                side="sell" if pos.side.value == "LONG" else "buy",
                slippage_bps=slip["slippage_bps"],
            )
            res["exit_price_slippage_adj"] = exit_px
            res["slippage_bps"] = slip["slippage_bps"]
            if pos.entry > 0:
                if pos.side.value == "LONG":
                    res["realized_gross"] = (exit_px - pos.entry) / pos.entry
                else:
                    res["realized_gross"] = (pos.entry - exit_px) / pos.entry

        self.mgr.persist()
        return res

    def mark_book(
        self,
        marks: dict[str, float],
        *,
        atrs: Optional[dict[str, float]] = None,
    ) -> list[dict[str, Any]]:
        """marks: token -> price"""
        atrs = atrs or {}
        out: list[dict[str, Any]] = []
        for token, px in marks.items():
            out.extend(self.mgr.on_price_by_token(token, px, atr=atrs.get(token)))
        self.mgr.persist()
        return out

    def snapshot(self) -> dict[str, Any]:
        return {"positions": self.mgr.snapshot()}
