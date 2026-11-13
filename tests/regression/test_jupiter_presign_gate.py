"""Regression: a Jupiter API response can never lead to a signature in paper-only xArtists."""
import unittest
from unittest.mock import patch

from lia.executor import jupiter_solana as jup


class JupiterPreSignGateTests(unittest.TestCase):
    def test_low_level_signer_always_refuses_even_when_invoked_directly(self):
        with patch.object(jup, "_http_post", side_effect=AssertionError("network must not be used")):
            with self.assertRaisesRegex(RuntimeError, "SOLANA_JUPITER_SIGNING_BLOCKED"):
                jup._send_versioned_tx("not-a-transaction", object())

    def test_live_flag_cannot_load_keys_quote_or_request_swap(self):
        with (
            patch.object(jup, "LIVE", True),
            patch.object(jup, "_load_keypair_pubkey", side_effect=AssertionError("key read")),
            patch.object(jup, "get_quote", side_effect=AssertionError("quote request")),
            patch.object(jup, "build_swap_transaction", side_effect=AssertionError("swap request")),
            patch.object(jup, "_send_versioned_tx", side_effect=AssertionError("send")),
        ):
            result = jup.JupiterExecutor().execute_swap(
                input_mint="SOL", output_mint="USDC", amount=10000
            )
            self.assertFalse(result.ok)
            self.assertEqual(result.mode, "blocked")
            self.assertIn("SOLANA_JUPITER_SIGNING_BLOCKED", result.detail)
            health = jup.JupiterExecutor().health()
            self.assertFalse(health["live"])
            self.assertTrue(health["live_requested"])
            self.assertFalse(health["signing_enabled"])

    def test_paper_quote_still_reports_no_broadcast(self):
        quote = {
            "inputMint": jup.MINTS["SOL"],
            "outputMint": jup.MINTS["USDC"],
            "inAmount": "10000", "outAmount": "5",
            "priceImpactPct": "0.01", "routePlan": [],
        }
        with (
            patch.object(jup, "LIVE", True),
            patch.object(jup, "get_quote", return_value=quote),
            patch.object(jup, "_load_keypair_pubkey", side_effect=AssertionError("key read")),
            patch.object(jup, "build_swap_transaction", side_effect=AssertionError("swap request")),
        ):
            result = jup.JupiterExecutor().execute_swap(
                input_mint="SOL", output_mint="USDC", amount=10000, force_paper=True
            )
            self.assertTrue(result.ok)
            self.assertEqual(result.mode, "paper")
            self.assertIn("no broadcast", result.detail)


if __name__ == "__main__":
    unittest.main()
