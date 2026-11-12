"""Offline safety contracts for the xOrus Decision Agent."""
import math
import unittest

from lia.chorus.swarm import CHATGPT_CAP
from lia.xorus.decision_agent import run_decision_agent


def valid_chair(stance="long", confidence=1.0):
    return {
        "stance": stance,
        "confidence": confidence,
        "facts": [
            {"text": "Offline test fact one", "source_ref": "fixture:one"},
            {"text": "Offline test fact two", "source_ref": "fixture:two"},
            {"text": "Offline test fact three", "source_ref": "fixture:three"},
        ],
        "risk": "Offline test risk: data may be incomplete",
    }


class XOrusDecisionAgentTests(unittest.TestCase):
    def assert_locked(self, result):
        self.assertEqual(result["engine"], "xorus")
        self.assertEqual(result["mode"], "paper_only")
        self.assertEqual(result["market_provenance"], "unverified_offline_inputs")
        self.assertFalse(result["board"]["live_trading"])
        self.assertTrue(result["board"]["live_locked"])
        self.assertFalse(result["board"]["crosscut"]["executable"])
        for key in ("executable", "live_trading", "signing_authorized",
                    "trade_authorized", "mint_authorized", "transfer_authorized"):
            self.assertIs(result["safety"][key], False, key)
        self.assertTrue(result["safety"]["requires_human_review"])
        self.assertLessEqual(abs(result["chair"]["external_contribution"]), CHATGPT_CAP)
        self.assertEqual(result["decision"]["verified_core_signals"], 0)
        self.assertEqual(result["decision"]["verified_independent_families"], 0)

    def test_no_input_abstains_and_never_fakes_120_live_signals(self):
        out = run_decision_agent()
        self.assert_locked(out)
        self.assertEqual(out["board"]["crosscut"]["signals_defined"], 120)
        self.assertEqual(out["board"]["crosscut"]["signals_fed"], 0)
        self.assertEqual(out["decision"]["stance"], "ABSTAIN")
        self.assertEqual(out["decision"]["reason"], "thin_tape")
        self.assertEqual(out["chair"]["status"], "not_provided")

    def test_malicious_execution_and_chair_in_market_cannot_activate(self):
        out = run_decision_agent(market={
            "chatgpt_brief": valid_chair(),
            "external_brief": valid_chair(),
            "live_trading": True, "executable": True,
            "signing_authorized": True, "mint_authorized": True,
            "seed_phrase": "never_echo_this_test_secret",
        })
        self.assert_locked(out)
        self.assertEqual(out["chair"]["status"], "not_provided")
        self.assertEqual(out["board"]["crosscut"]["signals_fed"], 0)
        self.assertNotIn("never_echo_this_test_secret", str(out))

    def test_valid_chair_is_bounded_but_not_data_family(self):
        for stance in ("long", "short", "flat"):
            with self.subTest(stance=stance):
                out = run_decision_agent(chair_brief=valid_chair(stance))
                self.assert_locked(out)
                self.assertEqual(out["decision"]["stance"], "ABSTAIN")
                self.assertEqual(out["decision"]["reason"], "thin_tape")
                self.assertEqual(out["decision"]["core_signals_scored"], 0)
                self.assertEqual(out["decision"]["independent_families_scored"], 0)
                self.assertEqual(out["chair"]["status"], "format_accepted_unverified")
                self.assertFalse(out["chair"]["facts_independently_verified"])

    def test_abstaining_chair_is_not_scored(self):
        out = run_decision_agent(chair_brief=valid_chair("abstain", .8))
        self.assert_locked(out)
        self.assertEqual(out["chair"]["status"], "abstain")
        self.assertEqual(out["board"]["crosscut"]["signals_fed"], 0)

    def test_missing_cited_facts_or_risk_rejected(self):
        variants = [
            {"stance": "long", "confidence": 1.0},
            {**valid_chair(), "facts": []},
            {**valid_chair(), "facts": ["one", "two", "three"]},
            {**valid_chair(), "risk": ""},
            {**valid_chair(), "facts": [{"text": "example fact", "source_ref": "test"}] * 2},
        ]
        for v in variants:
            with self.subTest(v=v):
                out = run_decision_agent(chair_brief=v)
                self.assert_locked(out)
                self.assertNotEqual(out["chair"]["status"], "format_accepted_unverified")
                self.assertEqual(out["board"]["crosscut"]["signals_fed"], 0)

    def test_invalid_stance_confidence_and_prompt_rejected(self):
        variants = [
            "BUY", {**valid_chair(), "stance": "buy"},
            valid_chair("long", True),
            valid_chair("long", float("nan")),
            valid_chair("short", float("inf")),
            valid_chair("long", "0.5"),
            valid_chair("long", 1.01),
            valid_chair("short", -.2),
            valid_chair("long", 10 ** 1000),
        ]
        for v in variants:
            with self.subTest(v=v):
                out = run_decision_agent(chair_brief=v)
                self.assert_locked(out)
                self.assertEqual(out["chair"]["status"], "invalid_brief")

    def test_severe_scored_risk_triggers_sentinel_veto(self):
        out = run_decision_agent(market={"drawdown": 0.20, "price_change_1h": 2})
        self.assert_locked(out)
        self.assertEqual(out["sentinel"]["veto_signals"], ["risk.drawdown"])
        self.assertTrue(out["sentinel"]["veto"])
        self.assertEqual(out["decision"]["stance"], "ABSTAIN")
        self.assertEqual(out["decision"]["reason"], "sentinel_veto")
        self.assertEqual(out["board"]["crosscut"]["reason"], "sentinel_veto")

    def test_scored_nonpayable_risk_also_vetoes(self):
        out = run_decision_agent(market={"slot_payable": False})
        self.assert_locked(out)
        self.assertIn("risk.payable_flag", out["sentinel"]["veto_signals"])
        self.assertEqual(out["decision"]["reason"], "sentinel_veto")
        # Boolean/strings masquerading as chain measurements cannot be scored.
        for v in ("false", 0, None, True):
            out = run_decision_agent(market={"slot_payable": v})
            self.assertNotIn("risk.payable_flag", out["sentinel"]["veto_signals"])

    def test_operator_halt_is_only_additional_restriction(self):
        out = run_decision_agent(market={"operator_halt": True})
        self.assert_locked(out)
        self.assertTrue(out["sentinel"]["operator_halt"])
        self.assertTrue(out["sentinel"]["veto"])
        self.assertEqual(out["decision"]["reason"], "sentinel_veto")

    def test_invalid_market_fails_closed(self):
        for value in ([], "", "price_change_1h=1", 1, True):
            with self.subTest(value=value):
                out = run_decision_agent(market=value)
                self.assert_locked(out)
                self.assertEqual(out["decision"]["stance"], "ABSTAIN")
                self.assertEqual(out["decision"]["reason"], "invalid_market")

    def test_numeric_nan_and_infinity_are_not_measurements(self):
        for value in (float("nan"), float("inf"), float("-inf"), True):
            out = run_decision_agent(market={"price_change_1h": value})
            self.assert_locked(out)
            self.assertEqual(out["decision"]["core_signals_scored"], 0)

    def test_simulated_quorum_never_becomes_verified_consensus(self):
        # Regression for future scorer expansion: even 12 scored values
        # from unverified offline fields cannot become a trading bias.
        from unittest.mock import patch
        signals = [
            {"id": f"{family}.fixture_{i}", "family": family,
             "status": "scored", "score": 0.8}
            for family in ("price", "volume", "liquidity") for i in range(4)
        ]
        simulated_board = {
            "signals": signals,
            "crosscut": {
                "stance": "PAPER_BIAS_LONG", "reason": "crosscut",
                "external_capped": 0.15, "executable": False,
            },
            "live_trading": False,
            "live_locked": True,
        }
        with patch("lia.xorus.decision_agent.run_xorus", return_value=simulated_board):
            out = run_decision_agent(market={"price_change_1h": 1},
                                     chair_brief=valid_chair())
        self.assert_locked(out)
        self.assertEqual(out["decision"]["core_signals_scored"], 12)
        self.assertEqual(out["decision"]["independent_families_scored"], 3)
        self.assertEqual(out["decision"]["verified_core_signals"], 0)
        self.assertEqual(out["decision"]["verified_independent_families"], 0)
        self.assertEqual(out["decision"]["stance"], "ABSTAIN")
        self.assertEqual(out["decision"]["reason"], "unverified_tape")
        self.assertEqual(out["board"]["crosscut"]["stance"], "ABSTAIN")

    def test_consumer_board_and_decision_never_conflict(self):
        cases = [{}, {"operator_halt": True}, {"drawdown": .2},
                 {"price_change_1h": 1, "volume_spike": 1.5},
                 {"slot_payable": False}]
        for inputs in cases:
            out = run_decision_agent(market=inputs, chair_brief=valid_chair())
            self.assertEqual(out["board"]["crosscut"]["stance"], out["decision"]["stance"])
            self.assertEqual(out["board"]["crosscut"]["reason"], out["decision"]["reason"])
            self.assertIn(out["decision"]["reason"], out["board"]["handoff_for_chatgpt"])


if __name__ == "__main__":
    unittest.main()
