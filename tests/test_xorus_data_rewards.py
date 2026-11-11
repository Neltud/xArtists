"""Offline xOrus data and physical mint reward tests."""
import unittest
from datetime import datetime, timezone
from lia.xorus.data_feed import build_data_pack
from lia.xorus.physical_rewards import evaluate_physical_mint

NOW = datetime(2026, 11, 11, 18, 0, 0, tzinfo=timezone.utc)
PROVIDERS = {"trusted": {
    "redistribution_allowed": True, "verified_source": True,
    "license_ref": "contract-approved-001", "expires_at": "2027-01-01T00:00:00Z"
}}
SIGNAL = dict(signal_id="price.ret_1h", value=0.5, provider="trusted",
              source_ts="2026-11-11T17:57:00Z", network="multiversx",
              data_mode="market", proof_sha256="a"*64)
PROOF = dict(chain="multiversx-mainnet", physical_verified=True, mint_success=True,
             xartists_issuer_verified=True, artist_rights_verified=True,
             tx_hash="b"*64, nft_id="XAIPLS-2cf72b-01", creator="erd1"+"a"*58,
             physical_object_id="sculpture-01", block_nonce=123, finalized=True)


class XOrusDataAndRewardTests(unittest.TestCase):
    def test_catalog_never_invents_120_live_signals(self):
        data = build_data_pack([SIGNAL], now=NOW)
        self.assertEqual(data["signals_defined"], 120)
        self.assertEqual(data["signals_fed"], 0)
        self.assertFalse(data["executable"])
        self.assertFalse(data["access_granted"])

    def test_licensed_fresh_observation_carries_provenance(self):
        data = build_data_pack([SIGNAL], trusted_providers=PROVIDERS, now=NOW)
        self.assertEqual(data["signals_fed"], 1)
        row = next(x for x in data["observations"] if x["signal_id"] == "price.ret_1h")
        self.assertEqual(row["status"], "observed")
        self.assertEqual(row["license_ref"], "contract-approved-001")

    def test_stale_future_nan_and_unlicensed_rejected(self):
        variants = [
            {**SIGNAL, "source_ts": "2026-11-10T17:57:00Z"},
            {**SIGNAL, "source_ts": "2026-11-11T18:07:00Z"},
            {**SIGNAL, "value": float("nan")}, {**SIGNAL, "value": True},
            {**SIGNAL, "proof_sha256": "unsafe"}, {**SIGNAL, "provider": "unknown"},
        ]
        for row in variants:
            with self.subTest(row=row):
                out = build_data_pack([row], trusted_providers=PROVIDERS, now=NOW)
                self.assertEqual(out["signals_fed"], 0)

    def test_unverified_mint_is_never_rewarded(self):
        self.assertEqual(evaluate_physical_mint(PROOF)["amount_tro"], "0")
        self.assertEqual(evaluate_physical_mint({**PROOF, "physical_verified": False}, trusted_verifier=True,
                                             verified_reserve_tro=1)["amount_tro"], "0")

    def test_verified_physical_mint_only_candidate_not_payout(self):
        out = evaluate_physical_mint(PROOF, trusted_verifier=True, verified_reserve_tro=10)
        self.assertEqual(out["amount_tro"], "1")
        self.assertEqual(out["payout_status"], "not_paid")
        self.assertFalse(out["transfer_authorized"])
        self.assertEqual(out["code"], "PENDING_DURABLE_RESERVATION_AND_HUMAN_APPROVAL")

    def test_duplicate_reserve_missing_and_chain_fail_closed(self):
        kwargs = {"trusted_verifier": True, "verified_reserve_tro": 10}
        key = "multiversx-mainnet:XAIPLS-2cf72b-01"
        self.assertEqual(evaluate_physical_mint(PROOF, already_reserved={key}, **kwargs)["amount_tro"], "0")
        self.assertEqual(evaluate_physical_mint(PROOF, trusted_verifier=True)["amount_tro"], "0")
        self.assertEqual(evaluate_physical_mint({**PROOF, "chain": "solana-mainnet"}, **kwargs)["amount_tro"], "0")
        self.assertEqual(evaluate_physical_mint({**PROOF, "finalized": False}, **kwargs)["amount_tro"], "0")


if __name__ == "__main__":
    unittest.main()
