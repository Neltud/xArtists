#!/usr/bin/env python3
"""VERIFY_G1 — positive suite (8) + invalid rejection suite (9). LIA_LIVE_TRADING=0 only."""
from __future__ import annotations

import argparse
import copy
import json
import os
import sys
from pathlib import Path

os.environ.setdefault("LIA_LIVE_TRADING", "0")
if os.environ.get("LIA_LIVE_TRADING", "0") not in ("0", "false", "False"):
    print("REFUSE: LIA_LIVE_TRADING must be 0 for VERIFY_G1", file=sys.stderr)
    sys.exit(2)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", default=".", help="repo root")
    args = ap.parse_args()
    root = Path(args.repo).resolve()
    sys.path.insert(0, str(root))

    from tests.regression import test_strategy_capability_matrix as t
    from lia.validation.strategy_matrix import validate_matrix, MatrixValidationError

    positives = [
        "test_matrix_schema_version_and_policy",
        "test_unique_strategy_ids",
        "test_status_counters_match_rows",
        "test_types_and_allowed_enums",
        "test_registry_alignment_paper_only",
        "test_micro_proof_approval_gated_not_auto",
        "test_transport_lots_reference_present",
        "test_family_and_lot_summary_consistent",
    ]
    print("=== G1 POSITIVE (8) ===")
    for name in positives:
        getattr(t, name)()
        print(f"PASS {name}")

    matrix_path = root / "data" / "strategy_capability_matrix.json"
    base = json.loads(matrix_path.read_text(encoding="utf-8"))

    def expect_reject(label: str, mutator) -> None:
        bad = copy.deepcopy(base)
        mutator(bad)
        try:
            validate_matrix(bad, registry_check=False)
        except MatrixValidationError as e:
            print(f"REJECT OK {label}: {e}")
            return
        raise AssertionError(f"expected reject for {label}")

    print("=== G1 INVALID REJECTIONS (9) ===")
    expect_reject("duplicate_id", lambda m: m["strategies"].append(copy.deepcopy(m["strategies"][0])))
    expect_reject("bad_status", lambda m: m["strategies"][0].__setitem__("status", "LIVE"))
    expect_reject("execution_true", lambda m: m["strategies"][0].__setitem__("execution", True))
    expect_reject("counter_mismatch", lambda m: m["summary"].__setitem__("simulation", 99))
    expect_reject("live_flag", lambda m: m["summary"].__setitem__("live_execution_enabled", 1))
    expect_reject("proposals_active", lambda m: m["policy"].__setitem__("owner_builder_repartition_proposals", "active"))
    expect_reject("missing_lot", lambda m: m["strategies"][0].__setitem__("lot", ""))
    expect_reject("bad_family", lambda m: m["strategies"][0].__setitem__("family", "options"))
    expect_reject(
        "auto_financial",
        lambda m: m["policy"].__setitem__("automatic_financial_test_operations_allowed", True),
    )

    validate_matrix(base, registry_check=True)
    print("PASS validate_matrix(canonical)")
    print("")
    print("VERIFY_G1 OK — 8 pass + 9 rejects")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
