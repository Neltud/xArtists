"""
Off-chain mirror + policy for agent-stake-escrow SC.

Aligns with contracts/agent-stake-escrow:
  openStake / setAgentLive / closeStake

Also enforces isolation: owner stakes never merge into LIA protocol book.
"""
from __future__ import annotations

import json
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Optional

from lia.agents.isolation import OWNER_SCOPE, assert_not_protocol_wallet

_ROOT = Path(__file__).resolve().parents[2]
MIRROR = _ROOT / "data" / "escrow_mirror.json"

DEFAULT_LIA = "erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6"
MIN_EGLD = 0.05
MAX_EGLD = 50.0


@dataclass
class EscrowStake:
    stake_id: str
    owner: str
    agent_id: str
    principal_egld: float
    active: bool
    agent_live: bool
    scope: str = OWNER_SCOPE
    tx_open: str = ""
    created_at: float = 0.0

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def validate_open(
    *,
    owner: str,
    agent_id: str,
    principal_egld: float,
    lia_wallet: str = DEFAULT_LIA,
) -> dict[str, Any]:
    try:
        assert_not_protocol_wallet(owner, lia_wallet)
    except ValueError as e:
        return {"ok": False, "error": str(e)}
    if not agent_id or len(agent_id) > 64:
        return {"ok": False, "error": "invalid agent_id"}
    if principal_egld < MIN_EGLD or principal_egld > MAX_EGLD:
        return {"ok": False, "error": f"principal in [{MIN_EGLD}, {MAX_EGLD}] EGLD"}
    return {"ok": True}


def mirror_open(
    *,
    owner: str,
    agent_id: str,
    principal_egld: float,
    stake_id: Optional[str] = None,
    tx_open: str = "",
    lia_wallet: str = DEFAULT_LIA,
) -> dict[str, Any]:
    v = validate_open(owner=owner, agent_id=agent_id, principal_egld=principal_egld, lia_wallet=lia_wallet)
    if not v["ok"]:
        return v
    sid = stake_id or f"escrow-{agent_id[-8:]}-{int(time.time()) % 10_000_000}"
    st = EscrowStake(
        stake_id=sid,
        owner=owner,
        agent_id=agent_id,
        principal_egld=float(principal_egld),
        active=True,
        agent_live=False,
        tx_open=tx_open,
        created_at=time.time(),
    )
    rows = _load()
    rows.append(st.to_dict())
    _write(rows)
    return {"ok": True, "stake": st.to_dict(), "sc_endpoint": "openStake"}


def mirror_set_live(stake_id: str, owner: str, live: bool) -> dict[str, Any]:
    rows = _load()
    for r in rows:
        if r.get("stake_id") == stake_id and r.get("owner") == owner and r.get("active"):
            r["agent_live"] = bool(live)
            _write(rows)
            return {"ok": True, "stake": r, "sc_endpoint": "setAgentLive"}
    return {"ok": False, "error": "not found"}


def mirror_close(stake_id: str, owner: str, tx_close: str = "") -> dict[str, Any]:
    rows = _load()
    for r in rows:
        if r.get("stake_id") == stake_id and r.get("owner") == owner and r.get("active"):
            r["active"] = False
            r["agent_live"] = False
            r["closed_at"] = time.time()
            r["tx_close"] = tx_close
            _write(rows)
            return {
                "ok": True,
                "returned_egld": r.get("principal_egld"),
                "stake": r,
                "sc_endpoint": "closeStake",
            }
    return {"ok": False, "error": "not found"}


def sc_calldata_hints(agent_id: str) -> dict[str, Any]:
    return {
        "openStake": {"endpoint": "openStake", "args": [agent_id], "payable": "EGLD"},
        "setAgentLive": {"endpoint": "setAgentLive", "args": ["stake_id_u64", "bool"]},
        "closeStake": {"endpoint": "closeStake", "args": ["stake_id_u64"]},
        "note": "Deploy agent-stake-escrow before broadcasting",
    }


def _load() -> list[dict[str, Any]]:
    if not MIRROR.exists():
        return []
    try:
        return list(json.loads(MIRROR.read_text(encoding="utf-8")).get("stakes") or [])
    except json.JSONDecodeError:
        return []


def _write(rows: list[dict[str, Any]]) -> None:
    MIRROR.parent.mkdir(parents=True, exist_ok=True)
    MIRROR.write_text(
        json.dumps({"updated": time.time(), "stakes": rows}, indent=2) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    print(json.dumps(mirror_open(owner="erd1user…", agent_id="xag-demo", principal_egld=1.0), indent=2))
