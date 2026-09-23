#!/usr/bin/env python3
"""
register_mx8004_lia.py — Skeleton MX-8004 Identity registration for LIA (xArtists).

NO PEM IN REPO. PEM only from Vellum secrets / local ops vault:
  LIA_WALLET_PEM_PATH  or  LIA_WALLET_PEM

Maps to moltbot Identity skills:
  register_agent(name, uri, public_key)  → Identity Registry
  get_agent(nonce)
  set_metadata(...)

After Mainnet Push (registries live), fill ADDRESSES and run from Vellum node
or ops machine with PEM path set. Paper-first until then.

Refs:
  docs/MX8004_FIRST100_ALIGNMENT.md
  docs/MOLTBOT_MX8004_MAP.md
  https://github.com/sasurobert/moltbot-starter-kit (identity_skills.ts)
  https://github.com/sasurobert/mx-8004
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# Config (override via env after Mainnet Push)
# ---------------------------------------------------------------------------
CHAIN_ID = os.environ.get("CHAIN", "1")  # mainnet
PROXY = os.environ.get("PROXY", "https://gateway.multiversx.com")
API = os.environ.get("API", "https://api.multiversx.com")

# Fill when Identity Registry is deployed on mainnet (Mainnet Push)
IDENTITY_REGISTRY = os.environ.get("IDENTITY_REGISTRY_ADDRESS", "")  # erd1...
VALIDATION_REGISTRY = os.environ.get("VALIDATION_REGISTRY_ADDRESS", "")
REPUTATION_REGISTRY = os.environ.get("REPUTATION_REGISTRY_ADDRESS", "")

AGENT_NAME = os.environ.get("LIA_AGENT_NAME", "LIA v6 — xArtists")
# Stable URI for registration-v1 manifest (IPFS or GitHub raw)
MANIFEST_URI = os.environ.get(
    "LIA_MANIFEST_URI",
    "https://raw.githubusercontent.com/Neltud/xArtists/main/data/mx8004_lia_manifest.json",
)

DRY_RUN = os.environ.get("DRY_RUN", "1") != "0"
REPO_ROOT = Path(__file__).resolve().parents[1]
OUT_JSON = REPO_ROOT / "data" / "mx8004_registration.json"


def _pem_path() -> str | None:
    """PEM only from env — never hardcode."""
    path = os.environ.get("LIA_WALLET_PEM_PATH") or os.environ.get("LIA_WALLET_PEM")
    if path and Path(path).is_file():
        return path
    return None


def build_manifest_stub() -> dict[str, Any]:
    """registration-v1 aligned with MX-8004 / ERC-8004 style."""
    return {
        "type": "https://multiversx.com/standards/mx-8004#registration-v1",
        "name": AGENT_NAME,
        "description": (
            "Autonomous DeFi agent on MultiversX: yield optimization (Hatom), "
            "risk-managed compounding, multi-brain consensus (Pulse/Yield/Sentinel). "
            "Paper-first; verifiable jobs via Validation Registry."
        ),
        "image": "https://neltud.github.io/xArtists/favicon.ico",
        "version": "6.0.0",
        "active": True,
        "x402Support": True,
        "services": [
            {
                "name": "MCP",
                "endpoint": os.environ.get("LIA_MCP_ENDPOINT", "https://neltud.github.io/xArtists/"),
                "version": "2025-01-15",
                "offerings": [
                    {
                        "serviceId": 1,
                        "name": "Yield Optimization",
                        "description": "Idle capital → Hatom supply / farms with risk guards",
                        "sla": 60,
                    },
                    {
                        "serviceId": 2,
                        "name": "Risk Monitoring",
                        "description": "HF / circuit-breaker alerts (Sentinel)",
                        "sla": 5,
                    },
                    {
                        "serviceId": 3,
                        "name": "Portfolio Signal",
                        "description": "Paper or live recommendations with DecisionProof",
                        "sla": 15,
                    },
                ],
            }
        ],
        "contact": {
            "twitter": "@tudurioriginal",
            "github": "https://github.com/Neltud/xArtists",
        },
    }


def write_manifest_if_missing() -> Path:
    dest = REPO_ROOT / "data" / "mx8004_lia_manifest.json"
    if not dest.exists():
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(json.dumps(build_manifest_stub(), indent=2) + "\n", encoding="utf-8")
        print(f"[ok] wrote manifest stub → {dest}")
    return dest


def register_agent_dry() -> dict[str, Any]:
    """Simulate register_agent; no chain write."""
    pem = _pem_path()
    result = {
        "mode": "dry_run",
        "chain": CHAIN_ID,
        "proxy": PROXY,
        "identity_registry": IDENTITY_REGISTRY or "(set IDENTITY_REGISTRY_ADDRESS)",
        "agent_name": AGENT_NAME,
        "manifest_uri": MANIFEST_URI,
        "pem_available": bool(pem),
        "pem_hint": "Set LIA_WALLET_PEM_PATH in Vellum secrets — never commit PEM",
        "next_steps": [
            "1. Wait Mainnet Push (Identity/Validation/Reputation live)",
            "2. Set IDENTITY_REGISTRY_ADDRESS (+ validation/reputation)",
            "3. Publish manifest (IPFS or stable GitHub raw)",
            "4. DRY_RUN=0 + PEM path → call register_agent (moltbot skill or mxpy)",
            "5. Store agent_nonce in data/mx8004_registration.json + contracts.json",
            "6. Run 5 verified jobs (Validation Registry)",
            "7. Feedback → trust > 90",
        ],
        "moltbot_skills": {
            "identity": "registerAgent / getAgent / setMetadata",
            "validation": "initJob / submitProof / isJobVerified",
            "reputation": "submitFeedback / getReputation",
        },
    }
    return result


def register_agent_live() -> dict[str, Any]:
    """
    Live path — wire to multiversx-sdk + Identity ABI when ready.
    Prefer calling moltbot-starter-kit identity_skills from a Node step,
    or mxpy contract call, with PEM only from env.
    """
    if not IDENTITY_REGISTRY:
        raise SystemExit("IDENTITY_REGISTRY_ADDRESS required for live registration")
    pem = _pem_path()
    if not pem:
        raise SystemExit("LIA_WALLET_PEM_PATH (or LIA_WALLET_PEM) required — never in git")

    # Placeholder: integrate @multiversx/sdk or subprocess to moltbot registerAgent
    # Example (Node, from moltbot):
    #   registerAgent({ name, uri: MANIFEST_URI, useRelayer: true })
    raise NotImplementedError(
        "Live registration not implemented in this skeleton. "
        "Use moltbot-starter-kit identity_skills.registerAgent with same env, "
        "or implement mxpy/sdk call here after Mainnet Push."
    )


def main() -> int:
    write_manifest_if_missing()
    if DRY_RUN:
        out = register_agent_dry()
        print(json.dumps(out, indent=2))
    else:
        out = register_agent_live()
        print(json.dumps(out, indent=2))

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
    print(f"[ok] wrote {OUT_JSON}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
