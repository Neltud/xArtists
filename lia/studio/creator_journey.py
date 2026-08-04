"""
Creator Studio journey — steps, gates, limited agent-NFT supply.

Differentiates:
  - LIA protocol content / board (not for sale as user pack)
  - Creator-minted art NFTs (Studio)
  - Limited sub-agent NFTs (packs sold, supply_cap)
"""
from __future__ import annotations

import json
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Optional

_ROOT = Path(__file__).resolve().parents[2]
JOURNEY_LOG = _ROOT / "data" / "studio_journey_log.json"

MAX_AGENT_NFT_SUPPLY_DEFAULT = 100  # limited editions per agent pack series


@dataclass
class JourneyStep:
    id: str
    title: str
    done: bool = False
    blocked: bool = False
    reason: str = ""
    href: str = ""


def creator_steps(
    *,
    wallet_connected: bool = False,
    ipfs_cid: str = "",
    collection_ready: bool = False,
    marketplace_deployed: bool = False,
    agents_deployed: bool = False,
) -> list[dict[str, Any]]:
    steps = [
        JourneyStep("connect", "Connect your wallet (not LIA)", wallet_connected, not wallet_connected, "Connect required", "/wallet"),
        JourneyStep("media", "Pin media to IPFS (Pinata)", bool(ipfs_cid), not ipfs_cid, "CID required for mint", "/studio"),
        JourneyStep("collection", "Issue / select collection", collection_ready, not collection_ready, "Collection first", "/studio"),
        JourneyStep(
            "mint_art",
            "Mint art NFT (image/video/audio)",
            False,
            not (wallet_connected and ipfs_cid and collection_ready),
            "Complete previous steps",
            "/studio",
        ),
        JourneyStep(
            "list_art",
            "List art on marketplace",
            False,
            not marketplace_deployed,
            "nft-marketplace SC not deployed",
            "/marketplace",
        ),
        JourneyStep(
            "create_agent",
            "Create limited agent-NFT from prompt",
            False,
            False,
            "",
            "/agents",
        ),
        JourneyStep(
            "list_agent",
            "List agent pack (limited supply)",
            False,
            not agents_deployed,
            "agents_marketplace SC not deployed",
            "/agents",
        ),
    ]
    return [asdict(s) for s in steps]


def agent_nft_edition_policy(supply_cap: int = MAX_AGENT_NFT_SUPPLY_DEFAULT) -> dict[str, Any]:
    return {
        "product": "sub_agent_nft",
        "supply_cap": min(int(supply_cap), 500),
        "fulfillment": ["api_key_once", "badge_nft", "receipt"],
        "stake_optional": True,
        "not": "LIA protocol bot — separate product",
        "live_default": False,
    }


def log_event(event: str, meta: Optional[dict[str, Any]] = None) -> None:
    rows: list[dict[str, Any]] = []
    if JOURNEY_LOG.exists():
        try:
            rows = list(json.loads(JOURNEY_LOG.read_text(encoding="utf-8")).get("events") or [])
        except json.JSONDecodeError:
            rows = []
    rows.append({"ts": time.time(), "event": event, "meta": meta or {}})
    JOURNEY_LOG.parent.mkdir(parents=True, exist_ok=True)
    JOURNEY_LOG.write_text(
        json.dumps({"updated": time.time(), "events": rows[-200:]}, indent=2) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    print(json.dumps(creator_steps(wallet_connected=True, ipfs_cid="Qm…"), indent=2))
    print(json.dumps(agent_nft_edition_policy(50), indent=2))
