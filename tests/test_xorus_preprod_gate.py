"""Legacy LIA preproduction is retired; neither import may authorize release.

The former PURPOSE/assess_preproduction API no longer exists. Its positive
attestation fixtures are inapplicable. Active provenance and tampering checks
remain in lia.xorus.test_verified_tape and test_xorus_data_rewards instead.
These tests assert retirement, including fresh imports and hostile legacy env.
"""
import importlib
import os
from pathlib import Path
import subprocess
import sys
import unittest
import warnings


MODULES = ("xorus.preprod_gate", "lia.xorus.preprod_gate")
RETIRED_EXPORTS = ("PURPOSE", "assess_preproduction", "_payload", "_digest_file")
ROOT = Path(__file__).resolve().parents[1]


class RetiredLiaPreprodGateTests(unittest.TestCase):
    def test_both_namespaces_have_no_legacy_release_entrypoints(self):
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", DeprecationWarning)
            for name in MODULES:
                module = importlib.import_module(name)
                for symbol in RETIRED_EXPORTS:
                    self.assertFalse(hasattr(module, symbol), f"{name}.{symbol}")

    def assert_inert_fresh_imports(self, names, *, legacy_live=False):
        script = (
            "import importlib,sys; "
            "from xorus import SAFETY; "
            "assert SAFETY['mode']=='paper_only'; "
            "assert SAFETY['lia_retired'] is True; "
            "assert all(SAFETY[k] is False for k in "
            "('executable','live_trading','signing_authorized','trade_authorized',"
            "'mint_authorized','payment_authorized')); "
            f"exports={RETIRED_EXPORTS!r}; "
            "assert all(not hasattr(importlib.import_module(name), symbol) "
            "for name in sys.argv[1:] for symbol in exports)"
        )
        env = {"PATH": os.environ.get("PATH", ""), "PYTHONDONTWRITEBYTECODE": "1"}
        if legacy_live:
            # Child process only. The production assisted flag stays absent.
            env.update(LIA_LIVE_TRADING="1", XORUS_LIVE_TRADING="1")
        result = subprocess.run(
            [sys.executable, "-S", "-B", "-c", script, *names],
            cwd=ROOT, env=env, capture_output=True, text=True, timeout=5,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout, "", "retired gate must issue no release verdict")

    def test_fresh_import_order_cannot_restore_a_release_evaluator(self):
        for names in (MODULES, tuple(reversed(MODULES))):
            with self.subTest(names=names):
                self.assert_inert_fresh_imports(names)

    def test_legacy_live_environment_cannot_restore_the_gate(self):
        for names in (MODULES, tuple(reversed(MODULES))):
            with self.subTest(names=names):
                self.assert_inert_fresh_imports(names, legacy_live=True)


if __name__ == "__main__":
    unittest.main()
