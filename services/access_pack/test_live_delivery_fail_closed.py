"""Offline regression tests: the legacy access-pack adapter must never deliver live NFTs."""
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from services.access_pack import webhook_handler as handler


class LiveDeliveryFailClosedTests(unittest.TestCase):
    def setUp(self):
        self.job = handler.MintJob(
            stripe_session_id="cs_test_regression",
            pack_id="pulse",
            buyer_address="erd1" + "q" * 58,
            amount_cents=11000,
            currency="eur",
            status="paid",
        )

    def test_live_mode_never_creates_intent_or_delivery_proof(self):
        with tempfile.TemporaryDirectory() as tmp:
            with patch.object(handler, "RECEIPTS", Path(tmp)), patch.dict(
                os.environ, {"ACCESS_MINT_MODE": "live"}, clear=False
            ):
                result = handler.enqueue_mint(self.job)
                self.assertEqual(result["status"], "failed")
                self.assertEqual(result["error"], "live_nft_delivery_not_certified")
                self.assertIsNone(result["tx_hash"])
                self.assertIsNone(result["nft_identifier"])
                self.assertEqual(list(Path(tmp).iterdir()), [])

    def test_unknown_mode_fails_closed(self):
        with patch.dict(os.environ, {"ACCESS_MINT_MODE": "unexpected"}, clear=False):
            result = handler.enqueue_mint(self.job)
            self.assertEqual(result["status"], "failed")

    def test_paper_mode_does_not_claim_mint(self):
        with tempfile.TemporaryDirectory() as tmp:
            with patch.object(handler, "RECEIPTS", Path(tmp)), patch.dict(
                os.environ, {"ACCESS_MINT_MODE": "paper"}, clear=False
            ):
                result = handler.enqueue_mint(self.job)
                self.assertEqual(result["status"], "minting")
                self.assertIsNone(result["tx_hash"])
                self.assertIsNone(result["nft_identifier"])
                self.assertTrue((Path(tmp) / "intent_cs_test_regression.json").exists())


if __name__ == "__main__":
    unittest.main()
