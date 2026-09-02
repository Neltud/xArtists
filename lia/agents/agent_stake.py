"""
User stakes an agent pack with starting funds (paper + on-chain intent).

Concept:
  - User allocates starting_capital_egld (or USD notion) to THEIR purchased agent
  - Funds are tracked as a dedicated sleeve under agent_id (not LIA protocol book)
  - Agent runs under same risk gates: LIA_LIVE_TRADING for *user bot* is separate
    flag AGENT_LIVE default 0; user must opt in after micro proof on their key
  - Optional: lock badge NFT while stake active (policy flag)

On-chain: future escrow SC; today registry + intent for Vellum.
"""
from __future__ import annotations

import json
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Optional

from lia.agents.nft_rights import can_use_agent

_ROOT = Path(__file__).resolve().parents[2]
STAKE_PATH = _ROOT / "data" / "agent_stakes.json"

MIN_START_EGLD = 0.05
MAX_START_EGLD = 50.0


@dataclass
class AgentStake:
    stake_id: str
    agent_id: str
    owner: str
    principal_egld: float
    equity_egld: float
    status: str  # active | unstaking | closed
    created_at: float
    agent_live: bool = False  # user opt-in; default False
    lock_nft: bool = False
    collection: Optional[str] = None
    nonce: Optional[int] = None
    meta: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def open_stake(
    *,
    agent_id: str,
    owner: str,
    principal_egld: float,
    collection: Optional[str] = None,
    nonce: Optional[int] = None,
    lock_nft: bool = False,
) -> dict[str, Any]:
    principal = float(principal_egld)
    if principal < MIN_START_EGLD:
        return {"ok": False, "error": f"min principal {MIN_START_EGLD} EGLD"}
    if principal > MAX_START_EGLD:
        return {"ok": False, "error": f"max principal {MAX_START_EGLD} EGLD"}

    rights = can_use_agent(owner, agent_id)
    if not rights.get("ok"):
        # Allow stake if rights registry empty but owner claims purchase (paper)
        # Stricter when badge rights exist for someone else
        if rights.get("error") == "no badge rights":
            pass  # paper path: catalog purchase pending NFT mint
        else:
            return {"ok": False, "error": rights.get("error")}

    stake_id = f"stk-{agent_id[-8:]}-{int(time.time()) % 10_000_000}"
    st = AgentStake(
        stake_id=stake_id,
        agent_id=agent_id,
        owner=owner,
        principal_egld=principal,
        equity_egld=principal,
        status="active",
        created_at=time.time(),
        agent_live=False,
        lock_nft=lock_nft,
        collection=collection,
        nonce=nonce,
        meta={
            "note": "Starting funds tracked off-chain until escrow SC; AGENT_LIVE default 0",
            "paper": True,
        },
    )
    rows = _load()
    rows.append(st.to_dict())
    _write(rows)
    return {"ok": True, "stake": st.to_dict()}


def set_agent_live(stake_id: str, owner: str, enabled: bool) -> dict[str, Any]:
    """User opt-in — still subject to global micro proof culture; no PEM in pack."""
    rows = _load()
    for r in rows:
        if r.get("stake_id") == stake_id and r.get("owner") == owner:
            r["agent_live"] = bool(enabled)
            r["meta"] = {
                **(r.get("meta") or {}),
                "live_toggled_at": time.time(),
                "warning": "Live only with user wallet signing; pack API key cannot sign",
            }
            _write(rows)
            return {"ok": True, "stake": r}
    return {"ok": False, "error": "stake not found"}


def record_pnl(stake_id: str, delta_egld: float) -> dict[str, Any]:
    rows = _load()
    for r in rows:
        if r.get("stake_id") == stake_id and r.get("status") == "active":
            r["equity_egld"] = max(0.0, float(r.get("equity_egld") or 0) + float(delta_egld))
            _write(rows)
            return {"ok": True, "equity_egld": r["equity_egld"]}
    return {"ok": False, "error": "not found"}


def close_stake(stake_id: str, owner: str) -> dict[str, Any]:
    rows = _load()
    for r in rows:
        if r.get("stake_id") == stake_id and r.get("owner") == owner:
            r["status"] = "closed"
            r["agent_live"] = False
            r["closed_at"] = time.time()
            _write(rows)
            return {"ok": True, "returned_egld": r.get("equity_egld"), "stake": r}
    return {"ok": False, "error": "not found"}


def _load() -> list[dict[str, Any]]:
    if not STAKE_PATH.exists():
        return []
    try:
        return list(json.loads(STAKE_PATH.read_text(encoding="utf-8")).get("stakes") or [])
    except json.JSONDecodeError:
        return []


def _write(rows: list[dict[str, Any]]) -> None:
    STAKE_PATH.parent.mkdir(parents=True, exist_ok=True)
    STAKE_PATH.write_text(
        json.dumps({"updated": time.time(), "stakes": rows}, indent=2) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    print(json.dumps(open_stake(agent_id="xag-demo", owner="erd1user", principal_egld=1.0), indent=2))
