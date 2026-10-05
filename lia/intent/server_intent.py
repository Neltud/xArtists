"""
P1 — Unify Intent server → same shape as front intentFeed.

Front FeedItem fields: id, strategy, action, assetId, amount, confidence, reason, aura, paper, at
"""
from __future__ import annotations

import json
import time
import uuid
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"

AURA = {
    "BUY": "bull",
    "SELL": "bear",
    "HOLD": "stable",
    "STAKE": "reward",
    "COMPOUND": "reward",
}


def intent_from_sprint_decision(decision: dict[str, Any], *, leg_id: str | None = None) -> dict[str, Any]:
    action = str(decision.get("action") or "HOLD")
    return {
        "id": leg_id or str(uuid.uuid4())[:12],
        "strategy": f"SPRINT_L{decision.get('level', 1)}",
        "action": action,
        "assetId": str(decision.get("asset") or "EGLD"),
        "amount": float(decision.get("size_usd") or 0),
        "confidence": float(decision.get("confidence") or 0),
        "reason": str(decision.get("reason") or ""),
        "aura": AURA.get(action, "stable"),
        "paper": True,
        "at": int(time.time() * 1000),
        "source": "lia.shadow.sprint",
    }


def write_intent_snapshot(intent: dict[str, Any], *, max_keep: int = 40) -> Path:
    DATA.mkdir(parents=True, exist_ok=True)
    path = DATA / "lia_intent_feed.json"
    items: list[Any] = []
    if path.is_file():
        try:
            raw = json.loads(path.read_text(encoding="utf-8"))
            if isinstance(raw, dict) and isinstance(raw.get("items"), list):
                items = raw["items"]
            elif isinstance(raw, list):
                items = raw
        except Exception:
            items = []
    items.append(intent)
    items = items[-max_keep:]
    payload = {
        "schema": "lia_intent_feed/v1",
        "paper": True,
        "updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "items": items,
    }
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    for dest in (
        ROOT / "apps" / "frontend" / "public" / "data" / "lia_intent_feed.json",
        ROOT / "docs" / "data" / "lia_intent_feed.json",
    ):
        try:
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        except OSError:
            pass
    return path
