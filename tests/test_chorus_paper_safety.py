"""Chorus paper safety invariants — no network, keys, orders or deployments."""
import math
import unittest

from lia.chorus.catalog import FAMILIES, catalog
from lia.chorus.swarm import CHATGPT_CAP, crosscut, run_chorus, score_signal


def pick(name):
    return next(row for row in catalog() if row["id"] == name)


class ChorusSafetyTests(unittest.TestCase):
    def test_catalog_is_fixed(self):
        rows = catalog()
        self.assertEqual(len(rows), 120)
        self.assertEqual(len(set(row["id"] for row in rows)), 120)
        self.assertEqual(len(FAMILIES), 12)

    def test_no_input_never_invents_slot_payable_flag(self):
        board = run_chorus()
        signals = {row["id"]: row for row in board["signals"]}
        self.assertEqual(signals["risk.payable_flag"]["status"], "no_input")
        self.assertEqual(board["crosscut"]["signals_fed"], 0)
        self.assertEqual(board["crosscut"]["families_fed"], 0)
        self.assertEqual(board["crosscut"]["reason"], "thin_tape")
        self.assertEqual(board["crosscut"]["stance"], "ABSTAIN")
        self.assertFalse(board["crosscut"]["executable"])
        self.assertFalse(board["live_trading"])
        self.assertTrue(board["live_locked"])

    def test_only_explicit_chain_probe_can_score_payability(self):
        for value in (None, "false", 0, 1, "unknown", True):
            self.assertEqual(score_signal(pick("risk.payable_flag"), {"slot_payable": value})["status"], "no_input")
        row = score_signal(pick("risk.payable_flag"), {"slot_payable": False})
        self.assertEqual(row["status"], "scored")
        self.assertEqual(row["score"], -0.8)

    def test_invalid_numeric_input_not_fed(self):
        for x in (float("nan"), float("inf"), float("-inf"), "NaN", "Infinity", True, False, [], {}, "bad"):
            for name, field in (
                ("price.ret_1h", "price_change_1h"),
                ("volume.spike_1h", "volume_spike"),
                ("risk.drawdown", "drawdown"),
                ("liquidity.pool_usd", "liquidity_usd"),
            ):
                row = score_signal(pick(name), {field: x})
                self.assertEqual(row["status"], "no_input", msg=(name, x))

    def test_unfed_and_chair_abstention_cannot_vote(self):
        for brief in (None, {}, "abstain", {"note": "abstain"}, {"stance": "abstain", "confidence": 0.0},
                      {"stance": "long", "confidence": float("nan")},
                      {"stance": "short", "confidence": float("inf")},
                      {"stance": "long", "confidence": True},
                      {"stance": "please buy", "confidence": 1.0},
                      {"stance": "long", "confidence": 1.1},
                      {"stance": "short", "confidence": -0.1}):
            row = score_signal(pick("external.chatgpt_brief"), {"chatgpt_brief": brief})
            self.assertNotEqual(row["status"], "scored", msg=brief)
            self.assertEqual(row["score"], 0)

    def test_explicit_nonzero_advice_is_bounded_and_nonexecutable(self):
        for stance, expected in (("long", 0.6), ("short", -0.6), ("flat", 0.0)):
            brief = {"stance": stance, "confidence": 1.0}
            board = run_chorus(market={"chatgpt_brief": brief})
            row = next(s for s in board["signals"] if s["id"] == "external.chatgpt_brief")
            self.assertEqual(row["status"], "scored")
            self.assertEqual(row["score"], expected)
            self.assertLessEqual(abs(board["crosscut"]["external_capped"]), CHATGPT_CAP)
            self.assertEqual(board["crosscut"]["stance"], "ABSTAIN")
            self.assertEqual(board["crosscut"]["reason"], "thin_tape")
            self.assertEqual(board["crosscut"]["families_fed"], 0)
            self.assertFalse(board["crosscut"]["executable"])

    def test_risk_veto_survives_twelve_votes(self):
        rows = [{"family": fam, "status": "scored", "score": score}
                for fam, score in (("price", 0.8), ("volume", 0.8), ("risk", -0.4))
                for _ in range(4)]
        means = {fam: 0.0 for fam in FAMILIES}
        means.update({"price": 0.8, "volume": 0.8, "risk": -0.4, "external": 0.6})
        out = crosscut(rows, means)
        self.assertEqual(out["signals_fed"], 12)
        self.assertEqual(out["families_fed"], 3)
        self.assertEqual(out["reason"], "risk_veto")
        self.assertEqual(out["stance"], "ABSTAIN")
        self.assertFalse(out["executable"])

    def test_external_weight_is_at_most_fifteen_percent(self):
        rows = [{"family": fam, "status": "scored", "score": score}
                for fam, score in (("price", 0.5), ("volume", 0.5), ("risk", 0.2))
                for _ in range(4)]
        means = {fam: 0.0 for fam in FAMILIES}
        means.update({"price": 0.5, "volume": 0.5, "risk": 0.2, "external": 1.0})
        out = crosscut(rows, means)
        core = (0.5 + 0.5 + 0.2) / 3
        self.assertAlmostEqual(out["blended"], round(core * 0.85 + 0.15, 4))
        self.assertEqual(out["external_capped"], 0.15)
        self.assertFalse(out["executable"])


if __name__ == "__main__":
    unittest.main()
