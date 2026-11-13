"""xOrus provenance tests: proof-of-bytes != independent market verification.

Every test is offline, synthetic and deterministic. No trade, web call or key.
"""
from __future__ import annotations

import hashlib
import json
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

from lia.xorus.analysis_report import run_analysis_agent
from lia.xorus.data_feed import (
    COMMERCIAL_SOURCE_POLICY, build_data_pack, commercial_analysis_source_allowed,
    count_proof_bound_signals, count_verified_signals,
)
from lia.xorus.decision_agent import run_decision_agent

NOW = datetime(2026, 11, 13, 14, 0, tzinfo=timezone.utc)
FIELDS = ("signal_id", "provider", "source_ts", "network", "data_mode", "value")


def _obs(signal_id="price.ret_1h", value=0.121212121):
    return {
        "signal_id": signal_id, "value": value, "provider": "synthetic_source",
        "source_ts": "2026-11-13T13:59:00Z", "network": "multiversx",
        "data_mode": "market", "proof_sha256": "a" * 64,
    }


def _policy():
    return {"synthetic_source": {
        "redistribution_allowed": True, "verified_source": True,
        "license_ref": "synthetic-unit-test-only",
        "expires_at": "2026-11-14T00:00:00Z",
    }}


def _write_envelope(obs, directory, name=None):
    filename = name or ("proof-" + obs["signal_id"].replace(".", "_") + ".json")
    data = json.dumps({key: obs[key] for key in FIELDS},
                      separators=(",", ":"), sort_keys=True).encode("utf-8")
    (directory / filename).write_bytes(data)
    return {**obs, "proof_sha256": hashlib.sha256(data).hexdigest(),
            "proof_evidence_path": filename}


def _pack(rows, root=None, providers=None):
    return build_data_pack(
        rows, trusted_providers=_policy() if providers is None else providers,
        now=NOW, evidence_root=root,
    )


