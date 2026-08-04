"""Tests for lia.claude_agent.pyramids_adapter"""
from __future__ import annotations

import sys
import types
import unittest
import warnings
from pathlib import Path

# repo root on path
_ROOT = Path(__file__).resolve().parents[3]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from lia.claude_agent.pyramids_adapter import (  # noqa: E402
    PyramidsAdapterWarning,
    _FIXED_WEIGHTS,
    pyramids_allocator,
    pyramids_external_allocator,
    sleeves_to_weights,
)
from lia.claude_agent.strategy_base import StrategyPerformance  # noqa: E402


def perf(sid: str, trades: int, wins: int) -> StrategyPerformance:
    return StrategyPerformance(
        strategy_id=sid,
        trades_count=trades,
        wins=wins,
        losses=trades - wins,
        total_pnl_pct=0.0,
    )


class TestFixedWeights(unittest.TestCase):
    def test_contract(self):
        self.assertAlmostEqual(_FIXED_WEIGHTS["MOM"], 0.15)
        self.assertAlmostEqual(_FIXED_WEIGHTS["MR"], 0.15)
        self.assertAlmostEqual(_FIXED_WEIGHTS["MICRO_ARB"], 0.20)
        self.assertAlmostEqual(_FIXED_WEIGHTS["WEEKLY_SWING"], 0.10)
        self.assertAlmostEqual(_FIXED_WEIGHTS["YIELD"], 0.25)
        self.assertAlmostEqual(_FIXED_WEIGHTS["RESERVE"], 0.15)
        self.assertAlmostEqual(sum(_FIXED_WEIGHTS.values()), 1.0, places=9)


class TestAllocatorIgnoresPerf(unittest.TestCase):
    def test_same_weights_extreme_perfs(self):
        a = pyramids_external_allocator([perf("MOM", 100, 99)], 1000)
        b = pyramids_external_allocator([perf("MOM", 100, 1)], 1000)
        self.assertEqual(a.weights, b.weights)
        self.assertAlmostEqual(a.weights["MOM"], 0.15)

    def test_empty_perfs(self):
        r = pyramids_external_allocator([], 100.0)
        self.assertAlmostEqual(r.budget_per_strategy["YIELD"], 25.0, places=5)

    def test_alias(self):
        self.assertIs(pyramids_allocator, pyramids_external_allocator)


class TestLivePyramid(unittest.TestCase):
    def setUp(self):
        for name in ("lia.circuit.compound_pyramids",):
            # don't wipe whole lia — only override compound module if needed
            pass

    def test_sleeves_to_weights_runs(self):
        w = sleeves_to_weights()
        self.assertAlmostEqual(sum(w.values()), 1.0, places=6)
        self.assertIn("MOM", w)


if __name__ == "__main__":
    unittest.main(verbosity=2)
