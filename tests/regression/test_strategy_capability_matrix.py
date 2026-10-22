"""G1: strategy capability matrix — types, uniqueness, counters, CI-wired."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MATRIX_PATH = ROOT / "data" / "strategy_capability_matrix.json"
ALLOWED_STATUS = {"SIMULATION", "BLOCKED", "READY_FOR_APPROVAL"}
ALLOWED_FAMILY = {"trend", "mean", "yield", "hedge", "meta"}
ALLOWED_TX_BUILD = {False, True, "unsigned_only"}


def _load():
    assert MATRIX_PATH.is_file(), f"missing {MATRIX_PATH}"
    data = json.loads(MATRIX_PATH.read_text(encoding="utf-8"))
    assert isinstance(data, dict)
    return data


def test_matrix_schema_version_and_policy():
    m = _load()
    assert m.get("schema_version") >= 2
    policy = m["policy"]
    assert policy["real_funds_require_human_approval_per_order"] is True
    assert policy["automatic_financial_test_operations_allowed"] is False
    assert policy["owner_builder_repartition_proposals"] == "inactive"
    assert policy.get("live_execution_enabled") is False
    assert m["v3_preserved"]["renderer"] == "sites-v3"
    assert m["v3_preserved"]["build_marker"] == "sites-v3-release"


def test_unique_strategy_ids():
    m = _load()
    ids = [s["id"] for s in m["strategies"]]
    assert len(ids) == len(set(ids)), "duplicate strategy ids"
    assert len(ids) == m["summary"]["total"]
    assert m["summary"].get("unique_ids") is True


def test_status_counters_match_rows():
    m = _load()
    rows = m["strategies"]
    sim = sum(1 for s in rows if s["status"] == "SIMULATION")
    blocked = sum(1 for s in rows if s["status"] == "BLOCKED")
    ready = sum(1 for s in rows if s["status"] == "READY_FOR_APPROVAL")
    assert m["summary"]["simulation"] == sim
    assert m["summary"]["blocked"] == blocked
    assert m["summary"]["ready_for_approval"] == ready
    assert sim + blocked + ready == m["summary"]["total"]
    assert m["summary"]["live_execution_enabled"] == 0


def test_types_and_allowed_enums():
    m = _load()
    for s in m["strategies"]:
        assert isinstance(s["id"], str) and s["id"].startswith("STRAT_")
        assert s["family"] in ALLOWED_FAMILY
        assert isinstance(s["paper_only"], bool)
        assert isinstance(s["signal"], bool)
        assert isinstance(s["simulation"], bool)
        assert s["tx_build"] in ALLOWED_TX_BUILD
        assert s["execution"] is False
        assert s["status"] in ALLOWED_STATUS
        assert isinstance(s["network"], str)
        assert isinstance(s["priority_assets"], list)
        assert isinstance(s["blockers"], list)
        assert isinstance(s.get("lot", ""), str)


def test_registry_alignment_paper_only():
    from lia.brain.strategies import STRATEGIES

    m = _load()
    ids = {s["id"] for s in m["strategies"]}
    assert ids == set(STRATEGIES.keys())
    for row in m["strategies"]:
        meta = STRATEGIES[row["id"]]
        assert row["paper_only"] is meta.paper_only, row["id"]
        assert row["family"] == meta.family, row["id"]


def test_micro_proof_approval_gated_not_auto():
    m = _load()
    row = next(s for s in m["strategies"] if s["id"] == "STRAT_MICRO_PROOF")
    assert row["status"] == "READY_FOR_APPROVAL"
    assert row["execution"] is False
    assert row["tx_build"] == "unsigned_only"
    assert "not_auto_enabled" in row["blockers"]
    assert "requires_explicit_human_approval_per_order" in row["blockers"]
    assert row["lot"] == "G1-approval-gated"


def test_transport_lots_reference_present():
    m = _load()
    lots = m["transport_lots_reference"]
    assert lots["files_transported"] == 552
    assert lots["b64_parts"] == 14
    assert lots["archive_bytes"] == 3557672
    assert lots["max_part_bytes"] == 349528
    assert lots["snapshot_sha"].startswith("236d365e")
    assert "historical" in lots["status"]


def test_family_and_lot_summary_consistent():
    m = _load()
    from collections import Counter

    by_f = Counter(s["family"] for s in m["strategies"])
    by_l = Counter(s["lot"] for s in m["strategies"])
    assert m["summary"]["by_family"] == dict(by_f)
    assert m["summary"]["by_lot"] == dict(by_l)


def test_validate_matrix_helper_accepts_canonical():
    from lia.validation.strategy_matrix import validate_matrix

    m = _load()
    validate_matrix(m, registry_check=True)
