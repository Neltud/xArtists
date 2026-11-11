"""Compatibility and execution-invariant tests for Xorus naming migration."""
import unittest

from lia.chorus.swarm import run_chorus
from lia.xorus import run_xorus
from lia.xorus.catalog import catalog


class XorusCompatibilityTest(unittest.TestCase):
    def test_catalog_remains_120(self):
        self.assertEqual(len(catalog()), 120)

    def test_xorus_is_paper_only_on_empty_input(self):
        board = run_xorus()
        self.assertEqual(board["engine"], "xorus")
        self.assertEqual(board["legacy_engine"], "chorus")
        self.assertEqual(board["crosscut"]["stance"], "ABSTAIN")
        self.assertEqual(board["crosscut"]["reason"], "thin_tape")
        self.assertFalse(board["crosscut"]["executable"])
        self.assertFalse(board["crosscut"]["live_trading"])
        self.assertFalse(board["live_trading"])
        self.assertTrue(board["live_locked"])
        self.assertTrue(board["handoff_for_chatgpt"].startswith("XORUS →"))

    def test_market_request_cannot_enable_execution(self):
        board = run_xorus(market={"LIA_LIVE_TRADING": True, "live_trading": True, "executable": True})
        self.assertFalse(board["live_trading"])
        self.assertFalse(board["crosscut"]["executable"])

    def test_legacy_identifier_stays_readable(self):
        self.assertEqual(run_chorus()["engine"], "chorus")


if __name__ == "__main__":
    unittest.main()
