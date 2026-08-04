"""
Sub-agent factory — LIA creates Vellum sub-agents from a user prompt
and prepares a sellable marketplace listing (concept → product).

Flow:
  1. User prompt (dApp Studio / API)
  2. LIA normalizes → SubAgentSpec (template, cadence, risk, price)
  3. Persist catalog entry (data/agents_catalog.json)
  4. Optional: enqueue Vellum workflow clone (paper)
  5. On agents_marketplace SC live: listAgent (seller = creator or LIA)
  6. Fulfillment after buy: limited API key + NFT badge + receipt

Does not deploy Vellum nodes by itself without secrets; emits a
machine-readable job for the Vellum orchestrator.
"""
from __future__ import annotations

import hashlib
import json
import re
import time
import uuid
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Optional

_ROOT = Path(__file__).resolve().parents[2]
CATALOG_PATH = _ROOT / "data" / "agents_catalog.json"

# Template library — maps intent keywords → Vellum workflow kind
TEMPLATES: dict[str, dict[str, Any]] = {
    "momentum": {
        "workflow": "lia_sleeve_mom",
        "cadence_min": 60,
        "risk": "medium",
        "default_price_egld": 0.5,
        "description": "Momentum sleeve signals (paper-first)",
    },
    "mean_reversion": {
        "workflow": "lia_sleeve_mr",
        "cadence_min": 30,
        "risk": "medium",
        "default_price_egld": 0.5,
        "description": "Mean-reversion signals on liquid pairs",
    },
    "micro_arb": {
        "workflow": "lia_sleeve_arb",
        "cadence_min": 5,
        "risk": "high",
        "default_price_egld": 1.0,
        "description": "Block-time arb scan xEx/OneDex/Ash",
    },
    "yield": {
        "workflow": "lia_yield_hatom",
        "cadence_min": 360,
        "risk": "low",
        "default_price_egld": 0.3,
        "description": "Hatom / idle yield watcher",
    },
    "social_watch": {
        "workflow": "lia_social_intel",
        "cadence_min": 15,
        "risk": "low",
        "default_price_egld": 0.2,
        "description": "Social intel feed (cap 0.15, no auto-trade)",
    },
    "greensmoke": {
        "workflow": "lia_gsn_reader",
        "cadence_min": 30,
        "risk": "medium",
        "default_price_egld": 0.4,
        "description": "GreenSmoke forecast reader (not LIA packs confusion)",
    },
    "custom": {
        "workflow": "lia_custom_prompt",
        "cadence_min": 60,
        "risk": "medium",
        "default_price_egld": 0.8,
        "description": "Custom prompt-driven sub-agent (supervised)",
    },
}

_KEYWORD_MAP = [
    (re.compile(r"arb|arbitrage|spread", re.I), "micro_arb"),
    (re.compile(r"yield|hatom|lend|stake", re.I), "yield"),
    (re.compile(r"social|twitter|reddit|sentiment", re.I), "social_watch"),
    (re.compile(r"green\s*smoke|gsn|forecast", re.I), "greensmoke"),
    (re.compile(r"mean\s*rev|vwap|rsi", re.I), "mean_reversion"),
    (re.compile(r"momentum|trend|breakout", re.I), "momentum"),
]


@dataclass
class SubAgentSpec:
    agent_id: str
    name: str
    prompt: str
    template: str
    workflow: str
    creator: str  # erd1… or "LIA"
    seller: str
    price_egld: float
    cadence_min: int
    risk: str
    description: str
    status: str  # draft | listed | sold | retired
    created_at: float
    vellum_job: dict[str, Any] = field(default_factory=dict)
    tags: list[str] = field(default_factory=list)
    fulfillment: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def _pick_template(prompt: str) -> str:
    for rx, tid in _KEYWORD_MAP:
        if rx.search(prompt or ""):
            return tid
    return "custom"


def _agent_id(prompt: str, creator: str) -> str:
    h = hashlib.sha256(f"{creator}:{prompt}:{time.time()}".encode()).hexdigest()[:12]
    return f"xag-{h}"