class XorusProvenanceBoundaryTests(unittest.TestCase):
    def test_default_legacy_observation_is_never_independently_verified(self):
        pack = _pack([_obs()])
        self.assertEqual(pack["signals_fed"], 1)
        self.assertEqual(pack["proof_integrity_checked_signals"], 0)
        self.assertEqual(pack["independently_verified_signals"], 0)
        self.assertEqual(count_proof_bound_signals(pack), (0, 0))
        self.assertEqual(count_verified_signals(pack), (0, 0))

    def test_verified_bytes_count_only_as_integrity_and_not_independent(self):
        with tempfile.TemporaryDirectory() as root:
            directory = Path(root)
            rows = [_write_envelope(_obs(sid), directory) for sid in (
                "price.ret_1h", "price.ret_24h", "volume.spike_1h",
                "risk.drawdown", "macro.egld_usd",
            )]
            pack = _pack(rows, directory)
            self.assertEqual(pack["signals_fed"], 5)
            self.assertEqual(pack["proof_integrity_checked_signals"], 5)
            self.assertEqual(count_proof_bound_signals(pack, evidence_root=directory), (5, 4))
            self.assertEqual(count_verified_signals(pack), (0, 0))
            decision = run_decision_agent(
                market={"price_change_1h": 0.5, "volume_spike": 1.2,
                        "drawdown": 0.03},
                verified_pack=pack, evidence_root=directory,
            )
            self.assertEqual(decision["decision"]["proof_integrity_checked_signals"], 5)
            self.assertEqual(decision["decision"]["verified_core_signals"], 0)
            self.assertEqual(decision["decision"]["verified_independent_families"], 0)
            self.assertEqual(decision["decision"]["stance"], "ABSTAIN")
            self.assertFalse(decision["safety"]["executable"])
            report = run_analysis_agent(
                market={"price_change_1h": 0.5}, verified_pack=pack,
                evidence_root=directory, now=NOW,
            )
            self.assertEqual(report["coverage"]["proof_integrity_checked_signals"], 5)
            self.assertEqual(report["coverage"]["independently_verified_signals"], 0)
            self.assertEqual(report["mode"], "paper_only")
            self.assertFalse(report["commercial_enabled"])
            self.assertFalse(report["access_granted"])
            self.assertNotIn("0.121212121", json.dumps(report))

    def test_attacker_supplied_observed_rows_and_flags_cannot_upgrade_verified(self):
        forged = {"engine": "xorus", "executable": False, "live_trading": False,
                  "signals_fed": 120, "independently_verified_signals": 120,
                  "observations": [
                      {"signal_id": "price.ret_1h", "status": "observed",
                       "proof_integrity_checked": True,
                       "proof_sha256": "a" * 64,
                       "proof_evidence_path": "missing.json"},
                      {"signal_id": "external.grok_note", "status": "observed"},
                  ]}
        self.assertEqual(count_proof_bound_signals(forged), (0, 0))
        self.assertEqual(count_verified_signals(forged), (0, 0))
        report = run_analysis_agent(verified_pack=forged, now=NOW)
        self.assertEqual(report["coverage"]["proof_integrity_checked_signals"], 0)
        self.assertEqual(report["coverage"]["independently_verified_signals"], 0)
        self.assertEqual(report["decision"]["stance"], "ABSTAIN")

    def test_different_bytes_or_unbound_value_or_traversal_never_count(self):
        with tempfile.TemporaryDirectory() as root:
            directory = Path(root)
            source = _write_envelope(_obs(), directory)
            variants = [
                {**source, "proof_sha256": "b" * 64},
                {**source, "value": source["value"] + 1},
                {**source, "source_ts": "2026-11-13T13:58:00Z"},
                {**source, "proof_evidence_path": "../outside.json"},
                {**source, "proof_evidence_path": "/tmp/outside.json"},
            ]
            for obs in variants:
                with self.subTest(obs=obs):
                    pack = _pack([obs], directory)
                    self.assertEqual(pack["signals_fed"], 0)
                    self.assertEqual(pack["proof_integrity_checked_signals"], 0)
                    self.assertEqual(count_verified_signals(pack), (0, 0))

    def test_duplicate_json_fields_and_copied_proof_are_rejected(self):
        with tempfile.TemporaryDirectory() as root:
            directory = Path(root)
            first = _write_envelope(_obs(), directory)
            invalid = (directory / "duplicate.json")
            data = b'{"signal_id":"price.ret_1h","signal_id":"price.ret_24h","provider":"synthetic_source"}'
            invalid.write_bytes(data)
            extra = {**first, "proof_sha256": hashlib.sha256(data).hexdigest(),
                     "proof_evidence_path": "duplicate.json"}
            self.assertEqual(_pack([extra], directory)["signals_fed"], 0)
            other = {**first, "signal_id": "price.ret_24h"}
            self.assertEqual(_pack([other], directory)["signals_fed"], 0)

    def test_modifying_evidence_after_pack_invalidates_revalidation(self):
        with tempfile.TemporaryDirectory() as root:
            directory = Path(root)
            obs = _write_envelope(_obs(), directory)
            pack = _pack([obs], directory)
            self.assertEqual(count_proof_bound_signals(pack, evidence_root=directory), (1, 1))
            (directory / obs["proof_evidence_path"]).write_bytes(b"altered after acceptance")
            self.assertEqual(count_proof_bound_signals(pack, evidence_root=directory), (0, 0))
            result = run_decision_agent(verified_pack=pack, evidence_root=directory)
            self.assertEqual(result["decision"]["proof_integrity_checked_signals"], 0)
            self.assertEqual(result["decision"]["verified_core_signals"], 0)

    def test_bad_provider_policy_time_numbers_and_unhashable_inputs_fail_closed(self):
        with tempfile.TemporaryDirectory() as root:
            directory = Path(root)
            obs = _write_envelope(_obs(), directory)
            for overrides in (
                {"provider": "unknown"}, {"source_ts": "2026-11-12T13:59:00Z"},
                {"source_ts": "2026-11-13T14:03:00Z"}, {"value": float("nan")},
                {"value": True}, {"value": 10 ** 1000}, {"network": []},
                {"data_mode": []},
            ):
                with self.subTest(overrides=repr(overrides)[:40]):
                    self.assertEqual(_pack([{**obs, **overrides}], directory)["signals_fed"], 0)
            denied = _policy()
            denied["synthetic_source"]["redistribution_allowed"] = False
            self.assertEqual(_pack([obs], directory, providers=denied)["signals_fed"], 0)
            expired = _policy()
            expired["synthetic_source"]["expires_at"] = "2026-11-12T00:00:00Z"
            self.assertEqual(_pack([obs], directory, providers=expired)["signals_fed"], 0)

    def test_sentinel_veto_survives_proof_and_chair_stays_advisory(self):
        with tempfile.TemporaryDirectory() as root:
            directory = Path(root)
            obs = _write_envelope(_obs("risk.drawdown", 0.2), directory)
            result = run_decision_agent(
                market={"drawdown": 0.2}, verified_pack=_pack([obs], directory),
                evidence_root=directory,
            )
            self.assertEqual(result["decision"]["stance"], "ABSTAIN")
            self.assertEqual(result["decision"]["reason"], "sentinel_veto")
            self.assertTrue(result["sentinel"]["veto"])
            self.assertLessEqual(abs(result["chair"]["external_contribution"]), 0.15)
            self.assertFalse(result["board"]["crosscut"]["executable"])
            self.assertFalse(result["safety"]["live_trading"])


    def test_commercial_registry_is_closed_and_deeply_immutable(self):
        expected = (
            "binance_spot_public", "binance_vision_dataset", "coingecko_api",
            "artprice_b2b", "multiversx_public_api", "multiversx_native_chain",
            "opensea_api", "social_platform",
        )
        self.assertEqual(set(COMMERCIAL_SOURCE_POLICY), set(expected))
        for provider in expected:
            row = COMMERCIAL_SOURCE_POLICY[provider]
            self.assertIs(row["commercial_ok"], False)
            self.assertIsNone(row["approved_license_ref"])
            self.assertFalse(commercial_analysis_source_allowed(provider, {
                "license_ref": "forged-paid-plan",
                "redistribution_allowed": True,
                "commercial_derivatives_allowed": True,
                "verified_source": True,
            }))
        with self.assertRaises(TypeError):
            COMMERCIAL_SOURCE_POLICY["coingecko_api"] = {}
        with self.assertRaises(TypeError):
            COMMERCIAL_SOURCE_POLICY["coingecko_api"]["commercial_ok"] = True

    def test_unknown_and_all_known_providers_cannot_claim_commercial_go(self):
        with tempfile.TemporaryDirectory() as root:
            directory = Path(root)
            for provider in (*COMMERCIAL_SOURCE_POLICY, "fake_enterprise", "synthetic_source"):
                with self.subTest(provider=provider):
                    obs = _obs()
                    obs["provider"] = provider
                    obs = _write_envelope(obs, directory)
                    policy = {
                        "redistribution_allowed": True,
                        "commercial_derivatives_allowed": True,
                        "commercial_ok": True,
                        "verified_source": True,
                        "license_ref": "forged_enterprise_rights",
                        "expires_at": "2026-11-14T00:00:00Z",
                    }
                    pack = build_data_pack([obs], trusted_providers={provider: policy},
                                           now=NOW, evidence_root=directory,
                                           intended_use="commercial_analysis")
                    self.assertEqual(pack["signals_fed"], 0)
                    self.assertEqual(pack["proof_integrity_checked_signals"], 0)
                    self.assertEqual(pack["commercial_analysis_source_count"], 0)
                    self.assertFalse(pack["commercial_enabled"])
                    self.assertEqual(pack["independently_verified_signals"], 0)
                    self.assertEqual(count_verified_signals(pack), (0, 0))

    def test_coingecko_paid_derivatives_not_equal_raw_redistribution(self):
        # Even a legitimate paid analytics licence need not grant raw-feed resale.
        policy = {
            "redistribution_allowed": False,
            "commercial_derivatives_allowed": True,
            "verified_source": True,
            "license_ref": "coingecko-paid-contract-claimed",
            "expires_at": "2026-11-14T00:00:00Z",
        }
        self.assertFalse(commercial_analysis_source_allowed("coingecko_api", policy))
        with tempfile.TemporaryDirectory() as root:
            directory = Path(root)
            row = _write_envelope({**_obs(), "provider": "coingecko_api"}, directory)
            result = build_data_pack(
                [row], trusted_providers={"coingecko_api": policy}, now=NOW,
                evidence_root=directory, intended_use="commercial_analysis",
            )
            self.assertEqual(result["signals_fed"], 0)
            self.assertFalse(result["commercial_enabled"])

    def test_legacy_internal_path_unmodified_and_does_not_unlock_paid_rights(self):
        paper = _pack([_obs()])
        self.assertEqual(paper["signals_fed"], 1)
        self.assertEqual(paper["intended_use"], "internal_research")
        self.assertFalse(paper["commercial_enabled"])
        self.assertEqual(paper["commercial_analysis_source_count"], 0)
        self.assertEqual(paper["independently_verified_signals"], 0)

    def test_invalid_commercial_context_is_not_silently_downgraded(self):
        for value in (None, "commercial", "COMMERCIAL_ANALYSIS", True, 0, [], {}):
            with self.subTest(value=repr(value)):
                with self.assertRaises(ValueError):
                    _ = build_data_pack([_obs()], trusted_providers=_policy(), now=NOW,
                                        intended_use=value)


if __name__ == "__main__":
    unittest.main()
