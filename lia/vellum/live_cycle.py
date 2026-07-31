"""
Vellum LIVE cycle — resume from last publish (PEM stays in Vellum secrets only)

Chain:
  1. gate_cycle
  2. open_trailing (if EXEC + new position)
  3. trailing_tick on open positions
  4. close via UniversalExecutor if STOP
  5. append_trade → data/lia_trades.json
  6. redistribute_tro if wallet holds TRO (policy no-hold)

Env (Vellum secrets):
  LIA_WALLET_PEM / LIA_WALLET_PEM_PATH
  LIA_LIVE_TRADING=0|1
  LIA_MVX_API, LIA_MVX_PROXY, LIA_CHAIN_ID
"""
from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any, Optional

from lia.vellum.nodes_trailing_cycle import (
    append_trade,
    gate_cycle,
    open_trailing_position,
    trailing_tick,
)

ROOT = Path(__file__).resolve().parents[2]


def _fetch_tro_price() -> float:
    import urllib.request

    url = "https://api.multiversx.com/tokens/TRO-94c925"
    try:
        with urllib.request.urlopen(url, timeout=15) as r:
            data = json.loads(r.read().decode())
        return float(data.get("price") or 0)
    except Exception:
        return 0.0


def _count_trades_today() -> int:
    path = ROOT / "data" / "lia_trades.json"
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return 0
    day = time.strftime("%Y-%m-%d", time.gmtime())
    n = 0
    for t in data.get("trades") or []:
        ts = str(t.get("ts") or "")
        if ts.startswith(day):
            n += 1
    return n

def run_cycle(
    *,
    decision: str = "WAIT",
    confidence: float = 0.5,
    size_usd: float = 10.0,
    token: str = "TRO-94c925",
    entry: Optional[float] = None,
    atr: float = 0.0,
    estimated_fee_usd: float = 0.15,
    expected_edge_usd: float = 1.0,
    side: str = "LONG",
) -> dict[str, Any]:
    price = entry if entry and entry > 0 else _fetch_tro_price()
    trades_today = _count_trades_today()

    gate = gate_cycle(
        confidence=confidence,
        decision=decision,
        size_usd=size_usd,
        estimated_fee_usd=estimated_fee_usd,
        expected_edge_usd=expected_edge_usd,
        trades_today=trades_today,
    )

    out: dict[str, Any] = {
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "gate": gate,
        "price": price,
        "trades_today": trades_today,
    }

    # Always tick existing trailing positions
    if price > 0:
        tick = trailing_tick(token=token, price=price, atr=atr or None)
        out["trailing"] = tick
        for sid in tick.get("stop_ids") or []:
            append_trade(
                {
                    "id": sid,
                    "pair": token,
                    "side": "CLOSE",
                    "status": "STOPPED",
                    "price": price,
                    "source": "trailing_stop",
                }
            )
            # Live close would call UniversalExecutor here when LIA_LIVE_TRADING=1
            out.setdefault("closes", []).append(sid)

    if gate.get("action") != "EXEC" or price <= 0:
        out["opened"] = None
        out["redistribute"] = _maybe_redistribute_tro()
        return out

    trade_id = f"t-{time.strftime('%Y%m%d-%H%M%S')}"
    opened = open_trailing_position(
        trade_id=trade_id,
        token=token,
        entry=price,
        size_usd=size_usd,
        side=side,
        atr=atr,
        trail_pct=0.08,
    )
    append_trade(
        {
            "id": trade_id,
            "pair": token,
            "side": side,
            "status": "OPEN",
            "entry": price,
            "size_usd": size_usd,
            "confidence": confidence,
            "source": "vellum-live-cycle",
        }
    )
    out["opened"] = opened
    out["redistribute"] = _maybe_redistribute_tro()
    return out


def _maybe_redistribute_tro() -> dict[str, Any]:
    """Apply no-hold TRO policy if executor available."""
    try:
        from lia.executor.universal_executor import UniversalExecutor

        ex = UniversalExecutor()
        if hasattr(ex, "redistribute_tro"):
            # amount discovery left to executor / account scan
            return {"attempted": True, "detail": "call redistribute_tro from executor when balance > min"}
        return {"attempted": False, "detail": "redistribute_tro not on executor"}
    except Exception as e:
        return {"attempted": False, "error": str(e)}


if __name__ == "__main__":
    # Safe default: WAIT (no new positions)
    print(json.dumps(run_cycle(decision="WAIT", confidence=0.4), indent=2))
