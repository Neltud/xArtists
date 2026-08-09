"""Hooks: after trade settle → adaptive lock + path status refresh."""
from __future__ import annotations

from typing import Any, Optional

from lia.circuit.million_path import settle_win, path_status, size_for_path, phase_for
from lia.risk.profit_lock import ProfitLedger, credit_for_equity


def after_trade_close(
    *,
    net_pnl_usd: float,
    equity_usd: float,
    ledger: Optional[ProfitLedger] = None,
    persist_ledger: bool = True,
    publish_path: bool = True,
) -> dict[str, Any]:
    led = ledger or ProfitLedger.load()
    if net_pnl_usd > 0:
        credit_for_equity(led, net_pnl_usd, equity_usd)
    elif net_pnl_usd < 0:
        led.lifetime_realized_net += net_pnl_usd
    if persist_ledger:
        led.save()
    out: dict[str, Any] = {
        "settlement": settle_win(net_pnl_usd, equity_usd, ledger=None),
        "ledger": led.to_dict(),
        "next_size": size_for_path(max(0.0, equity_usd + max(0.0, net_pnl_usd) * 0.3)),
        "phase": phase_for(equity_usd).value,
    }
    if publish_path:
        try:
            from lia.board.publish_path import publish

            out["path_publish"] = publish(equity_usd + max(0.0, net_pnl_usd))
        except Exception as e:
            out["path_publish_error"] = str(e)
    return out
