"""Customer analysis projection of the internal xOrus paper decision agent.

Collected values, provider payloads and Chair prompts are internal inputs, not
the product. This module emits only derived assessments and coverage limits.
It performs no collection, model call, entitlement check or financial action.
"""
from __future__ import annotations

import hashlib
import json
from collections.abc import Mapping
from datetime import datetime, timezone
from typing import Any

from lia.chorus.swarm import ROLES
from lia.xorus.decision_agent import run_decision_agent

SCHEMA = "xorus_analysis/v1"
METHOD = "deterministic_paper_synthesis/v1"


def seal_report(report: dict[str, Any]) -> dict[str, Any]:
    """Bind the derived output, never claim authenticity or source truth."""
    report.pop("report_sha256", None)
    canonical = json.dumps(report, ensure_ascii=False, sort_keys=True,
                           separators=(",", ":"), allow_nan=False)
    report["report_sha256"] = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
    return report


def _family_assessment(rows: list[dict[str, Any]], family: str) -> dict[str, Any]:
    selected = [row for row in rows if row["family"] == family]
    scored = [row for row in selected if row["status"] == "scored"]
    if not scored:
        reading = "context_only" if any(row["status"] == "context_only" for row in selected) else "no_input"
    else:
        positive = any(row["score"] > 0.12 for row in scored)
        negative = any(row["score"] < -0.12 for row in scored)
        reading = ("mixed" if positive and negative else "positive" if positive
                   else "negative" if negative else "balanced")
    return {"family": family, "signals_analyzed": len(scored), "reading": reading}


def run_analysis_agent(
    *, market: Mapping[str, Any] | None = None, chair_brief: Any = None,
    now: datetime | None = None,
) -> dict[str, Any]:
    """Produce a bounded, raw-data-free report from unverified offline inputs.

    This is a deterministic synthesis of existing scorers, not eight LLM runs.
    No payload can assert provider verification or commercial-analysis rights.
    The internal decision board must never be returned by a customer endpoint.
    """
    moment = now if now is not None else datetime.now(timezone.utc)
    if not isinstance(moment, datetime) or moment.utcoffset() is None:
        raise ValueError("now must be a timezone-aware datetime")
    internal = run_decision_agent(market=market, chair_brief=chair_brief)
    rows = internal["board"]["signals"]
    agents = []
    for role in ROLES:
        families = [_family_assessment(rows, family) for family in role["owns"]]
        count = sum(family["signals_analyzed"] for family in families)
        if role["id"] == "scribe":
            status = "recorded"
        elif role["id"] == "sentinel" and internal["sentinel"]["veto"]:
            status = "veto"
        elif role["id"] == "chair":
            status = "advisory_unverified" if count else "no_input"
        elif count:
            status = "paper_unverified"
        else:
            status = "context_only" if any(f["reading"] == "context_only" for f in families) else "no_input"
        agents.append({"agent": role["id"], "status": status, "families": families})

    decision = internal["decision"]
    report = {
        "schema": SCHEMA,
        "engine": "xorus",
        "product": "proprietary_analysis",
        "method": METHOD,
        "mode": "paper_only",
        "generated_at": moment.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source_ts": None,
        "input_provenance": "unverified_offline_inputs",
        "raw_data_included": False,
        "commercial_enabled": False,
        "access_granted": False,
        "decision": {"stance": decision["stance"], "reason": decision["reason"]},
        "coverage": {
            "signals_defined": 120,
            "signals_analyzed": decision["core_signals_scored"],
            "families_analyzed": decision["independent_families_scored"],
            "independently_verified_signals": 0,
        },
        "confidence": None,
        "agents": agents,
        "scenarios": [
            {"condition": "verified_quorum_and_source_review", "outcome": "reassess_analysis"},
            {"condition": "sentinel_veto_or_operator_halt", "outcome": "maintain_abstention"},
        ],
        "limitations": [
            "offline_inputs_not_independently_verified",
            "source_timestamp_unavailable",
            "generation_time_is_not_source_time",
            "commercial_analysis_rights_not_verified",
            "no_autonomous_execution",
        ],
        "safety": {
            "executable": False, "live_trading": False,
            "signing_authorized": False, "trade_authorized": False,
            "mint_authorized": False, "transfer_authorized": False,
            "requires_human_review": True,
        },
    }
    # Digest binds the derived report, not raw provider data or a proof of truth.
    return seal_report(report)


def main() -> None:
    # Safe public preview: intentionally no market fixture or provider payload.
    print(json.dumps(run_analysis_agent(), ensure_ascii=False, indent=2, allow_nan=False))


if __name__ == "__main__":
    main()
