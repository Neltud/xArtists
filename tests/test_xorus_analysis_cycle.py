"""Provider contracts, actual derivation and raw-data-free analysis boundaries."""
import hashlib
import json
import unittest
from datetime import datetime, timedelta, timezone
from email.message import Message
from pathlib import Path
from unittest.mock import patch
from urllib.error import HTTPError

from lia.xorus.analysis_cycle import (
    ENDPOINT, MAX_BYTES, HOUR_MS, CollectionError,
    derive_market_inputs, fetch_market_bytes, run_analysis_cycle,
)

NOW = datetime(2026, 11, 13, 9, 30, tzinfo=timezone.utc)


def candles(count=49, *, flat=False, zero_volume=False):
    end = int(NOW.replace(minute=0).timestamp() * 1000)
    rows = []
    for i in range(count):
        opened = end - (count - i) * HOUR_MS
        price = 100 if flat else 100 + i
        volume = 0 if zero_volume else 10 + i
        rows.append([opened, str(price), str(price + 1), str(price - 1), str(price),
                     str(volume), opened + HOUR_MS - 1, str(volume * price),
                     10, "0", "0", "0"])
    return rows


def body(rows=None):
    return json.dumps(candles() if rows is None else rows, separators=(",", ":")).encode()


class AnalysisCycleTests(unittest.TestCase):
    def test_derived_metrics_use_time_validated_complete_windows(self):
        market, source, count = derive_market_inputs(candles(), now=NOW)
        self.assertAlmostEqual(market["price_change_1h"], (148 / 147 - 1) * 100)
        self.assertAlmostEqual(market["price_change_24h"], (148 / 124 - 1) * 100)
        self.assertEqual(market["rsi_14"], 100)
        self.assertAlmostEqual(market["drawdown"], 1 - 148 / 149)
        self.assertAlmostEqual(market["volume_spike"], 58 / (sum(range(34, 58)) / 24))
        self.assertAlmostEqual(market["vwap_24h"], sum((100 + i) * (10 + i) for i in range(25, 49)) / sum(range(35, 59)))
        self.assertEqual(source, "2026-11-13T08:59:59Z")
        self.assertEqual(count, 49)
        self.assertNotIn("egld_usd", market)
        self.assertNotIn("liquidity_usd", market)

    def test_real_pipeline_runs_existing_agents_and_keeps_unfed_roles_absent(self):
        report = run_analysis_cycle(fetch_bytes=body, now=NOW)
        self.assertEqual(report["schema"], "xorus_analysis/v2")
        self.assertEqual(report["coverage"]["signals_analyzed"], 6)
        self.assertEqual(report["coverage"]["families_analyzed"], 3)
        self.assertEqual(report["coverage"]["independently_verified_signals"], 0)
        self.assertEqual(report["collection"]["state"], "observed")
        self.assertEqual(report["collection"]["payload_sha256"], hashlib.sha256(body()).hexdigest())
        self.assertEqual(report["decision"]["stance"], "ABSTAIN")
        for role in ("scout", "crowd", "curator", "macro", "chair"):
            self.assertEqual(next(a for a in report["agents"] if a["agent"] == role)["status"], "no_input")

    def test_fixture_matches_python_report_and_content_digest(self):
        report = run_analysis_cycle(fetch_bytes=body, now=NOW)
        fixture = Path(__file__).parent / "fixtures/xorus_analysis_collected.json"
        self.assertEqual(json.loads(fixture.read_text()), report)
        digest = report.pop("report_sha256")
        self.assertEqual(digest, hashlib.sha256(json.dumps(report, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode()).hexdigest())

    def test_current_candle_cannot_change_any_metric(self):
        rows = candles(48)
        expected = derive_market_inputs(rows, now=NOW)
        current = int(NOW.replace(minute=0).timestamp() * 1000)
        rows.append([current, "999999", "999999", "999999", "999999", "999999", current + HOUR_MS - 1, "999998000001", 1, "0", "0", "0"])
        self.assertEqual(derive_market_inputs(rows, now=NOW), expected)

    def test_duplicate_gap_reversed_future_and_wrong_interval_rejected(self):
        variants = []
        duplicate = candles(); duplicate[-1] = duplicate[-2].copy(); variants.append(duplicate)
        gap = candles(); del gap[12]; variants.append(gap)
        variants.append(candles()[::-1])
        future = candles(); future[-1][0] += 2 * HOUR_MS; future[-1][6] += 2 * HOUR_MS; variants.append(future)
        interval = candles(); interval[-1][6] -= 1000; variants.append(interval)
        boolean = candles(); boolean[-1][0] = True; variants.append(boolean)
        for rows in variants:
            with self.subTest(rows=rows[-1][0]):
                report = run_analysis_cycle(fetch_bytes=lambda: body(rows), now=NOW)
                self.assertEqual(report["collection"]["state"], "invalid_payload")
                self.assertEqual(report["coverage"]["signals_analyzed"], 0)
                self.assertIsNone(report["source_ts"])

    def test_numeric_coercions_nonfinite_and_impossible_ohlc_rejected(self):
        for value in (None, True, False, "", " ", "NaN", "Infinity", "-1", "1e4", 100, "0", "0" * 100):
            rows = candles(); rows[-1][4] = value
            report = run_analysis_cycle(fetch_bytes=lambda: body(rows), now=NOW)
            self.assertEqual(report["collection"]["state"], "invalid_payload", repr(value))
        for index, value in ((2, "1"), (3, "999"), (5, "0"), (7, "9999999")):
            rows = candles(); rows[-1][index] = value
            self.assertEqual(run_analysis_cycle(fetch_bytes=lambda: body(rows), now=NOW)["collection"]["state"], "invalid_payload")

    def test_stale_series_is_not_refreshed_by_new_receipt(self):
        report = run_analysis_cycle(fetch_bytes=body, now=NOW + timedelta(hours=2))
        self.assertEqual(report["collection"]["state"], "stale_source")
        self.assertIsNone(report["source_ts"])
        self.assertEqual(report["coverage"]["signals_analyzed"], 0)

    def test_flat_zero_volume_series_never_invents_rsi_vwap_or_volume(self):
        market, _, _ = derive_market_inputs(candles(flat=True, zero_volume=True), now=NOW)
        self.assertEqual(market["price_change_1h"], 0)
        for key in ("rsi_14", "price", "vwap_24h", "volume_spike"):
            self.assertNotIn(key, market)
        report = run_analysis_cycle(fetch_bytes=lambda: body(candles(flat=True, zero_volume=True)), now=NOW)
        self.assertEqual(report["coverage"]["signals_analyzed"], 3)

    def test_drawdown_preserves_sentinel_veto(self):
        rows = candles()
        rows[-1][1:5] = ["100", "101", "99", "100"]
        rows[-1][7] = str(int(rows[-1][5]) * 100)
        report = run_analysis_cycle(fetch_bytes=lambda: body(rows), now=NOW)
        self.assertEqual(report["decision"], {"stance": "ABSTAIN", "reason": "sentinel_veto"})
        self.assertEqual(next(a for a in report["agents"] if a["agent"] == "sentinel")["status"], "veto")

    def test_size_error_history_and_provider_failure_leave_no_findings(self):
        for data, state in ((b"not json", "invalid_payload"), (b"[]", "insufficient_history"),
                            (body(candles(50)), "invalid_payload"), (b"x" * (MAX_BYTES + 1), "invalid_payload")):
            report = run_analysis_cycle(fetch_bytes=lambda: data, now=NOW)
            self.assertEqual(report["collection"]["state"], state)
            self.assertEqual(report["coverage"]["signals_analyzed"], 0)
        for state in ("unavailable", "unauthorized", "rate_limited"):
            calls = []
            def fail():
                calls.append(True)
                raise CollectionError(state, 1200)
            report = run_analysis_cycle(fetch_bytes=fail, now=NOW)
            self.assertEqual(len(calls), 1)
            self.assertEqual(report["collection"]["state"], state)
            self.assertEqual(report["collection"]["retry_after_seconds"], 1200)

    def test_no_provider_values_text_or_exception_details_leave_report(self):
        report = run_analysis_cycle(fetch_bytes=body, now=NOW)
        encoded = json.dumps(report, allow_nan=False)
        for key in ("value", "price", "score", "market", "observations", "provider_payload", "prompt", "board"):
            self.assertNotIn('"' + key + '":', encoded)
        for flag in ("commercial_enabled", "access_granted", "raw_data_included"):
            self.assertIs(report[flag], False)
        with patch("lia.xorus.analysis_cycle.urllib.request.build_opener", side_effect=OSError("private error")):
            report = run_analysis_cycle(now=NOW)
        self.assertNotIn("private error", json.dumps(report))

    def test_fixed_transport_no_credentials_redirects_or_retries(self):
        class Response:
            status = 200
            headers = Message()
            headers["Content-Type"] = "application/json"
            def __enter__(self): return self
            def __exit__(self, *args): pass
            def read(self, limit):
                self.limit = limit
                return body()
        response = Response()
        with patch("lia.xorus.analysis_cycle.urllib.request.build_opener") as factory:
            opener = factory.return_value
            opener.open.return_value = response
            self.assertEqual(fetch_market_bytes(), body())
            opener.open.assert_called_once()
            request = opener.open.call_args.args[0]
            self.assertEqual(request.full_url, ENDPOINT)
            self.assertEqual(request.get_method(), "GET")
            self.assertIsNone(request.get_header("Authorization"))
            self.assertEqual(opener.open.call_args.kwargs["timeout"], 5)
            self.assertEqual(response.limit, MAX_BYTES + 1)
            with self.assertRaises(CollectionError):
                factory.call_args.args[0].redirect_request(None, None, 302, "", {}, "https://other.test")

    def test_http_rate_limit_is_backed_off_without_retry(self):
        headers = Message(); headers["Retry-After"] = "1800"
        error = HTTPError(ENDPOINT, 429, "secret provider body", headers, None)
        with patch("lia.xorus.analysis_cycle.urllib.request.build_opener") as factory:
            factory.return_value.open.side_effect = error
            report = run_analysis_cycle(now=NOW)
            factory.return_value.open.assert_called_once()
        self.assertEqual(report["collection"]["state"], "rate_limited")
        self.assertEqual(report["collection"]["retry_after_seconds"], 1800)
        self.assertNotIn("secret provider body", json.dumps(report))


if __name__ == "__main__":
    unittest.main()
