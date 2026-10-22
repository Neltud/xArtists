"""Offline tests only: no provider calls, wallet access, or real transactions."""
import math
import time
import unittest
from unittest.mock import patch

from lia.executor import paybox_router as router
from lia.beta.allowlist import assert_trade_caps, assert_micro_egld, beta_preflight


class PayboxReleaseTests(unittest.TestCase):
    def test_beta_caps_reject_nan_infinity_negative_budgets_and_invalid_counts(self):
        baseline = dict(size_usd=15, trades_today=1, daily_notional_usd=25, wallet_egld=0.05)
        self.assertTrue(assert_trade_caps(**baseline).ok)
        for values in [dict(size_usd=math.nan), dict(size_usd=math.inf), dict(size_usd=15.01),
                       dict(daily_notional_usd=math.nan), dict(daily_notional_usd=-1),
                       dict(wallet_egld=math.nan), dict(wallet_egld=math.inf),
                       dict(trades_today=-1), dict(trades_today=1.5), dict(trades_today=True)]:
            with self.subTest(values=values):
                self.assertFalse(assert_trade_caps(**(baseline | values)).ok)

    def test_beta_combined_preflight_does_not_skip_nonfinite_or_negative_amounts(self):
        for value in [math.nan, math.inf, -1]:
            self.assertFalse(beta_preflight(token="EGLD", size_usd=value).ok)
            self.assertFalse(assert_micro_egld(value).ok)

    def args(self):
        return dict(src_chain=router.SOLANA_CHAIN, src_token="native", dst_token=router.SOLANA_USDC,
                    amount_atomic="1000000", usd_notional=1.0, daily_spent_usd=0, quote_ts=time.time())

    def test_size_respects_usd_daily_and_gas_caps(self):
        sized = router.size_sol_to_usdc(1_000_000_000, sol_usd=200, daily_spent_usd=30, quote_ts=time.time())
        self.assertTrue(sized["ok"])
        self.assertLessEqual(sized["usd_notional"], 10)
        self.assertGreaterEqual(sized["keep_sol"], 0.02)
        self.assertLessEqual(int(sized["amount_atomic"]), 490_000_000)

    def test_missing_stale_and_nonfinite_inputs_never_produce_intents(self):
        with self.assertRaises(TypeError):
            router.bootstrap_sol_usdc_intent()
        for patch_args in [dict(usd_notional=16), dict(usd_notional=math.nan), dict(daily_spent_usd=40),
                           dict(quote_ts=time.time() - 120), dict(slippage_bps=101),
                           dict(amount_atomic="-1"), dict(src_chain="multiversx"), dict(confidence=math.inf)]:
            with self.subTest(patch_args=patch_args), self.assertRaises(ValueError):
                router.build_swap_intent(**(self.args() | patch_args))

    def test_ids_do_not_collide_and_approval_is_explicit(self):
        intents = [router.build_swap_intent(**self.args()) for _ in range(100)]
        self.assertEqual(len({i["id"] for i in intents}), 100)
        self.assertTrue(all(i["requires_user_approval"] for i in intents))

    def test_provider_success_is_not_chain_confirmation_and_record_is_idempotent(self):
        legs = []
        intent = router.build_swap_intent(**self.args())
        def save(entries):
            legs[:] = entries
        with patch.object(router, "_load_legs", lambda: list(legs)), patch.object(router, "_save_legs", save):
            router.record_leg(intent)
            result = router.record_leg(intent, {"status": "executed", "tx_hash": "fixture-hash"})
            self.assertEqual(result["status"], "pending_confirmation")
            self.assertEqual(len(legs), 1)
            router.record_leg(intent)
            self.assertEqual(len(legs), 1)
            with self.assertRaises(ValueError):
                router.record_leg(intent, {"status": "executed", "tx_hash": "different-hash"})

    def test_bootstrap_uses_explicit_account_without_assumed_credentials(self):
        with patch.object(router, "record_leg") as record:
            result = router.bootstrap_sol_usdc_intent(150_000_000, sol_usd=200, daily_spent_usd=0,
                quote_ts=time.time(), credential_id="fixture-account", wallet_address="fixture-wallet")
            self.assertTrue(result["ok"])
            self.assertEqual(result["paybox_args"]["credential_id"], "fixture-account")
            self.assertLessEqual(result["intent"]["risk"]["usd_notional"], 15)
            record.assert_called_once()


if __name__ == "__main__":
    unittest.main()
