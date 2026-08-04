"""
Vellum provision job queue for sub-agents.

Writes data/vellum_subagent_jobs.json for the orchestrator to:
  - clone workflow template
  - inject prompt + AGENT_ID
  - keep LIA_LIVE_TRADING=0
  - register in catalog as provisioned
"""
from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any, Optional

from lia.agents.subagent_factory import SubAgentSpec, create_subagent_from_prompt, listing_payload_for_marketplace

_ROOT = Path(__file__).resolve().parents[2]
JOBS_PATH = _ROOT / "data" / "vellum_subagent_jobs.json"


def enqueue_provision(spec: SubAgentSpec) -> dict[str, Any]:
    job = {
        "id": f"job-{spec.agent_id}",
        "ts": time.time(),
        "status": "queued",
        "spec": spec.to_dict(),
        "listing": listing_payload_for_marketplace(spec),
        "steps": [
            "clone_workflow_template",
            "set_env_AGENT_ID",
            "set_LIA_LIVE_TRADING_0",
            "attach_prompt",
            "schedule_cadence",
            "publish_catalog_entry",
            "wait_sc_for_onchain_list",
        ],
    }
    jobs: list[dict[str, Any]] = []
    if JOBS_PATH.exists():
        try:
            jobs = list(json.loads(JOBS_PATH.read_text(encoding="utf-8")).get("jobs") or [])
        except json.JSONDecodeError:
            jobs = []
    jobs.append(job)
    JOBS_PATH.parent.mkdir(parents=True, exist_ok=True)
    JOBS_PATH.write_text(
        json.dumps({"updated": time.time(), "jobs": jobs[-100:]}, indent=2) + "\n",
        encoding="utf-8",
    )
    return job


def create_and_enqueue(
    prompt: str,
    *,
    name: Optional[str] = None,
    creator: str = "LIA",
    price_egld: Optional[float] = None,
) -> dict[str, Any]:
    spec = create_subagent_from_prompt(
        prompt, name=name, creator=creator, price_egld=price_egld, persist=True
    )
    job = enqueue_provision(spec)
    return {"spec": spec.to_dict(), "job": job}


if __name__ == "__main__":
    print(json.dumps(create_and_enqueue("Social sentiment watcher for EGLD news"), indent=2)[:1500])
