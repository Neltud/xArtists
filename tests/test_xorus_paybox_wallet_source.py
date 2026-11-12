"""xOrus PayBox.sh wallet source: offline, no-transfer security tests."""
import json
import unittest
from pathlib import Path

from lia.xorus.paybox_wallet_source import (
    inspect_funding_preflight, inspect_paybox_wallet_source,
)

ROOT = Path(__file__).resolve().parents[1]
SOLANA = "Dmc7RKdPNKcDDeGVW37rPnZZ7jJiPYuCmgB1EMBbRRFN"
EVM = "0xc603c5b2013bcbc54238a6f7ca503992493f2e41"


def base():
    return {
        "paybox_public_candidates": [
            {"network_family": "solana", "chain": "solana:mainnet", "address": SOLANA},
            {"network_family": "evm", "chain": None, "address": EVM},
        ],
        "xorus_multiversx_wallet": {"network": "multiversx:1", "address": None},
    }


class XOrusPayboxWalletSourceTests(unittest.TestCase):
    def assert_blocked(self, state):
        self.assertFalse(state["transfer_authorized"])
        self.assertFalse(state["funded_confirmed"])
        self.assertFalse(state["broadcast"])

    def test_config_is_watch_only_and_has_no_wallet_secret(self):
        raw = (ROOT / "data/xorus_paybox_wallet_source.json").read_text(encoding="utf-8")
        config = json.loads(raw)
        self.assertEqual(config["provider"], "paybox.sh")
        self.assertFalse(config["auto_funding_enabled"])
        self.assertFalse(config["funded_confirmed"])
        for sensitive in ("private_key", "seed_phrase", "oauth_token", "mnemonic"):
            self.assertNotIn(sensitive, raw)
        state = inspect_paybox_wallet_source(config)
        self.assertEqual(state["status"], "pending_owner_and_provider_proof")
        self.assertEqual(len(state["paybox_wallet_candidates"]), 2)
        self.assertIsNone(state["xorus_multiversx_wallet"]["address"])
        self.assertFalse(state["transfer_authorized"])
        self.assertFalse(state["funded_confirmed"])

    def test_historical_addresses_never_prove_control(self):
        state = inspect_paybox_wallet_source(base())
        self.assertEqual(state["provider"], "paybox.sh")
        self.assertEqual(state["mode"], "watch_only")
        self.assertFalse(state["credentials_connected"])
        self.assertFalse(state["provider_control_verified"])
        self.assertFalse(state["auto_funding_enabled"])
        self.assertFalse(state["bridge_authorized"])
        self.assertTrue(all(not row["control_verified"] and not row["can_send"]
                            for row in state["paybox_wallet_candidates"]))
        self.assertIsNone(state["paybox_wallet_candidates"][1]["chain"])

    def test_payload_cannot_claim_owner_approval_or_live_funding(self):
        malicious = {**base(), "verified": True, "owner_approved": True,
                     "funded_confirmed": True, "auto_funding_enabled": True,
                     "LIA_LIVE_TRADING": "1", "private_key": "do_not_echo", 
                     "provider": "paybox.sh", "trade_enabled": True}
        malicious["paybox_public_candidates"][0]["can_send"] = True
        state = inspect_paybox_wallet_source(malicious)
        self.assertFalse(state["transfer_authorized"])
        self.assertFalse(state["funded_confirmed"])
        self.assertFalse(state["trade_enabled"])
        self.assertNotIn("do_not_echo", json.dumps(state))

    def test_multiversx_transfer_cannot_route_through_sol_or_evm_paybox(self):
        for chain in ("solana:mainnet", "eip155:1"):
            with self.subTest(chain=chain):
                result = inspect_funding_preflight(base(), source_chain=chain,
                                                   target_chain="multiversx:1",
                                                   amount_atomic="1000000000000000000")
                self.assert_blocked(result)
                self.assertEqual(result["status"], "BLOCKED")
                self.assertFalse(result["source_chain_compatible"])
                self.assertEqual(result["reason"],
                                 "cross_chain_requires_separately_reviewed_bridge")
                self.assertIsNone(result["tx_payload"])

    def test_matching_source_chain_remains_blocked_without_provider_proof(self):
        result = inspect_funding_preflight(base(), source_chain="solana:mainnet",
                                           target_chain="solana:mainnet", amount_atomic="1000")
        self.assert_blocked(result)
        self.assertEqual(result["reason"], "source_wallet_unverified")
        self.assertTrue(result["source_reference_known"])
        self.assertTrue(result["amount_format_valid"])
        self.assertFalse(result["provider_session_verified"])
        self.assertIsNone(result["signing_request"])

    def test_unknown_evm_chain_is_not_guessed(self):
        result = inspect_funding_preflight(base(), source_chain="eip155:1",
                                           target_chain="eip155:1", amount_atomic="1")
        self.assert_blocked(result)
        self.assertFalse(result["source_reference_known"])
        self.assertEqual(result["reason"], "source_chain_not_verified")

    def test_bad_addresses_and_duplicates_rejected(self):
        config = {"paybox_public_candidates": [
            {"network_family": "solana", "chain": "solana:mainnet", "address": "0x" + "1"*40},
            {"network_family": "evm", "chain": "eip155:1", "address": SOLANA},
            {"network_family": "solana", "chain": "solana:mainnet", "address": SOLANA},
            {"network_family": "solana", "chain": "solana:mainnet", "address": SOLANA},
            {"network_family": "evm", "chain": "eip155:1", "address": EVM},
            {"network_family": "evm", "chain": "eip155:1", "address": EVM.upper().replace("0X", "0x")},
        ]}
        state = inspect_paybox_wallet_source(config)
        self.assertEqual(len(state["paybox_wallet_candidates"]), 2)
        self.assertEqual(state["rejected_candidates"], 4)

    def test_malformed_input_never_authenticates(self):
        for bad in (None, "connected", True, [], {}, {"paybox_public_candidates": "yes"},
                    {"paybox_public_candidates": [False, 1, [], {"network_family": [], "address": []}]}):
            with self.subTest(bad=bad):
                state = inspect_paybox_wallet_source(bad)
                self.assertFalse(state["credentials_connected"])
                self.assertFalse(state["transfer_authorized"])
                self.assertFalse(state["funded_confirmed"])

    def test_negative_or_forged_transfer_amount_not_sendable(self):
        for amount in ("-1", "0", "1e18", 1, None, "0x1", "1\n"):
            with self.subTest(amount=amount):
                result = inspect_funding_preflight(base(), source_chain="solana:mainnet",
                                                   target_chain="solana:mainnet",
                                                   amount_atomic=amount)
                self.assert_blocked(result)
                self.assertFalse(result["amount_format_valid"])


if __name__ == "__main__":
    unittest.main()
