#!/usr/bin/env python3
"""Read-only public xArtists release smoke: Pages, published API CORS and locked commerce.

Never sends a POST, wallet transaction, payment, signed message, or order write.
The published API is the Render origin already in the live bundle. The custom
domain api.xartists.art is observed separately and is not a GO by itself.
"""
from __future__ import annotations

import json
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

PAGES = "https://xartists.art"
# Origin baked into the live Pages bundle and its connect-src CSP.
# `api.xartists.art` is the named future cutover. It is NXDOMAIN and is not
# called by the published frontend. Requiring it turned the 6h smoke red
# while the real public API was healthy and fail-closed.
PUBLISHED_API = "https://xartists-access-api.onrender.com"
CUTOVER_API = "https://api.xartists.art"
API = PUBLISHED_API
TRANSIENT = {408, 429, 500, 502, 503, 504}


def require(ok: bool, reason: str) -> None:
    if not ok:
        raise AssertionError(reason)


def fetch_public(url: str, origin: str | None = None, *, attempts: int = 4):
    """GET only. Retry bounded transient CDN or temporary service responses."""
    headers = {"User-Agent": "xArtists-readonly-go-smoke/1.0", "Accept": "*/*"}
    if origin is not None:
        headers["Origin"] = origin
    request = Request(url, headers=headers, method="GET")
    last_error = "unknown"
    for index in range(attempts):
        try:
            with urlopen(request, timeout=24) as response:
                status = response.status
                body = response.read(512_000)
                # Proxies may emit Vary more than once. Preserve every field value,
                # rather than silently overwriting Vary: Origin with Vary: Accept-Encoding.
                meta = {}
                for name, value in response.headers.items():
                    key = name.lower()
                    meta[key] = meta[key] + ", " + value if key in meta else value
            if index:
                print(f"::warning::Transient public endpoint recovered after {index} retries: {url}")
            return status, meta, body
        except HTTPError as exc:
            last_error = f"HTTP {exc.code}"
            if exc.code not in TRANSIENT:
                raise AssertionError(f"Public GET failed: {url} ({last_error})") from None
        except (URLError, TimeoutError, ConnectionError) as exc:
            last_error = type(exc).__name__
        if index < attempts - 1:
            time.sleep(7)
    raise AssertionError(f"Public GET unavailable after {attempts} attempts: {url} ({last_error})")


def check_cors(headers: dict[str, str], origin: str, *, allowed: bool) -> None:
    observed = headers.get("access-control-allow-origin")
    if allowed:
        require(observed == origin, f"Wrong CORS grant for {origin}: {observed!r}")
    else:
        require(observed is None, f"Untrusted origin received a CORS grant: {observed!r}")
    require("origin" in headers.get("vary", "").lower(), "Missing Vary: Origin")
    require("access-control-allow-credentials" not in headers, "Unexpected credentialed CORS")


def trading_closed(doc: dict) -> bool:
    # During migration an older deployed API may still publish the retired key.
    flags = [doc[k] for k in ("xorus_live_trading", "lia_live_trading") if k in doc]
    return bool(flags) and all(v is False or type(v) is int and v == 0 or v in ("0", "false") for v in flags)


def check_health(doc: dict) -> None:
    require(doc.get("ok") is True and doc.get("service") == "access-api", "Wrong API health service")
    expected = {
        "paybox_checkout_enabled": False,
        "mint_dispatch_enabled": False,
        "mint_dry_run": True,
        "mint_live_enabled": False,
        "mint_micro_price": False,
        "tro_solana_bridge": "off",
        "studio_media_upload": "off",
        "physical_works": "off",
    }
    for field, value in expected.items():
        require(type(doc.get(field)) is type(value) and doc.get(field) == value,
                f"Unsafe or unknown commercial flag: {field}")
    require(trading_closed(doc), "Unsafe or unknown commercial flag: xorus_live_trading")
    require(doc.get("orders_backend") == "postgres", "Expected PostgreSQL backend")


