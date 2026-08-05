"""
Ad auction V1 — off-chain bids + treasury memo payment.
Vellum/ops selects winner → ads_active.json for frontend AdSlot.
"""
from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any, Optional

_ROOT = Path(__file__).resolve().parents[2]
BIDS_PATH = _ROOT / "data" / "ads_bids.json"
ACTIVE_PATH = _ROOT / "data" / "ads_active.json"
AUCTIONS_PATH = _ROOT / "data" / "ads_auctions.json"

SLOT_IDS = ("home_hero", "market_sidebar", "studio_banner", "drop_feature")

# Treasury destination for V1 memo payments (Mission)
TREASURY_MISSION = "erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6"

ALLOWED_CATEGORIES = {"art", "drop", "event", "creative_tool"}


def memo_for_bid(slot: str, period: str) -> str:
    return f"ad-bid:{slot}:{period}"


def record_bid(
    *,
    slot: str,
    advertiser: str,
    amount_egld: float,
    period: str,
    title: str,
    image_cid: str = "",
    href: str = "",
    paid_tx: str = "",
    category: str = "art",
) -> dict[str, Any]:
    if slot not in SLOT_IDS:
        return {"ok": False, "error": f"slot must be one of {SLOT_IDS}"}
    if category not in ALLOWED_CATEGORIES:
        return {"ok": False, "error": "category not allowed"}
    if amount_egld <= 0:
        return {"ok": False, "error": "amount > 0"}
    if not advertiser.startswith("erd1"):
        return {"ok": False, "error": "advertiser erd1"}
    if href and not (href.startswith("https://") or href.startswith("/")):
        return {"ok": False, "error": "href must be https or relative"}

    bid = {
        "id": f"bid-{int(time.time())}-{advertiser[-6:]}",
        "slot": slot,
        "period": period,
        "advertiser": advertiser,
        "amount_egld": float(amount_egld),
        "title": title[:120],
        "image_cid": image_cid,
        "href": href,
        "paid_tx": paid_tx,
        "category": category,
        "memo": memo_for_bid(slot, period),
        "treasury": TREASURY_MISSION,
        "ts": time.time(),
        "status": "pending_review" if paid_tx else "intent",
    }
    data = _load_bids()
    data.append(bid)
    _write_bids(data)
    return {"ok": True, "bid": bid, "pay_to": TREASURY_MISSION, "memo": bid["memo"]}


def select_winner(slot: str, period: str, bid_id: str) -> dict[str, Any]:
    data = _load_bids()
    winner = None
    for b in data:
        if b.get("id") == bid_id and b.get("slot") == slot and b.get("period") == period:
            b["status"] = "won"
            winner = b
        elif b.get("slot") == slot and b.get("period") == period and b.get("status") == "pending_review":
            b["status"] = "lost"
    if not winner:
        return {"ok": False, "error": "bid not found"}
    _write_bids(data)
    return {"ok": True, "winner": winner}


def publish_active_ad(
    *,
    slot: str,
    advertiser: str,
    title: str,
    starts_at: str,
    ends_at: str,
    image_cid: str = "",
    image_url: str = "",
    href: str = "",
    paid_tx: str = "",
    bid_egld: float = 0,
) -> dict[str, Any]:
    if slot not in SLOT_IDS:
        return {"ok": False, "error": "invalid slot"}
    active = _load_active()
    slots = dict(active.get("slots") or {})
    slots[slot] = {
        "slot": slot,
        "advertiser": advertiser,
        "title": title[:120],
        "imageCid": image_cid,
        "imageUrl": image_url or (f"https://ipfs.io/ipfs/{image_cid.replace('ipfs://', '')}" if image_cid else ""),
        "href": href,
        "startsAt": starts_at,
        "endsAt": ends_at,
        "paidTx": paid_tx,
        "status": "active",
        "bidEgld": bid_egld,
    }
    active["slots"] = slots
    active["updated"] = time.time()
    ACTIVE_PATH.parent.mkdir(parents=True, exist_ok=True)
    ACTIVE_PATH.write_text(json.dumps(active, indent=2) + "\n", encoding="utf-8")
    # mirror for Pages if public/data used
    pub = _ROOT / "apps" / "frontend" / "public" / "data" / "ads_active.json"
    try:
        pub.parent.mkdir(parents=True, exist_ok=True)
        pub.write_text(json.dumps(active, indent=2) + "\n", encoding="utf-8")
    except OSError:
        pass
    return {"ok": True, "slot": slots[slot]}


def treasury_split(amount_egld: float) -> dict[str, float]:
    return {
        "mission": round(amount_egld * 0.50, 6),
        "reserve": round(amount_egld * 0.25, 6),
        "ops": round(amount_egld * 0.15, 6),
        "stakers_p2": round(amount_egld * 0.10, 6),
    }


def _load_bids() -> list[dict[str, Any]]:
    if not BIDS_PATH.exists():
        return []
    try:
        return list(json.loads(BIDS_PATH.read_text(encoding="utf-8")).get("bids") or [])
    except json.JSONDecodeError:
        return []


def _write_bids(rows: list[dict[str, Any]]) -> None:
    BIDS_PATH.parent.mkdir(parents=True, exist_ok=True)
    BIDS_PATH.write_text(
        json.dumps({"updated": time.time(), "bids": rows[-500:]}, indent=2) + "\n",
        encoding="utf-8",
    )


def _load_active() -> dict[str, Any]:
    if not ACTIVE_PATH.exists():
        return {"updated": 0, "slots": {}}
    try:
        return json.loads(ACTIVE_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {"updated": 0, "slots": {}}


if __name__ == "__main__":
    print(record_bid(
        slot="home_hero",
        advertiser="erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4af",
        amount_egld=1.0,
        period="2026-w33",
        title="Drop demo",
        category="drop",
    ))
