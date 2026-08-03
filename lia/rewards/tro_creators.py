"""
$TRO creator rewards — LIA/Vellum.
Standard: physical only, 5 TRO/collection + 1 TRO/NFT up to 500.
Pro: digital+physical, cap 10_000 NFT/collection.
"""
from __future__ import annotations

import json
import os
import time
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any, Optional

ROOT = Path(__file__).resolve().parents[2]
LEDGER = ROOT / "data" / "tro_rewards_ledger.json"
POOL_STATE = ROOT / "data" / "tro_reward_pool.json"

TRO_TOKEN = os.environ.get("TRO_TOKEN_ID", "TRO-94c925")
REWARD_COLLECTION = 5.0
REWARD_PER_NFT = 1.0
CAP_STANDARD = 500
CAP_PRO = 10_000


def mode() -> str:
    m = os.environ.get("TRO_REWARD_MODE", "standard").lower()
    return "pro" if m == "pro" else "standard"


def nft_cap() -> int:
    return CAP_PRO if mode() == "pro" else CAP_STANDARD


def is_physical_eligible(meta: dict[str, Any]) -> bool:
    """Standard mode: only physical / phygital-with-physical."""
    t = str(meta.get("type") or meta.get("asset_type") or "").lower()
    if meta.get("physical") is True or meta.get("is_physical") is True:
        return True
    if t in ("physical", "phygital", "phygital_physical", "rwa_physical"):
        return True
    if mode() == "pro":
        return True  # pro accepts digital too
    return False


@dataclass
class RewardEvent:
    kind: str  # collection | nft
    collection_id: str
    creator: str
    nft_id: Optional[str]
    amount_tro: float
    physical: bool
    mode: str
    ts: str
    status: str  # queued | paper | sent | rejected
    reason: str = ""


def _load_json(path: Path, default: Any) -> Any:
    if path.exists():
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            pass
    return default


