"""Offline regression tests for human-in-the-loop OneDex preparation.

No real quotes, signatures, private keys or broadcasts in this test module.
"""
import unittest
from dataclasses import replace
from unittest.mock import patch

from xorus.execution.assisted import run_assisted
from xorus.execution.policy import check_intent
from xorus.execution.types import SwapIntent


SENDER = "erd1" + "q" * 58  # syntax-only fixture, not a real wallet
SAFE_LINK = "https://wallet.multiversx.com/hook/transaction?mock=unsigned"


def intent(**changes):
    return replace(SwapIntent(
        token_in="EGLD", token_out="ONE", amount_in="0.1", sender=SENDER
    ), **changes)


class SwapPolicyTests(unittest.TestCase):
    def test_exact_token_allowlist_refuses_lookalike_identifiers(self):
        for token in ("USDC-evil99", "ONE-unknown", "EGLD-invented"):
            with self.subTest(token=token):
                self.assertFalse(check_intent(intent(token_out=token)).allowed)

    def test_rejects_nonfinite_and_invalid_amounts(self):
        for amount in ("NaN", "Infinity", "-Infinity", "0", "-1", "oops", "1e1000"):
            with self.subTest(amount=amount):
                self.assertFalse(check_intent(intent(amount_in=amount)).allowed)

    def test_rejects_invalid_slippage_and_sender(self):
        for slip in (-1, 301, True, 1.5):
            with self.subTest(slip=slip):
                self.assertFalse(check_intent(intent(max_slippage_bps=slip)).allowed)
        self.assertFalse(check_intent(intent(sender="erd1" + "x" * 58)).allowed)
        self.assertFalse(check_intent(intent(sender=SENDER + "z")).allowed)

    def test_allows_bounded_intent(self):
        self.assertTrue(check_intent(intent()).allowed)


class AssistedPreparationTests(unittest.TestCase):
    def _run(self, *, quote=None, build=None, sim=None, **flags):
        quoted = quote if quote is not None else {
            "quotedOut": "100", "minOut": {"human": "99", "raw": "99000000"}
        }
        built = build if build is not None else {
            "transaction": {"mock": "unsigned"},
            "minOut": {"human": "99", "raw": "99000000"},
            "signingLink": SAFE_LINK,
        }
        simulated = sim if sim is not None else {
            "status": "success", "meetsMinOut": True
        }
        with patch("xorus.execution.assisted.client.get_quote", return_value=quoted), \
             patch("xorus.execution.assisted.client.build_swap_tx", return_value=built), \
             patch("xorus.execution.assisted.client.simulate_swap_tx", return_value=simulated):
            return run_assisted(intent(), **flags)

    def test_happy_path_still_requires_human_signature(self):
        result = self._run()
        self.assertEqual(result.stage, "ready_to_sign")
        self.assertTrue(result.requires_human_signature)
        self.assertEqual(result.build.signing_link, SAFE_LINK)

    def test_quote_cannot_be_skipped(self):
        result = self._run(skip_quote=True)
        self.assertEqual(result.stage, "blocked")
        self.assertFalse(result.requires_human_signature)

    def test_no_minimum_output_blocks_simulation(self):
        result = self._run(build={
            "transaction": {"mock": "unsigned"}, "signingLink": SAFE_LINK
        })
        self.assertEqual(result.stage, "blocked")
        self.assertFalse(result.requires_human_signature)

    def test_unknown_or_failed_simulation_never_exposes_ready_stage(self):
        for sim in (
            {"status": "success"},
            {"status": "success", "meetsMinOut": "false"},
            {"status": "success", "meetsMinOut": False},
            {"status": "fail", "meetsMinOut": True},
        ):
            with self.subTest(sim=sim):
                result = self._run(sim=sim)
                self.assertNotEqual(result.stage, "ready_to_sign")
                self.assertFalse(result.requires_human_signature)

    def test_signing_link_must_be_exact_wallet_origin(self):
        for link in (
            None,
            "http://wallet.multiversx.com/hook/transaction",
            "https://wallet.multiversx.com.evil.test/hook/transaction",
            "https://evil.test/hook/transaction",
            "https://attacker@wallet.multiversx.com/hook/transaction",
            "javascript:alert(1)",
        ):
            with self.subTest(link=link):
                result = self._run(build={
                    "transaction": {"mock": "unsigned"},
                    "minOutRaw": "99000000", "signingLink": link,
                })
                self.assertEqual(result.stage, "blocked")
                self.assertFalse(result.requires_human_signature)


if __name__ == "__main__":
    unittest.main()
