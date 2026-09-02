"""
NFT rights for agent badges / pack ownership.

Model:
  - Ownership of badge NFT = license to use the agent pack (off-chain API)
  - Rights flags in metadata (not always enforceable on every SC):
      can_use, can_resell, can_sublicense, commercial_ok
  - Transfer of NFT → new owner must re-bind API key (old keys revoked)
  - Phygital: physical_lock is metadata flag only (does not block buy on-chain)

On-chain enforcement depends on nft-marketplace / badge collection SC.
This module is the policy + registry LIA uses for fulfillment.
"""
from __future__ import annotations

import json
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Optional

_ROOT = Path(__file__).resolve().parents[2]
RIGHTS_PATH = _ROOT / "data" / "agent_nft_rights.json"


@dataclass
class NftRights:
    collection: str
    nonce: int
    agent_id: str
    owner: str
    can_use: bool = True
    can_resell: bool = True
    can_sublicense: bool = False
    commercial_ok: bool = True
    physical_lock: bool = False  # metadata only
    bound_key_id: Optional[str] = None
    updated_at: float = 0.0
    meta: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def grant_badge_rights(
    *,
    collection: str,
    nonce: int,
    agent_id: str,
    owner: str,
    can_resell: bool = True,
    physical_lock: bool = False,
) -> NftRights:
    rights = NftRights(
        collection=collection,
        nonce=int(nonce),
        agent_id=agent_id,
        owner=owner,
        can_use=True,
        can_resell=can_resell,
        can_sublicense=False,
        commercial_ok=True,
        physical_lock=physical_lock,
        updated_at=time.time(),
    )
    _upsert(rights)
    return rights


def transfer_rights(
    *,
    collection: str,
    nonce: int,
    new_owner: str,
    revoke_old_keys: bool = True,
) -> Optional[dict[str, Any]]:
    rows = _load()
    found = None
    for r in rows:
        if r.get("collection") == collection and int(r.get("nonce") or 0) == int(nonce):
            old_owner = r.get("owner")
            old_key = r.get("bound_key_id")
            r["owner"] = new_owner
            r["bound_key_id"] = None  # must re-issue
            r["updated_at"] = time.time()
            found = {"rights": r, "old_owner": old_owner, "old_key_id": old_key}
            break
    if not found:
        return None
    _write(rows)
    if revoke_old_keys and found.get("old_key_id"):
        try:
            from lia.agents.api_keys import revoke_key

            revoke_key(str(found["old_key_id"]))
        except Exception:
            found["revoke_error"] = True
    return found


def bind_key(collection: str, nonce: int, key_id: str, owner: str) -> bool:
    rows = _load()
    for r in rows:
        if (
            r.get("collection") == collection
            and int(r.get("nonce") or 0) == int(nonce)
            and r.get("owner") == owner
            and r.get("can_use")
        ):
            r["bound_key_id"] = key_id
            r["updated_at"] = time.time()
            _write(rows)
            return True
    return False


def can_use_agent(owner: str, agent_id: str) -> dict[str, Any]:
    for r in _load():
        if r.get("agent_id") == agent_id and r.get("owner") == owner:
            if not r.get("can_use"):
                return {"ok": False, "error": "can_use false"}
            return {"ok": True, "rights": r}
    return {"ok": False, "error": "no badge rights"}


def _load() -> list[dict[str, Any]]:
    if not RIGHTS_PATH.exists():
        return []
    try:
        return list(json.loads(RIGHTS_PATH.read_text(encoding="utf-8")).get("rights") or [])
    except json.JSONDecodeError:
        return []


def _write(rows: list[dict[str, Any]]) -> None:
    RIGHTS_PATH.parent.mkdir(parents=True, exist_ok=True)
    RIGHTS_PATH.write_text(
        json.dumps({"updated": time.time(), "rights": rows}, indent=2) + "\n",
        encoding="utf-8",
    )


def _upsert(rights: NftRights) -> None:
    rows = [
        r
        for r in _load()
        if not (r.get("collection") == rights.collection and int(r.get("nonce") or 0) == rights.nonce)
    ]
    rows.append(rights.to_dict())
    _write(rows)


if __name__ == "__main__":
    g = grant_badge_rights(
        collection="AGENTBADGE-demo",
        nonce=1,
        agent_id="xag-demo",
        owner="erd1user",
    )
    print(json.dumps(g.to_dict(), indent=2))
