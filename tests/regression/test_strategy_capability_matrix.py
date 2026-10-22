"""G1: strategy capability matrix must stay aligned with lia.brain.strategies registry."""
from __future__ import annotations

import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


class TestStrategyCapabilityMatrix(unittest.TestCase):
    def setUp(self) -> None:
        matrix_path = ROOT / "data" / "strategy_capability_matrix.json"
        self.assertTrue(matrix_path.is_file(), f"missing {matrix_path}")
        self.matrix = json.loads(matrix_path.read_text(encoding="utf-8"))
        from lia.brain.strategies import STRATEGIES  # type: ignore

        self.registry = STRATEGIES

    def test_count_matches_registry(self) -> None:
        ids = {s["id"] for s in self.matrix["strategies"]}
        self.assertEqual(ids, set(self.registry.keys()))
        self.assertEqual(self.matrix["summary"]["total"], len(self.registry))

    def test_paper_only_flags(self) -> None:
        for row in self.matrix["strategies"]:
            meta = self.registry[row["id"]]
            self.assertEqual(
                row["paper_only"],
                meta.paper_only,
                f"{row['id']} paper_only mismatch matrix vs registry",
            )

    def test_no_live_execution_enabled(self) -> None:
        self.assertEqual(self.matrix["summary"]["live_execution_enabled"], 0)
        for row in self.matrix["strategies"]:
            self.assertFalse(row.get("execution") is True)
            self.assertIn(row["status"], ("SIMULATION", "BLOCKED", "READY_FOR_APPROVAL"))

    def test_policy_locks(self) -> None:
        policy = self.matrix["policy"]
        self.assertTrue(policy["real_funds_require_human_approval_per_order"])
        self.assertFalse(policy["automatic_financial_test_operations_allowed"])
        self.assertEqual(policy["owner_builder_repartition_proposals"], "inactive")

    def test_micro_proof_not_auto(self) -> None:
        row = next(s for s in self.matrix["strategies"] if s["id"] == "STRAT_MICRO_PROOF")
        self.assertEqual(row["status"], "READY_FOR_APPROVAL")
        self.assertIn("not_auto_enabled", row["blockers"])
        self.assertIn("requires_explicit_human_approval_per_order", row["blockers"])


if __name__ == "__main__":
    unittest.main()
