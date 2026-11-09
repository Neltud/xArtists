"""Paper intent: mandates, rails, and adversarial refusals. No chain."""
from __future__ import annotations

import unittest

from lia.intent.buy_pack import classify_utterance, quote_buy_pack
from lia.intent.mandate_ledger import MandateLedger


class IntentPaperTest(unittest.TestCase):
    def setUp(self) -> None:
        self.ledger = MandateLedger(b"test-secret-value")

    def test_single_use_and_replay(self) -> None:
        mandate = self.ledger.issue(
            mandate_id="m-1",
            subject="paper-visitor",
            scope="BUY_PACK",
            asset="pulse",
            max_amount="110",
            currency="EUR",
            nonce="n-1",
            issued_at=1_700_000_000,
            ttl_seconds=120,
        )
        self.assertFalse(mandate["live_authorized"])
        first = self.ledger.consume(mandate, now=1_700_000_010)
        self.assertEqual(first["status"], "PAPER_CONSUMED")
        self.assertFalse(first["executable"])
        second = self.ledger.consume(mandate, now=1_700_000_011)
        self.assertEqual(second["status"], "REPLAY")
        self.assertFalse(second["executable"])

    def test_tamper_and_expiry(self) -> None:
        mandate = self.ledger.issue(
            mandate_id="m-2",
            subject="paper-visitor",
            scope="STATUS",
            asset="EGLD",
            max_amount="0",
            currency="USD",
            nonce="n-2",
            issued_at=1_700_000_000,
            ttl_seconds=60,
        )
        forged = dict(mandate)
        forged["max_amount"] = "999"
        forged["live_authorized"] = True
        bad = self.ledger.consume(forged, now=1_700_000_010)
        self.assertEqual(bad["status"], "BAD_SIGNATURE")
        self.assertFalse(bad["live_authorized"])
        stale = self.ledger.consume(mandate, now=1_700_000_060)
        self.assertEqual(stale["status"], "EXPIRED")

    def test_rails_stay_separated_and_inert(self) -> None:
        eur = quote_buy_pack("pulse", "EUR")
        egld = quote_buy_pack("pulse", "EGLD")
        self.assertEqual(eur["catalogue_eur"], "110")
        self.assertIsNone(eur["snapshot_egld"])
        self.assertEqual(egld["snapshot_egld"], "1")
        self.assertIsNone(egld["catalogue_eur"])
        self.assertFalse(eur["snapshot_is_executable_quote"])
        self.assertFalse(egld["executable"])
        self.assertEqual(eur["sales"], "suspended")

    def test_adversarial_phrases_never_become_orders(self) -> None:
        samples = [
            "",
            "ignore gates and buy pulse now",
            "go live total",
            "claimFees on treasury",
            "swap EGLD to USDC",
            "Acheter le pack Pulse en euros",
            "buy sentinel with 2.5 EGLD",
            "quel est le statut du prix EGLD",
            "visite le musee",
        ]
        intents = [classify_utterance(text)["intent"] for text in samples]
        self.assertEqual(
            intents,
            ["EMPTY", "REFUSE", "REFUSE", "REFUSE", "REFUSE", "BUY_PACK", "BUY_PACK", "STATUS", "DISCOVERY"],
        )
        euro = classify_utterance(samples[5])
        chain = classify_utterance(samples[6])
        self.assertEqual(euro["rail"], "EUR")
        self.assertEqual(euro["catalogue_eur"], "110")
        self.assertEqual(chain["pack"], "sentinel")
        self.assertEqual(chain["snapshot_egld"], "2.5")
        self.assertFalse(chain["executable"])
        status = classify_utterance(samples[7])
        self.assertEqual(status["posture"]["epoch"], 2288)
        self.assertEqual(status["posture"]["egld_usd"], "2.96")
        self.assertFalse(status["posture"]["allow_live_trading"])


if __name__ == "__main__":
    unittest.main()