def create_subagent_from_prompt(
    prompt: str,
    *,
    name: Optional[str] = None,
    creator: str = "LIA",
    seller: Optional[str] = None,
    price_egld: Optional[float] = None,
    persist: bool = True,
) -> SubAgentSpec:
    prompt = (prompt or "").strip()
    if len(prompt) < 8:
        raise ValueError("prompt too short (min 8 chars)")

    tid = _pick_template(prompt)
    tpl = TEMPLATES[tid]
    seller = seller or creator
    aid = _agent_id(prompt, creator)
    display = name or f"xArtists {tid.replace('_', ' ').title()} · {aid[-6:]}"

    job = {
        "action": "provision_subagent",
        "workflow": tpl["workflow"],
        "template": tid,
        "prompt": prompt[:2000],
        "cadence_min": tpl["cadence_min"],
        "env": {
            "LIA_LIVE_TRADING": "0",
            "AGENT_ID": aid,
            "PARENT": "LIA",
        },
        "note": "Vellum clones workflow template; no live trading until micro proof + pack policy",
    }

    spec = SubAgentSpec(
        agent_id=aid,
        name=display,
        prompt=prompt[:2000],
        template=tid,
        workflow=tpl["workflow"],
        creator=creator,
        seller=seller,
        price_egld=float(price_egld if price_egld is not None else tpl["default_price_egld"]),
        cadence_min=int(tpl["cadence_min"]),
        risk=str(tpl["risk"]),
        description=str(tpl["description"]),
        status="draft",
        created_at=time.time(),
        vellum_job=job,
        tags=[tid, "xartists", "vellum"],
        fulfillment={
            "on_buy": ["api_key_limited", "nft_badge", "receipt"],
            "slot_vellum": True,
        },
    )

    if persist:
        _catalog_upsert(spec)
    return spec


def listing_payload_for_marketplace(spec: SubAgentSpec) -> dict[str, Any]:
    """
    Payload for agents-marketplace list endpoint (when SC live).
    fee_bps handled on-chain (300 default).
    """
    return {
        "agent_id": spec.agent_id,
        "seller": spec.seller,
        "price_egld": spec.price_egld,
        "name": spec.name,
        "metadata": {
            "template": spec.template,
            "workflow": spec.workflow,
            "risk": spec.risk,
            "cadence_min": spec.cadence_min,
            "description": spec.description,
            "tags": spec.tags,
            "fulfillment": spec.fulfillment,
        },
        "sc_ready": False,  # flip after agents_marketplace deploy
        "ui_path": f"/agents?highlight={spec.agent_id}",
    }


def _catalog_upsert(spec: SubAgentSpec) -> None:
    CATALOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    data: dict[str, Any] = {"agents": [], "updated": time.time()}
    if CATALOG_PATH.exists():
        try:
            data = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            pass
    agents = [a for a in data.get("agents") or [] if a.get("agent_id") != spec.agent_id]
    agents.append(spec.to_dict())
    data["agents"] = agents[-200:]
    data["updated"] = time.time()
    CATALOG_PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def list_catalog() -> list[dict[str, Any]]:
    if not CATALOG_PATH.exists():
        return []
    try:
        return list(json.loads(CATALOG_PATH.read_text(encoding="utf-8")).get("agents") or [])
    except json.JSONDecodeError:
        return []


def mark_listed(agent_id: str) -> bool:
    if not CATALOG_PATH.exists():
        return False
    data = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    ok = False
    for a in data.get("agents") or []:
        if a.get("agent_id") == agent_id:
            a["status"] = "listed"
            ok = True
    if ok:
        data["updated"] = time.time()
        CATALOG_PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return ok


if __name__ == "__main__":
    s = create_subagent_from_prompt(
        "Build a micro arb agent scanning xExchange vs OneDex",
        creator="LIA",
        name="Arb Scout Alpha",
    )
    print(json.dumps(s.to_dict(), indent=2)[:1200])
    print("listing", json.dumps(listing_payload_for_marketplace(s), indent=2))
