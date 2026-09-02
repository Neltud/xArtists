"""
$TRO creator rewards — locked product decisions:
- creator = collection issuer/owner (must match)
- 5 TRO after first physical mint (not bare issue)
- 1 TRO on first sale (buyNft/acceptBid), not mint/list
- pool 50k, mode pro manual, incentives pocket reporting
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

# Locked triggers
COLLECTION_TRIGGER = "first_physical_mint"  # not issue alone
NFT_TRIGGER = "first_sale"  # buyNft | acceptBid


def mode() -> str:
    m = os.environ.get("TRO_REWARD_MODE", "standard").lower()
    return "pro" if m == "pro" else "standard"


def nft_cap() -> int:
    return CAP_PRO if mode() == "pro" else CAP_STANDARD


def is_physical_eligible(meta: dict[str, Any]) -> bool:
    t = str(meta.get("type") or meta.get("asset_type") or "").lower()
    if meta.get("physical") is True or meta.get("is_physical") is True:
        return True
    if t in ("physical", "phygital", "phygital_physical", "rwa_physical"):
        return True
    if mode() == "pro":
        return True
    return False


def resolve_creator(
    *,
    issuer: Optional[str] = None,
    owner: Optional[str] = None,
    studio_declared: Optional[str] = None,
    minter: Optional[str] = None,
) -> tuple[Optional[str], str]:
    """Prefer issuer/owner; studio must match; else reject."""
    primary = (issuer or owner or "").strip()
    if not primary:
        primary = (minter or "").strip()
    if not primary:
        return None, "no issuer/owner/minter"
    if studio_declared and studio_declared.strip().lower() != primary.lower():
        return None, "studio_declared mismatch issuer"
    return primary, "ok"


@dataclass
class RewardEvent:
    kind: str
    collection_id: str
    creator: str
    nft_id: Optional[str]
    amount_tro: float
    physical: bool
    mode: str
    ts: str
    status: str
    reason: str = ""
    trigger: str = ""


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
            "reporting_pocket": "incentives",
        },
    )
    st["mode"] = mode()
    st["cap_per_collection_nft"] = nft_cap()
    st["reporting_pocket"] = "incentives"
    st["triggers"] = {
        "collection": COLLECTION_TRIGGER,
        "nft": NFT_TRIGGER,
    }
    return st


def ledger() -> dict[str, Any]:
    return _load_json(
        LEDGER,
        {"version": "1.1", "token": TRO_TOKEN, "events": [], "by_collection": {}},
    )


def _collection_stats(led: dict, collection_id: str) -> dict[str, Any]:
    bc = led.setdefault("by_collection", {})
    return bc.setdefault(
        collection_id,
        {
            "collection_rewarded": False,
            "first_physical_mint_seen": False,
            "nft_rewarded_count": 0,
            "sold_nft_ids": [],
            "total_tro": 0.0,
        },
    )


def on_physical_mint(
    *,
    collection_id: str,
    nft_id: str,
    issuer: Optional[str] = None,
    owner: Optional[str] = None,
    studio_declared: Optional[str] = None,
    minter: Optional[str] = None,
    meta: Optional[dict[str, Any]] = None,
) -> list[RewardEvent]:
    """
    Call on each physical mint. Awards 5 TRO once when first physical mint observed.
    Does NOT award 1 TRO (that is first_sale only).
    """
    meta = meta or {"physical": True}
    out: list[RewardEvent] = []
    creator, why = resolve_creator(
        issuer=issuer, owner=owner, studio_declared=studio_declared, minter=minter
    )
    ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    if not creator:
        out.append(
            RewardEvent(
                "collection",
                collection_id,
                "",
                nft_id,
                0,
                True,
                mode(),
                ts,
                "rejected",
                why,
                COLLECTION_TRIGGER,
            )
        )
        return out

    if not is_physical_eligible(meta) and mode() == "standard":
        out.append(
            RewardEvent(
                "collection",
                collection_id,
                creator,
                nft_id,
                0,
                False,
                mode(),
                ts,
                "rejected",
                "not physical",
                COLLECTION_TRIGGER,
            )
        )
        return out

    led = ledger()
    st = _collection_stats(led, collection_id)
    st["first_physical_mint_seen"] = True

    if st["collection_rewarded"]:
        _save(LEDGER, led)
        return out

    amount = REWARD_COLLECTION
    pool = pool_state()
    if float(pool["pool_remaining_tro"]) < amount:
        ev = RewardEvent(
            "collection",
            collection_id,
            creator,
            nft_id,
            amount,
            True,
            mode(),
            ts,
            "rejected",
            "pool empty",
            COLLECTION_TRIGGER,
        )
        led["events"].append(asdict(ev))
        _save(LEDGER, led)
        out.append(ev)
        return out

    live = os.environ.get("TRO_REWARDS_LIVE", "0") == "1" and os.environ.get(
        "LIA_LIVE_TRADING", "0"
    ) == "1"
    status = "queued" if live else "paper"
    st["collection_rewarded"] = True
    st["total_tro"] = float(st["total_tro"]) + amount
    pool["pool_remaining_tro"] = float(pool["pool_remaining_tro"]) - amount
    pool["distributed_tro"] = float(pool.get("distributed_tro") or 0) + amount
    ev = RewardEvent(
        "collection",
        collection_id,
        creator,
        nft_id,
        amount,
        True,
        mode(),
        ts,
        status,
        "first physical mint",
        COLLECTION_TRIGGER,
    )
    led["events"].append(asdict(ev))
    _save(LEDGER, led)
    _save(POOL_STATE, pool)
    out.append(ev)
    return out


def on_first_sale(
    *,
    collection_id: str,
    nft_id: str,
    issuer: Optional[str] = None,
    owner: Optional[str] = None,
    studio_declared: Optional[str] = None,
    meta: Optional[dict[str, Any]] = None,
    sale_tx: str = "",
) -> RewardEvent:
    """Award 1 TRO on first successful buyNft/acceptBid for this nft_id."""
    meta = meta or {}
    physical = is_physical_eligible(meta)
    ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    creator, why = resolve_creator(
        issuer=issuer, owner=owner, studio_declared=studio_declared
    )
    led = ledger()
    st = _collection_stats(led, collection_id)

    if not creator:
        ev = RewardEvent(
            "nft", collection_id, "", nft_id, 0, physical, mode(), ts, "rejected", why, NFT_TRIGGER
        )
        led["events"].append(asdict(ev))
        _save(LEDGER, led)
        return ev

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
            "digital not eligible",
            NFT_TRIGGER,
        )
        led["events"].append(asdict(ev))
        _save(LEDGER, led)
        return ev

    sold = list(st.get("sold_nft_ids") or [])
    if nft_id in sold:
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
            "already sold-rewarded",
            NFT_TRIGGER,
        )

    if int(st["nft_rewarded_count"]) >= nft_cap():
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
            f"cap {nft_cap()}",
            NFT_TRIGGER,
        )
        led["events"].append(asdict(ev))
        _save(LEDGER, led)
        return ev

    amount = REWARD_PER_NFT
    pool = pool_state()
    if float(pool["pool_remaining_tro"]) < amount:
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
            NFT_TRIGGER,
        )
        led["events"].append(asdict(ev))
        _save(LEDGER, led)
        return ev

    live = os.environ.get("TRO_REWARDS_LIVE", "0") == "1" and os.environ.get(
        "LIA_LIVE_TRADING", "0"
    ) == "1"
    status = "queued" if live else "paper"
    sold.append(nft_id)
    st["sold_nft_ids"] = sold[-2000:]
    st["nft_rewarded_count"] = int(st["nft_rewarded_count"]) + 1
    st["total_tro"] = float(st["total_tro"]) + amount
    pool["pool_remaining_tro"] = float(pool["pool_remaining_tro"]) - amount
    pool["distributed_tro"] = float(pool.get("distributed_tro") or 0) + amount
    ev = RewardEvent(
        "nft",
        collection_id,
        creator,
        nft_id,
        amount,
        physical,
        mode(),
        ts,
        status,
        f"first sale {sale_tx}".strip(),
        NFT_TRIGGER,
    )
    led["events"].append(asdict(ev))
    _save(LEDGER, led)
    _save(POOL_STATE, pool)
    return ev


def estimate_business(
    *,
    n_collections: int = 20,
    sales_per_collection: int = 50,
    tro_price_usd: float = 0.01,
    reward_mode: str = "standard",
) -> dict[str, Any]:
    """Cost model under first_sale trigger (sales not mints)."""
    cap = CAP_PRO if reward_mode == "pro" else CAP_STANDARD
    nfts_rewarded = min(sales_per_collection, cap) * n_collections
    total = n_collections * REWARD_COLLECTION + nfts_rewarded * REWARD_PER_NFT
    return {
        "mode": reward_mode,
        "trigger_nft": NFT_TRIGGER,
        "trigger_collection": COLLECTION_TRIGGER,
        "n_collections": n_collections,
        "sales_per_collection": sales_per_collection,
        "nfts_rewarded": nfts_rewarded,
        "tro_out": total,
        "usd_cost": total * tro_price_usd,
        "kpi_v1": "physical_collections_with_ge_1_sale",
    }


def publish_status() -> Path:
    data = {
        "updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "mode": mode(),
        "nft_cap": nft_cap(),
        "triggers": {"collection": COLLECTION_TRIGGER, "nft": NFT_TRIGGER},
        "creator_resolution": "issuer_or_owner_match_studio",
        "reporting_pocket": "incentives",
        "pool": pool_state(),
        "kpi_v1": "physical_collections_with_ge_1_sale",
        "pro_activation": "manual",
        "estimates": {
            "soft": estimate_business(20, 50, 0.01, mode()),
            "soft_p10c": estimate_business(20, 50, 0.10, mode()),
        },
    }
    path = ROOT / "data" / "tro_rewards_status.json"
    _save(path, data)
    return path


if __name__ == "__main__":
    print(json.dumps(estimate_business(), indent=2))
    print("status", publish_status())
