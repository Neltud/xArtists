"""Offline regression suite for the public read-only smoke (no network)."""
import unittest
from unittest.mock import patch
from urllib.error import HTTPError
from email.message import Message

from scripts.ops import public_live_extra_checks as smoke


class FakeResponse:
    status = 200
    headers = {"Content-Type": "application/json; charset=utf-8"}

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def read(self, size):
        return b'{"ok":true}'


class PublicLiveChecksTests(unittest.TestCase):
    def test_canonical_pages_routes_only(self):
        calls = []
        def read(url, *args, **kwargs):
            calls.append(url)
            return 200, {"content-type": "text/html"}, b"<html>xArtists</html>"
        with patch.object(smoke, "fetch_public", side_effect=read):
            smoke.check_frontend(smoke.PAGES)
        self.assertEqual(calls, ["https://xartists.art/", "https://xartists.art/tro/sale/"])

    def test_only_owned_pages_origin_is_allowed(self):
        headers = {"access-control-allow-origin": smoke.PAGES, "vary": "Accept-Encoding, Origin"}
        smoke.check_cors(headers, smoke.PAGES, allowed=True)
        with self.assertRaises(AssertionError):
            smoke.check_cors(headers, "https://attacker.example", allowed=False)

    def test_wildcard_and_credentialed_cors_fail_closed(self):
        with self.assertRaises(AssertionError):
            smoke.check_cors({"access-control-allow-origin": "*", "vary": "Origin"}, smoke.PAGES, allowed=True)
        with self.assertRaises(AssertionError):
            smoke.check_cors({
                "access-control-allow-origin": smoke.PAGES,
                "vary": "Origin",
                "access-control-allow-credentials": "true",
            }, smoke.PAGES, allowed=True)
        smoke.check_cors({"vary": "Origin"}, "https://attacker.example", allowed=False)

    def test_paybox_and_mint_cannot_silently_enable(self):
        safe = {
            "ok": True, "service": "access-api", "orders_backend": "postgres",
            "paybox_checkout_enabled": False, "mint_dispatch_enabled": False,
            "mint_dry_run": True, "mint_live_enabled": False,
            "mint_micro_price": False, "xorus_live_trading": "0",
            "tro_solana_bridge": "off", "studio_media_upload": "off",
            "physical_works": "off",
        }
        smoke.check_health(safe)
        for key, bad in [("paybox_checkout_enabled", True),
                         ("mint_live_enabled", True),
                         ("mint_dispatch_enabled", True),
                         ("mint_micro_price", True),
                         ("xorus_live_trading", "1"),
                         ("mint_dry_run", False),
                         ("orders_backend", "file")]:
            with self.subTest(key=key), self.assertRaises(AssertionError):
                smoke.check_health({**safe, key: bad})

    def test_tro_sale_and_bridge_are_consistently_disabled(self):
        safe = {
            "ok": True, "asset": "$TRO",
            "bridge": {"status": "disabled", "transferAvailable": False,
                       "quoteAvailable": False, "relayerActive": False},
            "sale": {"directSaleLive": False, "paymentAddress": None},
        }
        smoke.check_bridge(safe)
        for bad in [
            {"bridge": {**safe["bridge"], "status": "active"}},
            {"bridge": {**safe["bridge"], "transferAvailable": True}},
            {"sale": {**safe["sale"], "directSaleLive": True}},
            {"sale": {**safe["sale"], "paymentAddress": "some-address"}},
        ]:
            with self.assertRaises(AssertionError):
                smoke.check_bridge({**safe, **bad})

    def test_duplicate_vary_headers_are_preserved_from_proxy(self):
        class ProxyResponse(FakeResponse):
            headers = Message()
            headers.add_header("Content-Type", "application/json")
            headers.add_header("Vary", "Origin")
            headers.add_header("Vary", "Accept-Encoding")
            headers.add_header("Access-Control-Allow-Origin", smoke.PAGES)

        with patch.object(smoke, "urlopen", return_value=ProxyResponse()):
            status, headers, _ = smoke.fetch_public("https://example.test", smoke.PAGES, attempts=1)
        self.assertEqual(status, 200)
        self.assertIn("Origin", headers["vary"])
        self.assertIn("Accept-Encoding", headers["vary"])
        smoke.check_cors(headers, smoke.PAGES, allowed=True)

    def test_transient_503_can_recover_but_404_fails_immediately(self):
        transient = HTTPError("https://example.test", 503, "asleep", {}, None)
        with patch.object(smoke, "urlopen", side_effect=[transient, FakeResponse()]) as client, \
             patch.object(smoke.time, "sleep") as sleeper:
            status, _, body = smoke.fetch_public("https://example.test", attempts=2)
            self.assertEqual(status, 200)
            self.assertEqual(body, b'{"ok":true}')
            self.assertEqual(client.call_count, 2)
            sleeper.assert_called_once_with(7)

        with patch.object(smoke, "urlopen", side_effect=HTTPError(
            "https://example.test", 404, "missing", {}, None)) as client:
            with self.assertRaisesRegex(AssertionError, "HTTP 404"):
                smoke.fetch_public("https://example.test", attempts=4)
            self.assertEqual(client.call_count, 1)

    def test_smoke_targets_the_origin_shipped_in_pages(self):
        self.assertEqual(smoke.API, "https://xartists-access-api.onrender.com")
        self.assertEqual(smoke.PUBLISHED_API, smoke.API)
        self.assertEqual(smoke.CUTOVER_API, "https://api.xartists.art")
        self.assertNotEqual(smoke.API, smoke.CUTOVER_API)

    def test_unresolved_cutover_does_not_fail_the_public_site(self):
        with patch.object(
            smoke,
            "fetch_public",
            side_effect=AssertionError(
                "Public GET unavailable after 2 attempts: "
                "https://api.xartists.art/health (URLError)"
            ),
        ):
            smoke.observe_cutover()

    def test_reachable_cutover_cannot_enable_checkout(self):
        body = (
            b'{"ok":true,"service":"access-api","orders_backend":"postgres",'
            b'"paybox_checkout_enabled":true,"mint_dispatch_enabled":false,'
            b'"mint_dry_run":true,"mint_live_enabled":false,"mint_micro_price":false,'
            b'"xorus_live_trading":"0","tro_solana_bridge":"off",'
            b'"studio_media_upload":"off","physical_works":"off"}'
        )
        with patch.object(
            smoke,
            "fetch_public",
            return_value=(200, {"content-type": "application/json"}, body),
        ):
            with self.assertRaises(AssertionError):
                smoke.observe_cutover()


if __name__ == "__main__":
    unittest.main()
