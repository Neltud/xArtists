"""Offline safety tests: chain-derived transaction samples are not execution permits."""
import time
import unittest

from lia.memory.onchain_memory import MemorySnapshot, should_pace_trade


def sample(tx_count: int, last_swap_ts: int) -> MemorySnapshot:
    return MemorySnapshot(
        wallet="erd1test",
        fetched_at="2026-11-06T00:00:00Z",
        tx_count=tx_count,
        last_swap_ts=last_swap_ts,
    )


class ChainMemoryPacingTests(unittest.TestCase):
    def test_empty_sample_never_authorizes(self):
        allowed, reason = should_pace_trade(sample(0, 0))
        self.assertFalse(allowed)
        self.assertIn("no chain transactions", reason)

    def test_unknown_last_swap_never_authorizes(self):
        allowed, reason = should_pace_trade(sample(15, 0))
        self.assertFalse(allowed)
        self.assertIn("unknown", reason)

    def test_recent_swap_blocks(self):
        allowed, reason = should_pace_trade(sample(15, int(time.time()) - 60))
        self.assertFalse(allowed)
        self.assertIn("last swap", reason)

    def test_old_swap_passes_cadence_only(self):
        allowed, reason = should_pace_trade(sample(15, int(time.time()) - 7200))
        self.assertTrue(allowed)
        self.assertIn("pace ok", reason)

    def test_future_timestamp_blocks(self):
        allowed, reason = should_pace_trade(sample(15, int(time.time()) + 300))
        self.assertFalse(allowed)
        self.assertIn("future", reason)


if __name__ == "__main__":
    unittest.main()
