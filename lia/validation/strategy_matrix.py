"""Strict validation of data/strategy_capability_matrix.json (G1)."""
from __future__ import annotations

from collections import Counter
from typing import Any

ALLOWED_STATUS = frozenset({"SIMULATION", "BLOCKED", "READY_FOR_APPROVAL"})
ALLOWED_FAMILY = frozenset({"trend", "mean", "yield", "hedge", "meta"})
ALLOWED_TX_BUILD = frozenset({False, True, "unsigned_only"})


class MatrixValidationError(ValueError):
    pass


def validate_matrix(data: dict[str, Any], *, registry_check: bool = True) -> None:
    if not isinstance(data, dict):
        raise MatrixValidationError("matrix must be object")
    if int(data.get("schema_version", 0)) < 2:
        raise MatrixValidationError("schema_version must be >= 2")

    policy = data.get("policy") or {}
    if policy.get("real_funds_require_human_approval_per_order") is not True:
        raise MatrixValidationError("policy.real_funds_require_human_approval_per_order must be true")
    if policy.get("automatic_financial_test_operations_allowed") is not False:
        raise MatrixValidationError("policy.automatic_financial_test_operations_allowed must be false")
    if policy.get("owner_builder_repartition_proposals") != "inactive":
        raise MatrixValidationError("owner_builder_repartition_proposals must be inactive")
    if policy.get("live_execution_enabled") is not False:
        raise MatrixValidationError("policy.live_execution_enabled must be false")

    strategies = data.get("strategies")
    if not isinstance(strategies, list) or not strategies:
        raise MatrixValidationError("strategies must be non-empty list")

    ids: list[str] = []
    for s in strategies:
        if not isinstance(s, dict):
            raise MatrixValidationError("strategy row must be object")
        sid = s.get("id")
        if not isinstance(sid, str) or not sid.startswith("STRAT_"):
            raise MatrixValidationError(f"invalid id: {sid!r}")
        ids.append(sid)
        if s.get("family") not in ALLOWED_FAMILY:
            raise MatrixValidationError(f"bad family for {sid}")
        if not isinstance(s.get("paper_only"), bool):
            raise MatrixValidationError(f"paper_only must be bool for {sid}")
        if s.get("tx_build") not in ALLOWED_TX_BUILD:
            raise MatrixValidationError(f"bad tx_build for {sid}")
        if s.get("execution") is not False:
            raise MatrixValidationError(f"execution must be false for {sid}")
        if s.get("status") not in ALLOWED_STATUS:
            raise MatrixValidationError(f"bad status for {sid}")
        lot = s.get("lot")
        if not isinstance(lot, str) or not lot.strip():
            raise MatrixValidationError(f"missing lot for {sid}")

    if len(ids) != len(set(ids)):
        raise MatrixValidationError("duplicate strategy ids")

    summary = data.get("summary") or {}
    sim = sum(1 for s in strategies if s["status"] == "SIMULATION")
    blocked = sum(1 for s in strategies if s["status"] == "BLOCKED")
    ready = sum(1 for s in strategies if s["status"] == "READY_FOR_APPROVAL")
    if summary.get("simulation") != sim:
        raise MatrixValidationError("summary.simulation mismatch")
    if summary.get("blocked") != blocked:
        raise MatrixValidationError("summary.blocked mismatch")
    if summary.get("ready_for_approval") != ready:
        raise MatrixValidationError("summary.ready_for_approval mismatch")
    if summary.get("total") != len(strategies):
        raise MatrixValidationError("summary.total mismatch")
    if summary.get("live_execution_enabled") != 0:
        raise MatrixValidationError("live_execution_enabled must be 0")
    if summary.get("unique_ids") is not True:
        raise MatrixValidationError("summary.unique_ids must be true")

    by_f = Counter(s["family"] for s in strategies)
    by_l = Counter(s["lot"] for s in strategies)
    if summary.get("by_family") != dict(by_f):
        raise MatrixValidationError("summary.by_family mismatch")
    if summary.get("by_lot") != dict(by_l):
        raise MatrixValidationError("summary.by_lot mismatch")

    lots = data.get("transport_lots_reference") or {}
    if lots.get("files_transported") != 552 or lots.get("b64_parts") != 14:
        raise MatrixValidationError("transport lots must match VALIDATION report (552/14)")

    v3 = data.get("v3_preserved") or {}
    if v3.get("renderer") != "sites-v3" or v3.get("build_marker") != "sites-v3-release":
        raise MatrixValidationError("v3_preserved markers invalid")

    if registry_check:
        from lia.brain.strategies import STRATEGIES

        if set(ids) != set(STRATEGIES.keys()):
            raise MatrixValidationError("matrix ids != registry")
        for s in strategies:
            meta = STRATEGIES[s["id"]]
            if s["paper_only"] is not meta.paper_only or s["family"] != meta.family:
                raise MatrixValidationError(f"registry mismatch {s['id']}")
