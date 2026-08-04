"""
Post-buy fulfillment: API key + NFT rights + optional stake bootstrap.
"""
from __future__ import annotations

import json
from typing import Any, Optional

from lia.agents.api_keys import issue_key
from lia.agents.nft_rights import bind_key, grant_badge_rights
from lia.agents.agent_stake import open_stake


def fulfill_purchase(
    *,
    agent_id: str,
    buyer: str,
    collection: str = "AGENTBADGE-pending",
    nonce: int = 0,
    starting_egld: Optional[float] = None,
) -> dict[str, Any]:
    rights = grant_badge_rights(
        collection=collection,
        nonce=nonce,
        agent_id=agent_id,
        owner=buyer,
    )
    key = issue_key(agent_id=agent_id, owner=buyer)
    raw = key.pop("raw_key", None)
    bind_key(collection, nonce, key["key_id"], buyer)
    stake = None
    if starting_egld and starting_egld > 0:
        stake = open_stake(
            agent_id=agent_id,
            owner=buyer,
            principal_egld=starting_egld,
            collection=collection,
            nonce=nonce,
            lock_nft=False,
        )
    return {
        "rights": rights.to_dict(),
        "api_key_meta": key,
        "raw_key_once": raw,
        "stake": stake,
        "note": "Deliver raw_key over secure channel only once",
    }


if __name__ == "__main__":
    print(
        json.dumps(
            fulfill_purchase(agent_id="xag-demo", buyer="erd1buyer", starting_egld=0.5),
            indent=2,
        )[:2000]
    )
