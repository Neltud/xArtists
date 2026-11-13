"""xOrus Decision Agent — bounded advisory paper board.

This module adds safeguards around the existing xOrus/Chorus scorer; it never
reads a network, obtains entitlements, imports preprod_gate, or signs anything.
All supplied market values are unverified offline inputs unless an upstream
source is independently audited. No output is an execution authorization.
"""
from __future__ import annotations

import math
from collections.abc import Mapping
from pathlib import Path
from typing import Any

from lia.chorus.swarm import CHATGPT_CAP
from lia.xorus.data_feed import count_proof_bound_signals, count_verified_signals
from lia.xorus.swarm import run_xorus

_ALLOWED_MARKET = frozenset({
    "price_change_1h", "price_change_24h", "rsi_14", "price",
    "vwap_24h", "volume_spike", "liquidity_usd", "drawdown",
    "slot_payable", "slot_balance_egld", "price_dex_a", "price_dex_b",
    "egld_usd",
})
_VALID_STANCES = frozenset({"abstain", "flat", "long", "short"})
_SAFETY_THRESHOLD = -0.35
_MIN_CORE = 12
_MIN_FAMILIES = 3


def _chair_vote(proposal: Any) -> tuple[dict[str, Any] | None, str]:
    """Schema-check a Chair proposal; source citations are NOT independently verified.

    A proposal with no three cited facts and one concrete risk has no vote.
    The legacy scorer also independently bounds its confidence to [0, 1].
    """
    if proposal is None:
        return None, "not_provided"
    if not isinstance(proposal, Mapping):
        return None, "invalid_brief"
    stance = proposal.get("stance")
    confidence = proposal.get("confidence")
    if (not isinstance(stance, str) or stance not in _VALID_STANCES
        or isinstance(confidence, bool) or not isinstance(confidence, (int, float))):
        return None, "invalid_brief"
    try:
        finite_confidence = math.isfinite(confidence)
    except (TypeError, ValueError, OverflowError):
        finite_confidence = False
    if not finite_confidence or not 0 <= confidence <= 1:
        return None, "invalid_brief"
    facts, risk = proposal.get("facts"), proposal.get("risk")
    if not isinstance(facts, (list, tuple)) or len(facts) != 3:
        return None, "missing_cited_facts"
    for fact in facts:
        if (not isinstance(fact, Mapping)
            or not isinstance(fact.get("text"), str)
            or not 8 <= len(fact["text"].strip()) <= 500
            or not isinstance(fact.get("source_ref"), str)
            or not 4 <= len(fact["source_ref"].strip()) <= 300):
            return None, "invalid_cited_fact"
    if not isinstance(risk, str) or not 8 <= len(risk.strip()) <= 500:
        return None, "missing_concrete_risk"
    if stance == "abstain" or confidence == 0:
        return {"stance": "abstain", "confidence": 0.0}, "abstain"
    # The factual content is deliberately NOT passed as executable instructions.
    return {"stance": stance, "confidence": float(confidence)}, "format_accepted_unverified"


