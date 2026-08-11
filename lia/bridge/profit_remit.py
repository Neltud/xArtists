"""
Solana (or other) profit → MultiversX treasury splitter workflow.

Paper by default. Live requires LIA_LIVE_TRADING=1 + gates + explicit LIA_BRIDGE_LIVE=1.
Does not execute Wormhole; emits outbox intents for ops/relayer.
"""

from __future__ import annotations

import json
import os
import time
import uuid
from pathlib import Path
from typing import Any, Dict, Optional

from lia.treasury.splitter_quote import quote_split

ROOT = Path(__file__).resolve().parents[2]
OUTBOX = ROOT / "data" / "bridge_outbox.json"

MAX_PER_TX = float(os.getenv("BRIDGE_MAX_PER_TX_USDC", "500"))
MAX_PER_DAY = float(os.getenv("BRIDGE_MAX_PER_DAY_USDC", "2000"))
MIN_PROFIT = float(os.getenv("BRIDGE_MIN_PROFIT_USDC", "50"))
LIVE = os.getenv("LIA_BRIDGE_LIVE", "0") == "1"
TRADING_LIVE = os.getenv("LIA_LIVE_TRADING", "0") == "1"


def _load_outbox() -> list:
    if not OUTBOX.exists():
        return []
    try:
        return json.loads(OUTBOX.read_text()).get("items", [])
    except Exception:
        return []


def _save_outbox(items: list) -> None:
    OUTBOX.parent.mkdir(parents=True, exist_ok=True)
    OUTBOX.write_text(
        json.dumps({"updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "items": items}, indent=2)
    )


def day_volume_usdc(items: list) -> float:
    day = time.strftime("%Y-%m-%d", time.gmtime())
    return sum(
        float(i.get("amount_usdc", 0))
        for i in items
        if str(i.get("ts", "")).startswith(day) and i.get("status") != "cancelled"
    )


def plan_remit(
    amount_usdc: float,
    source_chain: str = "solana",
    dest: str = "treasury_splitter",
    note: str = "",
) -> Dict[str, Any]:
    """Create a bridge intent. Never moves funds here."""
    if amount_usdc < MIN_PROFIT:
        return {"ok": False, "error": "below_min_profit", "min": MIN_PROFIT}
    if amount_usdc > MAX_PER_TX:
        return {"ok": False, "error": "above_max_per_tx", "max": MAX_PER_TX}

    items = _load_outbox()
    if day_volume_usdc(items) + amount_usdc > MAX_PER_DAY:
        return {"ok": False, "error": "above_max_per_day", "max": MAX_PER_DAY}

    if LIVE and not TRADING_LIVE:
        return {"ok": False, "error": "LIA_LIVE_TRADING required for LIA_BRIDGE_LIVE"}

    atomic = int(amount_usdc * 1_000_000)
    split = quote_split(atomic)

    intent = {
        "id": str(uuid.uuid4()),
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "source_chain": source_chain,
        "amount_usdc": amount_usdc,
        "dest": dest,
        "status": "pending" if not LIVE else "pending_live",
        "mode": "live" if LIVE and TRADING_LIVE else "paper",
        "split_template": split,
        "note": note,
    }
    items.append(intent)
    _save_outbox(items)
    return {"ok": True, "intent": intent}


def mark_completed(intent_id: str, tx_hash_mvx: Optional[str] = None) -> Dict[str, Any]:
    items = _load_outbox()
    for i in items:
        if i.get("id") == intent_id:
            i["status"] = "completed"
            i["tx_hash_mvx"] = tx_hash_mvx
            i["completed_ts"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            _save_outbox(items)
            return {"ok": True, "intent": i}
    return {"ok": False, "error": "not_found"}