def check_bridge(doc: dict) -> None:
    require(doc.get("ok") is True and doc.get("asset") == "$TRO", "Wrong TRO bridge status")
    bridge = doc.get("bridge") or {}
    sale = doc.get("sale") or {}
    require(bridge.get("status") == "disabled", "TRO bridge unexpectedly active")
    for key in ("transferAvailable", "quoteAvailable", "relayerActive"):
        require(bridge.get(key) is False, f"Unsafe bridge capability: {key}")
    require(sale.get("directSaleLive") is False, "Direct TRO sale unexpectedly active")
    require(sale.get("paymentAddress") is None, "Unexpected live TRO sale deposit address")


def get_json(url: str, origin: str | None = None):
    status, headers, body = fetch_public(url, origin)
    require(status == 200, f"Not HTTP 200: {url}")
    require("application/json" in headers.get("content-type", ""), f"Wrong JSON MIME: {url}")
    try:
        doc = json.loads(body.decode("utf-8"))
    except (UnicodeError, json.JSONDecodeError) as exc:
        raise AssertionError(f"Invalid JSON from {url}") from exc
    require(isinstance(doc, dict), f"Non-object JSON response: {url}")
    return headers, doc


def check_frontend(origin: str, *, base_path: str = "") -> None:
    for route in ("/", "/tro/sale/"):
        url = origin + base_path + route
        status, headers, body = fetch_public(url)
        require(status == 200, f"Frontend route status failed: {url}")
        require("text/html" in headers.get("content-type", ""), f"Not HTML: {url}")
        html = body.decode("utf-8", errors="replace").lower()
        require("<html" in html and "xartists" in html, f"Unexpected frontend shell: {url}")
    print(f"Frontend entrypoints 200: {origin} (not a browser-rendering assertion)")


def observe_cutover() -> None:
    """Record the custom-domain cutover without pretending it is the live API.

    DNS/TLS absence is the known NO-GO and must not fail the public site.
    A host that starts answering must still be the fail-closed access-api.
    """
    url = CUTOVER_API + "/health"
    try:
        status, headers, body = fetch_public(url, attempts=2)
    except AssertionError as exc:
        if str(exc).startswith("Public GET unavailable"):
            print(
                "CUTOVER NO-GO: api.xartists.art is not publicly reachable. "
                "The live site calls Render only. No commerce flag was changed."
            )
            return
        raise
    require(status == 200, f"Cutover API not HTTP 200: {url}")
    require("application/json" in headers.get("content-type", ""), f"Cutover API is not JSON: {url}")
    try:
        doc = json.loads(body.decode("utf-8"))
    except (UnicodeError, json.JSONDecodeError) as exc:
        raise AssertionError("Cutover host answered but is not the access-api") from exc
    require(isinstance(doc, dict), "Cutover host answered but is not the access-api")
    check_health(doc)
    print("CUTOVER reachable and still fail-closed. source_sha=", doc.get("source_sha"))


def main() -> None:
    check_frontend(PAGES)
    cors, bridge = get_json(API + "/v1/tro/bridge/status", origin=PAGES)
    check_cors(cors, PAGES, allowed=True)
    check_bridge(bridge)
    print(f"Read-only TRO bridge and CORS verified for {PAGES}")

    # Unexpected origins receive no CORS grant; no payment/order data is queried.
    cors, doc = get_json(API + "/v1/tro/bridge/status", origin="https://untrusted.example")
    check_cors(cors, "https://untrusted.example", allowed=False)
    check_bridge(doc)

    _, health = get_json(API + "/health")
    check_health(health)
    _, db = get_json(API + "/v1/ops/orders-store/status")
    require(db.get("ok") is True and db.get("backend") == "postgres" and
            db.get("table_ready") is True, "Public Postgres readiness failed")

    print("GO READ-ONLY release check OK: Pages + published Render API, exact CORS, Postgres and no commercial activation")
    observe_cutover()


if __name__ == "__main__":
    main()