def run_decision_agent(
    *, market: Mapping[str, Any] | None = None, chair_brief: Any = None,
    verified_pack: Mapping[str, Any] | None = None,
    evidence_root: Path | None = None,
) -> dict[str, Any]:
    """Build a paper-only decision board with Sentinel veto and no side effects.

    The caller is responsible for proving observations and their timestamps;
    this module does not claim raw market inputs are verified or live.
    """
    valid_market = market is None or isinstance(market, Mapping)
    supplied = dict(market) if isinstance(market, Mapping) else {}
    normalized = {key: supplied[key] for key in _ALLOWED_MARKET if key in supplied}
    operator_halt = supplied.get("operator_halt") is True

    # Explicit Chair argument only: market-provided LLM prompts are never votes.
    chair, chair_status = _chair_vote(chair_brief)
    board = run_xorus(market=normalized, chatgpt_brief=chair)
    rows = board["signals"]
    cut = board["crosscut"]
    core_scored = sum(1 for row in rows
                      if row["family"] != "external" and row["status"] == "scored")
    family_count = len({row["family"] for row in rows
                        if row["family"] != "external" and row["status"] == "scored"})
    veto_signals = sorted(row["id"] for row in rows
                          if row["family"] == "risk"
                          and row["status"] == "scored"
                          and isinstance(row["score"], (int, float))
                          and math.isfinite(row["score"])
                          and row["score"] <= _SAFETY_THRESHOLD)
    veto = bool(veto_signals or operator_halt)
    # Independent verification requires pinned external attestation. A plain
    # build_data_pack dict, proof hash or self-described provider grant cannot
    # unlock verified counts. Evidence-file integrity is tracked separately.
    verified_core, verified_families = count_verified_signals(verified_pack)
    evidence_core, evidence_families = count_proof_bound_signals(
        verified_pack, evidence_root=evidence_root)
    contribution = cut.get("external_capped", 0.0)
    bounded = (isinstance(contribution, (int, float)) and not isinstance(contribution, bool)
               and math.isfinite(contribution) and abs(contribution) <= CHATGPT_CAP + 1e-12)

    base_stance = cut["stance"]
    stance, reason = base_stance, cut["reason"]
    if not valid_market:
        stance, reason = "ABSTAIN", "invalid_market"
    elif not bounded:
        stance, reason = "ABSTAIN", "chair_weight_violation"
    elif veto:
        stance, reason = "ABSTAIN", "sentinel_veto"
    elif core_scored < _MIN_CORE or family_count < _MIN_FAMILIES:
        stance, reason = "ABSTAIN", "thin_tape"
    elif verified_core < _MIN_CORE or verified_families < _MIN_FAMILIES:
        stance, reason = "ABSTAIN", "unverified_tape"

    # Keep both audit trace and consumer-facing crosscut in the same state.
    if stance != base_stance or reason != cut["reason"]:
        cut["pre_guard_stance"] = base_stance
        cut["pre_guard_reason"] = cut["reason"]
    cut["stance"], cut["reason"] = stance, reason
    cut["executable"], cut["live_trading"] = False, False
    cut["verified_core_signals"] = verified_core
    cut["verified_independent_families"] = verified_families
    if verified_pack is not None:
        cut["proof_integrity_checked_signals"] = evidence_core
    board["live_trading"], board["live_locked"] = False, True
    board["handoff_for_chatgpt"] = (
        f"xOrus paper board: {stance} ({reason}); "
        f"{core_scored} simulated scored core signals, {family_count} simulated families; "
        f"{verified_core} verified core signals. "
        "Chair advisory only (<=15%), Sentinel veto. "
        "No trade, mint, signature, price invention or request for secrets."
    )
    decision_counts = {
        "stance": stance,
        "reason": reason,
        "core_signals_scored": core_scored,
        "independent_families_scored": family_count,
        "verified_core_signals": verified_core,
        "verified_independent_families": verified_families,
    }
    if verified_pack is not None:
        decision_counts["proof_integrity_checked_signals"] = evidence_core
        decision_counts["proof_integrity_checked_families"] = evidence_families
    return {
        "engine": "xorus",
        "module": "decision_agent",
        "version": "0.1.1",
        "mode": "paper_only",
        "market_provenance": "unverified_offline_inputs",
        "decision": decision_counts,
        "chair": {
            "status": chair_status,
            "weight_cap": CHATGPT_CAP,
            "external_contribution": contribution if bounded else 0.0,
            "facts_independently_verified": False,
        },
        "sentinel": {
            "veto": veto,
            "veto_signals": veto_signals,
            "operator_halt": operator_halt,
        },
        "safety": {
            "executable": False,
            "live_trading": False,
            "signing_authorized": False,
            "trade_authorized": False,
            "mint_authorized": False,
            "transfer_authorized": False,
            "requires_human_review": True,
        },
        "board": board,
    }
