"""Tests for lia.claude_agent.signal_bus"""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

_ROOT = Path(__file__).resolve().parents[3]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from lia.claude_agent.signal_bus import (  # noqa: E402
    Signal,
    SignalBus,
    SignalError,
    map_social_bias,
    normalize_confidence_0_1,
)


def sig(source, category, bias, confidence, ts, max_age=3600):
    return Signal(
        source=source,
        category=category,
        bias=bias,
        confidence=confidence,
        timestamp=ts,
        max_age_seconds=max_age,
    )


class TestMapBias(unittest.TestCase):
    def test_buy_sell_wait(self):
        self.assertEqual(map_social_bias("BUY"), "ACCUMULATE")
        self.assertEqual(map_social_bias("SELL"), "DISTRIBUTE")
        self.assertEqual(map_social_bias("WAIT"), "NEUTRAL")


class TestNormalize(unittest.TestCase):
    def test_scales(self):
        self.assertAlmostEqual(normalize_confidence_0_1(0.68), 0.68)
        self.assertAlmostEqual(normalize_confidence_0_1(68), 0.68)


class TestBus(unittest.TestCase):
    def test_default_social_cap(self):
        bus = SignalBus()
        bus.publish(sig("social_intel", "crypto", "DISTRIBUTE", 1.0, 0))
        bus.publish(sig("greensmoke.lia", "crypto", "ACCUMULATE", 0.60, 0))
        r = bus.composite_bias("crypto", now=0)
        self.assertEqual(r.bias, "ACCUMULATE")

    def test_add_social_maps_buy(self):
        bus = SignalBus()
        s = bus.add_social_from_bias({"bias": "BUY", "confidence": 0.7}, now=0)
        self.assertIsNotNone(s)
        self.assertEqual(s.bias, "ACCUMULATE")
        self.assertEqual(s.source, "social_intel")

    def test_rumor_blocks_accumulate(self):
        bus = SignalBus()
        s = bus.add_social_from_bias(
            {"bias": "BUY", "confidence": 0.9, "rumor_flag": True}, now=0
        )
        self.assertEqual(s.bias, "NEUTRAL")

    def test_composite_no_args(self):
        bus = SignalBus()
        bus.add_social_from_bias({"bias": "SELL", "confidence": 0.5}, now=0)
        out = bus.composite(now=0)
        self.assertIn("social", out)
        self.assertEqual(out["social"].bias, "DISTRIBUTE")

    def test_stale_excluded(self):
        bus = SignalBus()
        bus.publish(sig("x", "crypto", "ACCUMULATE", 0.9, ts=0, max_age=10))
        self.assertEqual(bus.get_active_signals("crypto", now=100), [])


if __name__ == "__main__":
    unittest.main(verbosity=2)