def _save(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")


def pool_state() -> dict[str, Any]:
    st = _load_json(
        POOL_STATE,
        {
            "pool_remaining_tro": float(os.environ.get("TRO_REWARD_POOL", "50000")),
            "distributed_tro": 0.0,
            "mode": mode(),
            "cap_per_collection_nft": nft_cap(),
        },
    )
    st["mode"] = mode()
    st["cap_per_collection_nft"] = nft_cap()
    return st


def ledger() -> dict[str, Any]:
    return _load_json(
        LEDGER,
        {
            "version": "1",
            "token": TRO_TOKEN,
            "events": [],
            "by_collection": {},
        },
    )


def _collection_stats(led: dict, collection_id: str) -> dict[str, Any]:
    bc = led.setdefault("by_collection", {})
    return bc.setdefault(
        collection_id,
        {"collection_rewarded": False, "nft_rewarded_count": 0, "total_tro": 0.0},
    )


def queue_collection_reward(
    *,
    collection_id: str,
    creator: str,
    meta: Optional[dict[str, Any]] = None,
) -> RewardEvent:
    meta = meta or {}
    physical = is_physical_eligible(meta)
    ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    led = ledger()
    st = _collection_stats(led, collection_id)

    if not physical and mode() == "standard":
        ev = RewardEvent(
            "collection",
            collection_id,
            creator,
            None,
            0,
            False,
            mode(),
            ts,
            "rejected",
            "digital not eligible in standard mode",
        )
        led["events"].append(asdict(ev))
        _save(LEDGER, led)
        return ev

    if st["collection_rewarded"]:
        ev = RewardEvent(
            "collection",
            collection_id,
            creator,
            None,
            0,
            physical,
            mode(),
            ts,
            "rejected",
            "already rewarded",
        )
        led["events"].append(asdict(ev))
        _save(LEDGER, led)
        return ev

    amount = REWARD_COLLECTION
    pool = pool_state()
    if pool["pool_remaining_tro"] < amount:
        ev = RewardEvent(
            "collection",
            collection_id,
            creator,
            None,
            amount,
            physical,
            mode(),
            ts,
            "rejected",
            "pool empty",
        )
        led["events"].append(asdict(ev))
        _save(LEDGER, led)
        return ev

    live = os.environ.get("TRO_REWARDS_LIVE", "0") == "1" and os.environ.get(
        "LIA_LIVE_TRADING", "0"
    ) == "1"
    status = "queued" if live else "paper"
    st["collection_rewarded"] = True
    st["total_tro"] = float(st["total_tro"]) + amount
    pool["pool_remaining_tro"] = float(pool["pool_remaining_tro"]) - amount
    pool["distributed_tro"] = float(pool.get("distributed_tro") or 0) + amount
    ev = RewardEvent(
        "collection", collection_id, creator, None, amount, physical, mode(), ts, status
    )
    led["events"].append(asdict(ev))
    _save(LEDGER, led)
    _save(POOL_STATE, pool)
    return ev


def queue_nft_reward(
    *,
    collection_id: str,
    creator: str,
    nft_id: str,
    meta: Optional[dict[str, Any]] = None,
) -> RewardEvent:
    meta = meta or {}
    physical = is_physical_eligible(meta)
    ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    led = ledger()
    st = _collection_stats(led, collection_id)
    cap = nft_cap()

    if not physical and mode() == "standard":
        ev = RewardEvent(
            "nft",
            collection_id,
            creator,
            nft_id,
            0,
            False,
            mode(),
            ts,
            "rejected",
            "digital not eligible in standard mode",
        )
        led["events"].append(asdict(ev))
        _save(LEDGER, led)
        return ev

    if int(st["nft_rewarded_count"]) >= cap:
        ev = RewardEvent(
            "nft",
            collection_id,
            creator,
            nft_id,
            0,
            physical,
            mode(),
            ts,
            "rejected",
            f"cap {cap} reached",
        )
        led["events"].append(asdict(ev))
        _save(LEDGER, led)
        return ev

    # de-dup nft_id
    for e in led.get("events") or []:
        if e.get("kind") == "nft" and e.get("nft_id") == nft_id and e.get("status") in (
            "paper",
            "queued",
            "sent",
        ):
            return RewardEvent(
                "nft",
                collection_id,
                creator,
                nft_id,
                0,
                physical,
                mode(),
                ts,
                "rejected",
                "duplicate nft",
            )

    amount = REWARD_PER_NFT
    pool = pool_state()
    if pool["pool_remaining_tro"] < amount:
        ev = RewardEvent(
            "nft",
            collection_id,
            creator,
            nft_id,
            amount,
            physical,
            mode(),
            ts,
            "rejected",
            "pool empty",
        )
        led["events"].append(asdict(ev))
        _save(LEDGER, led)
        return ev

    live = os.environ.get("TRO_REWARDS_LIVE", "0") == "1" and os.environ.get(
        "LIA_LIVE_TRADING", "0"
    ) == "1"
    status = "queued" if live else "paper"
    st["nft_rewarded_count"] = int(st["nft_rewarded_count"]) + 1
    st["total_tro"] = float(st["total_tro"]) + amount
    pool["pool_remaining_tro"] = float(pool["pool_remaining_tro"]) - amount
    pool["distributed_tro"] = float(pool.get("distributed_tro") or 0) + amount
    ev = RewardEvent(
        "nft", collection_id, creator, nft_id, amount, physical, mode(), ts, status
    )
    led["events"].append(asdict(ev))
    _save(LEDGER, led)
    _save(POOL_STATE, pool)
    return ev


def estimate_business(
    *,
    n_collections: int = 20,
    nfts_per_collection: int = 100,
    tro_price_usd: float = 0.01,
    reward_mode: str = "standard",
) -> dict[str, Any]:
    cap = CAP_PRO if reward_mode == "pro" else CAP_STANDARD
    nfts_rewarded = min(nfts_per_collection, cap) * n_collections
    col_tro = n_collections * REWARD_COLLECTION
    nft_tro = nfts_rewarded * REWARD_PER_NFT
    total = col_tro + nft_tro
    return {
        "mode": reward_mode,
        "n_collections": n_collections,
        "nfts_per_collection": nfts_per_collection,
        "cap": cap,
        "nfts_rewarded": nfts_rewarded,
        "tro_out": total,
        "usd_cost": total * tro_price_usd,
        "tro_price_usd": tro_price_usd,
        "note": "Cost to LIA pool only — offset by marketplace fees + trading",
    }


def publish_status() -> Path:
    data = {
        "updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "mode": mode(),
        "nft_cap": nft_cap(),
        "pool": pool_state(),
        "estimates": {
            "soft_launch": estimate_business(20, 100, 0.01, mode()),
            "soft_launch_p10c": estimate_business(20, 100, 0.10, mode()),
        },
        "rules": {
            "collection_tro": REWARD_COLLECTION,
            "per_nft_tro": REWARD_PER_NFT,
            "physical_only_standard": mode() == "standard",
        },
    }
    path = ROOT / "data" / "tro_rewards_status.json"
    _save(path, data)
    return path


if __name__ == "__main__":
    print(json.dumps(estimate_business(), indent=2))
    print("status", publish_status())
