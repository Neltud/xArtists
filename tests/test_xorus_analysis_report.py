"""Behaviour and disclosure boundaries of the customer-facing analysis agent."""
import hashlib
import json
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch

from lia.xorus.analysis_report import run_analysis_agent

NOW = datetime(2026, 11, 13, 7, 0, tzinfo=timezone.utc)


def by_agent(report, name):
    return next(row for row in report["agents"] if row["agent"] == name)


class AnalysisReportTests(unittest.TestCase):
    def test_no_input_is_unavailable_not_neutral_or_confident(self):
        out = run_analysis_agent(now=NOW)
        self.assertEqual(out["product"], "proprietary_analysis")
        self.assertEqual(out["coverage"]["signals_analyzed"], 0)
        self.assertIsNone(out["confidence"])
        self.assertIsNone(out["source_ts"])
        self.assertEqual(out["decision"], {"stance": "ABSTAIN", "reason": "thin_tape"})
        for row in out["agents"]:
            self.assertEqual(row["status"], "recorded" if row["agent"] == "scribe" else "no_input")
            for family in row["families"]:
                self.assertEqual(family["reading"], "no_input")

    def test_synthesis_changes_with_inputs_without_exporting_values(self):
        for value, reading in ((2.987654321, "positive"), (-2.987654321, "negative"), (0, "balanced")):
            out = run_analysis_agent(market={"price_change_1h": value}, now=NOW)
            tape = by_agent(out, "tape")
            self.assertEqual(tape["status"], "paper_unverified")
            price = next(row for row in tape["families"] if row["family"] == "price")
            self.assertEqual(price, {"family": "price", "signals_analyzed": 1, "reading": reading})
            self.assertEqual(out["coverage"]["signals_analyzed"], 1)
            self.assertNotIn("2.987654321", json.dumps(out))

    def test_conflicting_indicators_are_reported_as_mixed(self):
        out = run_analysis_agent(market={"price_change_1h": 3, "price_change_24h": -8}, now=NOW)
        price = by_agent(out, "tape")["families"][0]
        self.assertEqual(price["reading"], "mixed")

    def test_sentinel_veto_survives_positive_signals(self):
        for inputs in ({"price_change_1h": 3, "drawdown": .2}, {"operator_halt": True}):
            out = run_analysis_agent(market=inputs, now=NOW)
            self.assertEqual(out["decision"]["reason"], "sentinel_veto")
            self.assertEqual(by_agent(out, "sentinel")["status"], "veto")
            self.assertEqual(out["decision"]["stance"], "ABSTAIN")

    def test_context_does_not_count_as_a_directional_analysis(self):
        out = run_analysis_agent(market={"egld_usd": 2}, now=NOW)
        self.assertEqual(by_agent(out, "macro")["status"], "context_only")
        self.assertEqual(out["coverage"]["signals_analyzed"], 0)

    def test_raw_payload_secrets_prompts_and_internal_board_never_leave(self):
        secret = "private-provider-payload-12345"
        brief = {"stance": "long", "confidence": 1, "risk": secret,
                 "facts": [{"text": secret, "source_ref": "https://provider.test/" + secret}] * 3}
        out = run_analysis_agent(market={"price": 98765.4321, "seed_phrase": secret,
                                        "provider_payload": secret, "commercial_enabled": True},
                                 chair_brief=brief, now=NOW)
        rendered = json.dumps(out, allow_nan=False)
        self.assertNotIn(secret, rendered)
        self.assertNotIn("98765.4321", rendered)
        for key in ("market", "board", "observations", "value", "score", "facts", "risk", "source_ref", "handoff_for_chatgpt"):
            self.assertNotIn('"' + key + '":', rendered)
        self.assertEqual(by_agent(out, "chair")["status"], "advisory_unverified")
        self.assertFalse(out["commercial_enabled"])
        self.assertFalse(out["access_granted"])
        for key, value in out["safety"].items():
            self.assertIs(value, key == "requires_human_review")

    def test_invalid_values_cannot_create_findings_or_nan_output(self):
        for value in (None, "", True, float("nan"), float("inf")):
            out = run_analysis_agent(market={"price_change_1h": value}, now=NOW)
            self.assertEqual(out["coverage"]["signals_analyzed"], 0)
            json.dumps(out, allow_nan=False)

    def test_same_inputs_produce_same_digest_and_change_is_bound(self):
        first = run_analysis_agent(now=NOW)
        self.assertEqual(first, run_analysis_agent(now=NOW))
        self.assertNotEqual(first["report_sha256"], run_analysis_agent(market={"price_change_1h": 2}, now=NOW)["report_sha256"])
        digest = first.pop("report_sha256")
        encoded = json.dumps(first, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode()
        self.assertEqual(digest, hashlib.sha256(encoded).hexdigest())

    def test_published_preview_is_exactly_the_empty_input_report(self):
        path = Path(__file__).resolve().parents[1] / "apps/frontend/public/data/xorus_analysis_preview.json"
        fixture = json.loads(path.read_text())
        when = datetime.fromisoformat(fixture["generated_at"].replace("Z", "+00:00"))
        self.assertEqual(fixture, run_analysis_agent(now=when))

    def test_no_network_or_model_calls_during_synthesis(self):
        with patch("socket.socket", side_effect=AssertionError("network forbidden")):
            self.assertEqual(run_analysis_agent(now=NOW)["mode"], "paper_only")

    def test_naive_or_invalid_report_time_rejected(self):
        for now in (datetime(2026, 11, 13), "2026-11-13T07:00:00Z", False):
            with self.assertRaises(ValueError):
                run_analysis_agent(now=now)


if __name__ == "__main__":
    unittest.main()
