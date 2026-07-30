"""
Vellum integration nodes for LIA v6
===================================
Call these from a Vellum Code / Python node (or subprocess on a runner that has the repo).

Nodes:
  1) gate_cycle      — confidence / max trades / fee vs edge
  2) trailing_tick   — update dynamic stops; return STOP actions
  3) append_trade    — append to data/lia_trades.json
  4) persist_all     — trailing state + trades ready for GitHub push

Vellum wiring (suggested):
  Timer → Fetch prices → gate_cycle → [if EXEC] signal → open/trail
       → trailing_tick on open positions → if STOP → UniversalExecutor close
       → append_trade → push data/*.json to GitHub (existing reporter)
"""
from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any, Optional

ROOT = Path(__file__).resolve().parents[2]
TRADES_PATH = ROOT / "data" / "lia_trades.json"
TRAIL_PATH = ROOT / "data" / "lia_trailing_state.json"


def _load_json(path: Path, default: Any) -> Any:
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return default


def _save_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def gate_cycle(
    *,
    confidence: float,
    decision: str,
    size_usd: float,
    estimated_fee_usd: float,
    expected_edge_usd: float,
    trades_today: int,
    max_trades_per_day: int = 3,
    min_confidence: float = 0.65,
    min_size_usd: float = 8.0,
) -> dict[str, Any]:
    """Return {ok, reason, action}. action EXEC | SKIP."""
    if decision.upper() == "WAIT":
        return {"ok": True, "action": "SKIP", "reason": "decision_wait"}
    if confidence < min_confidence:
        return {"ok": True, "action": "SKIP", "reason": f"confidence {confidence} < {min_confidence}"}
    if trades_today >= max_trades_per_day:
        return {"ok": True, "action": "SKIP", "reason": "max_trades_day"}
    if size_usd < min_size_usd:
        return {"ok": True, "action": "SKIP", "reason": "size_below_min"}
    if expected_edge_usd > 0 and estimated_fee_usd > 0.15 * expected_edge_usd:
        return {"ok": True, "action": "SKIP", "reason": "fee_gt_15pct_edge"}
    return {"ok": True, "action": "EXEC", "reason": "gates_passed"}


def trailing_tick(
    *,
    token: str,
    price: float,
    atr: Optional[float] = None,
) -> dict[str, Any]:
    """Run dynamic trailing on all open positions for token."""
    import sys

    if str(ROOT) not in sys.path:
        sys.path.insert(0, str(ROOT))
    from lia.risk.trailing_stop import DynamicTrailingStopManager

    mgr = DynamicTrailingStopManager(str(TRAIL_PATH))
    mgr.load()
    results = mgr.on_price_by_token(token, price, atr)
    mgr.persist()
    stops = [r for r in results if r.get("action") == "STOP"]
    return {
        "ok": True,
        "results": results,
        "stop_ids": [r.get("id") for r in stops],
        "should_close": len(stops) > 0,
    }


def open_trailing_position(
    *,
    trade_id: str,
    token: str,
    entry: float,
    size_usd: float,
    side: str = "LONG",
    atr: float = 0.0,
    trail_pct: float = 0.08,
) -> dict[str, Any]:
    import sys

    if str(ROOT) not in sys.path:
        sys.path.insert(0, str(ROOT))
    from lia.risk.trailing_stop import DynamicTrailingStopManager

    mgr = DynamicTrailingStopManager(str(TRAIL_PATH))
    mgr.load()
    pos = mgr.open(
        id=trade_id,
        token=token,
        entry=entry,
        size_usd=size_usd,
        side=side,
        atr=atr,
        trail_pct=trail_pct,
        trail_mode="hybrid",
    )
    mgr.persist()
    return {"ok": True, "position": pos.to_dict()}


def append_trade(trade: dict[str, Any]) -> dict[str, Any]:
    """Append one trade record for dashboard."""
    data = _load_json(TRADES_PATH, {"updated": None, "trades": []})
    trades = data.get("trades") or []
    trade = {
        **trade,
        "ts": trade.get("ts") or time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    trades.insert(0, trade)
    data["trades"] = trades[:200]
    data["updated"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    _save_json(TRADES_PATH, data)
    return {"ok": True, "n": len(data["trades"])}


def node_dispatch(name: str, payload: dict[str, Any]) -> dict[str, Any]:
    """Single entry for Vellum generic Python node."""
    if name == "gate_cycle":
        return gate_cycle(**payload)
    if name == "trailing_tick":
        return trailing_tick(**payload)
    if name == "open_trailing":
        return open_trailing_position(**payload)
    if name == "append_trade":
        return append_trade(payload.get("trade") or payload)
    return {"ok": False, "error": f"unknown node {name}"}


if __name__ == "__main__":
    print(gate_cycle(confidence=0.7, decision="BUY", size_usd=12, estimated_fee_usd=0.2, expected_edge_usd=2.0, trades_today=0))
    print(append_trade({"id": "demo", "pair": "TRO/WEGLD", "side": "BUY", "status": "OPEN", "size_usd": 12}))
