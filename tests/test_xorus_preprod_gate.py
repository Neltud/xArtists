"""xOrus Data preproduction security regressions (fully offline)."""
import base64
import hashlib
import json
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

from lia.xorus.catalog import catalog
from lia.xorus.preprod_gate import (
    PURPOSE, _digest_file, _payload, assess_preproduction,
)

NOW = datetime(2026, 11, 12, 14, 0, tzinfo=timezone.utc)
SID = "price.ret_1h"


def fixture():
    manifest = {
        "product": "standard",
        "included_signal_ids": [SID],
        "payments_enabled": False,
        "nft_mint_enabled": False,
        "tro_transfers_enabled": False,
        "legal_approval": True,
        "security_approval": True,
    }
    observed = [{
        "signal_id": SID,
        "semantic_name": SID,
        "provider": "untrusted-demo-provider",
        "network": "multiversx",
        "observation_status": "observed",
        "source_ts": (NOW - timedelta(minutes=2)).isoformat(),
        "received_at": (NOW - timedelta(minutes=1)).isoformat(),
        "freshness_max_age_seconds": 900,
        "proof_evidence_path": "proof/source.json",
        "proof_sha256": "a" * 64,
    }]
    licenses = [{
        "signal_id": SID,
        "provider": "untrusted-demo-provider",
        "license_reference": "claimed-license-not-real",
        "license_status": "approved",
        "redistribution_allowed": "yes",
        "approved_by": "claimed-person",
        "valid_from": (NOW - timedelta(days=1)).isoformat(),
        "valid_until": (NOW + timedelta(days=30)).isoformat(),
        "permitted_products": "standard;pro",
        "evidence_location": "proof/contract.pdf",
        "evidence_sha256": "b" * 64,
    }]
    return manifest, observed, licenses


class PreprodGateTests(unittest.TestCase):
    def test_semantic_catalog_and_empty_readiness(self):
        ids = [item["id"] for item in catalog()]
        self.assertEqual(len(ids), 120)
        self.assertEqual(len(set(ids)), 120)
        self.assertIn(SID, ids)
        self.assertNotIn(1, ids)

    def test_self_reported_flags_hashes_and_licenses_never_open_release(self):
        manifest, observed, licenses = fixture()
        out = assess_preproduction(manifest, observed, licenses, now=NOW)
        self.assertEqual(out["preflight"], "FAIL")
        self.assertEqual(out["commercial"], "NO_GO")
        self.assertFalse(out["commercial_enabled"])
        self.assertIn("independent_signature_missing_or_invalid", out["errors"])
        self.assertIn(SID + ":observation_evidence_invalid", out["errors"])
        self.assertIn(SID + ":license_evidence_invalid", out["errors"])

    def test_numeric_legacy_ids_and_duplicate_ids_fail(self):
        manifest, observed, licenses = fixture()
        manifest["included_signal_ids"] = [1]
        self.assertIn("invalid_or_legacy_signal_ids",
                      assess_preproduction(manifest, observed, licenses, now=NOW)["errors"])
        manifest["included_signal_ids"] = [SID, SID]
        self.assertIn("duplicate_included_ids",
                      assess_preproduction(manifest, observed, licenses, now=NOW)["errors"])

    def test_financial_flags_must_be_explicitly_false(self):
        manifest, observed, licenses = fixture()
        manifest["nft_mint_enabled"] = True
        self.assertIn("financial_operations_must_remain_disabled",
                      assess_preproduction(manifest, observed, licenses, now=NOW)["errors"])
        del manifest["nft_mint_enabled"]
        self.assertIn("financial_operations_must_remain_disabled",
                      assess_preproduction(manifest, observed, licenses, now=NOW)["errors"])

    def test_unlicensed_nft_rights_rejected(self):
        manifest, observed, licenses = fixture()
        manifest["product"] = "nft_data_pack"
        licenses[0]["permitted_products"] = "nft_data_pack"
        self.assertIn(SID + ":product_rights_missing",
                      assess_preproduction(manifest, observed, licenses, now=NOW)["errors"])

    def test_malformed_unhashable_rows_fail_closed(self):
        manifest, observed, licenses = fixture()
        observed.append({"signal_id": []})
        licenses.append({"signal_id": {}})
        manifest["product"] = []
        observed[0]["network"] = []
        out = assess_preproduction(manifest, observed, licenses, now=NOW)
        self.assertEqual(out["commercial"], "NO_GO")
        self.assertIn("observations:invalid_row", out["errors"])
        self.assertIn("licenses:invalid_row", out["errors"])
        self.assertIn("invalid_product", out["errors"])
        self.assertIn(SID + ":source_unverified", out["errors"])

    def test_root_escape_and_absent_proof_denied(self):
        with tempfile.TemporaryDirectory() as base:
            root = Path(base)
            data = root / "evidence"
            data.mkdir()
            outside = root / "outside.txt"
            outside.write_bytes(b"test")
            digest = hashlib.sha256(b"test").hexdigest()
            self.assertFalse(_digest_file(data, "../outside.txt", digest))
            self.assertFalse(_digest_file(data, str(outside), digest))
            self.assertFalse(_digest_file(data, "missing", digest))

    def test_external_signed_technical_preflight_never_commercial_go(self):
        try:
            from cryptography.hazmat.primitives import serialization
            from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
        except ImportError:
            self.skipTest("cryptography optional dependency is unavailable")
        manifest, observed, licenses = fixture()
        with tempfile.TemporaryDirectory() as base:
            root = Path(base)
            evidence = root / "evidence"
            (evidence / "proof").mkdir(parents=True)
            a = b'{"value":"test-only-not-a-real-market-feed"}'
            b = b"test-only-not-a-real-contract"
            (evidence / "proof/source.json").write_bytes(a)
            (evidence / "proof/contract.pdf").write_bytes(b)
            observed[0]["proof_sha256"] = hashlib.sha256(a).hexdigest()
            licenses[0]["evidence_sha256"] = hashlib.sha256(b).hexdigest()
            private = Ed25519PrivateKey.generate()  # ephemeral fixture only
            pub = root / "public.pem"
            pub.write_bytes(private.public_key().public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo,
            ))
            receipt = {
                "purpose": PURPOSE,
                "payload_sha256": hashlib.sha256(_payload(manifest, observed, licenses)).hexdigest(),
                "expires_at": (NOW + timedelta(hours=1)).isoformat(),
            }
            statement = json.dumps(receipt, sort_keys=True, separators=(",", ":")).encode()
            receipt["signature_base64"] = base64.b64encode(private.sign(statement)).decode()
            signed = root / "attestation.json"
            signed.write_text(json.dumps(receipt), encoding="utf-8")
            kwargs = {
                "evidence_root": evidence,
                "trusted_public_key": pub,
                "detached_attestation": signed,
                "now": NOW,
            }
            out = assess_preproduction(manifest, observed, licenses, **kwargs)
            self.assertEqual(out["preflight"], "PASS_REQUIRES_INDEPENDENT_HUMAN_REVIEW")
            self.assertEqual(out["commercial"], "NO_GO")
            self.assertFalse(out["commercial_enabled"])
            self.assertEqual(out["errors"], [])

            receipt["expires_at"] = (NOW + timedelta(days=2)).isoformat()
            signed.write_text(json.dumps(receipt), encoding="utf-8")
            self.assertIn("independent_signature_missing_or_invalid",
                          assess_preproduction(manifest, observed, licenses, **kwargs)["errors"])


if __name__ == "__main__":
    unittest.main()
