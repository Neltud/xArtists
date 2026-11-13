"""One bounded read-only collection -> internal indicators -> customer analysis.

No account API, model, raw-data publication, persistence or execution. The fixed
Binance market-data endpoint needs no credential. Observed does not mean
independently verified, or approved for commercial analysis use.
"""
from __future__ import annotations

import hashlib
import json
import math
import re
import urllib.error
import urllib.request
from datetime import datetime, timezone
from typing import Any, Callable

from lia.xorus.analysis_report import run_analysis_agent, seal_report

ENDPOINT = "https://data-api.binance.vision/api/v3/klines?symbol=EGLDUSDT&interval=1h&limit=49"
MAX_BYTES = 65_536
HOUR_MS = 3_600_000
SOURCE_MAX_AGE_SECONDS = 65 * 60
DECIMAL = re.compile(r"^(?:0|[1-9]\d*)(?:\.\d+)?$")


class CollectionError(ValueError):
    def __init__(self, code: str, retry_after: int = 60):
        super().__init__(code)
        self.code = code
        self.retry_after = max(60, min(3600, retry_after))


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise CollectionError("unavailable")


def fetch_market_bytes() -> bytes:
    """Exactly one GET, fixed host/path, no redirects, auth or retries."""
    request = urllib.request.Request(ENDPOINT, headers={
        "Accept": "application/json", "User-Agent": "xArtists-xOrus/1.0",
    })
    try:
        with urllib.request.build_opener(_NoRedirect()).open(request, timeout=5) as response:
            if response.status != 200 or response.headers.get_content_type() != "application/json":
                raise CollectionError("unavailable")
            data = response.read(MAX_BYTES + 1)
            if len(data) > MAX_BYTES:
                raise CollectionError("invalid_payload")
            return data
    except urllib.error.HTTPError as error:
        if error.code in (418, 429):
            retry = error.headers.get("Retry-After", "300") if error.headers else "300"
            retry = int(retry) if retry.isascii() and retry.isdigit() and len(retry) <= 6 else 300
            raise CollectionError("rate_limited", retry) from None
        raise CollectionError("unauthorized" if error.code in (401, 403, 451) else "unavailable") from None
    except (urllib.error.URLError, TimeoutError, OSError):
        raise CollectionError("unavailable") from None


def _number(value: Any, *, positive: bool = False) -> float:
    # Binance decimal fields are strings. Empty, booleans and coercions fail.
    if (not isinstance(value, str) or len(value) > 40 or not DECIMAL.fullmatch(value)):
        raise CollectionError("invalid_payload")
    number = float(value)
    if not math.isfinite(number) or number > 1e20 or (positive and number <= 0):
        raise CollectionError("invalid_payload")
    return number


def _moment(now: datetime | None) -> datetime:
    moment = datetime.now(timezone.utc) if now is None else now
    if not isinstance(moment, datetime) or moment.utcoffset() is None:
        raise ValueError("now must be a timezone-aware datetime")
    return moment.astimezone(timezone.utc)


def derive_market_inputs(payload: Any, *, now: datetime) -> tuple[dict[str, float], str, int]:
    """Validate chronology before deriving indicators; do not align by position.

    Returns are close-to-close; RSI uses arithmetic mean gains/losses over 14
    hourly changes (not Wilder smoothing). VWAP = 24h quote/base volumes.
    Volume compares the last hour with the preceding 24 complete hours.
    Drawdown = decline from the highest high of the last 24 completed hours.
    All prices are denominated in USDT; no USD parity is assumed.
    """
    moment = _moment(now)
    now_ms = int(moment.timestamp() * 1000)
    if not isinstance(payload, list) or not 25 <= len(payload) <= 49:
        raise CollectionError("insufficient_history" if isinstance(payload, list) and len(payload) < 25 else "invalid_payload")
    closed = []
    previous = None
    for row in payload:
        if not isinstance(row, list) or len(row) != 12:
            raise CollectionError("invalid_payload")
        opened, ended = row[0], row[6]
        if (type(opened) is not int or type(ended) is not int or opened <= 0
            or opened % HOUR_MS != 0 or ended != opened + HOUR_MS - 1
            or opened > now_ms or (previous is not None and opened != previous + HOUR_MS)):
            raise CollectionError("invalid_payload")
        previous = opened
        o, h, low, close = (_number(row[i], positive=True) for i in (1, 2, 3, 4))
        base, quote = _number(row[5]), _number(row[7])
        if (low > min(o, close) or h < max(o, close) or low > h
            or (base == 0) != (quote == 0)
            or (base > 0 and not low * (1 - 1e-7) <= quote / base <= h * (1 + 1e-7))):
            raise CollectionError("invalid_payload")
        if ended <= now_ms:
            closed.append({"close": close, "high": h, "base": base, "quote": quote, "ended": ended})
        # An in-progress final candle is deliberately excluded from ALL metrics.
    if len(closed) < 25:
        raise CollectionError("insufficient_history")
    latest = closed[-1]
    if now_ms - latest["ended"] > SOURCE_MAX_AGE_SECONDS * 1000:
        raise CollectionError("stale_source")
    last24 = closed[-24:]
    market = {
        "price_change_1h": (latest["close"] / closed[-2]["close"] - 1) * 100,
        "price_change_24h": (latest["close"] / closed[-25]["close"] - 1) * 100,
        "drawdown": max(0.0, 1 - latest["close"] / max(row["high"] for row in last24)),
    }
    deltas = [closed[i]["close"] - closed[i - 1]["close"] for i in range(len(closed) - 14, len(closed))]
    gains = sum(max(0, delta) for delta in deltas)
    losses = sum(max(0, -delta) for delta in deltas)
    # A flat market has no RSI direction; do not invent a neutral RSI of 50.
    if gains + losses > 0:
        market["rsi_14"] = 100 * gains / (gains + losses)
    base24 = sum(row["base"] for row in last24)
    if base24 > 0:
        market["price"] = latest["close"]
        market["vwap_24h"] = sum(row["quote"] for row in last24) / base24
    previous_volume = sum(row["base"] for row in closed[-25:-1]) / 24
    if previous_volume > 0:
        market["volume_spike"] = latest["base"] / previous_volume
    if not all(math.isfinite(value) for value in market.values()):
        raise CollectionError("invalid_payload")
    source_ts = datetime.fromtimestamp(latest["ended"] // 1000, timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    return market, source_ts, len(closed)


def run_analysis_cycle(*, fetch_bytes: Callable[[], bytes] = fetch_market_bytes,
                       now: datetime | None = None) -> dict[str, Any]:
    """Only allowlisted derived fields and fixed collection codes leave here."""
    _moment(now)  # Reject an invalid test/operator clock before any network read.
    market, source_ts, candles, digest = {}, None, 0, None
    state, retry = "unavailable", 60
    try:
        data = fetch_bytes()
        if not isinstance(data, bytes) or len(data) > MAX_BYTES:
            raise CollectionError("invalid_payload")
        try:
            payload = json.loads(data)
        except (ValueError, UnicodeError):
            raise CollectionError("invalid_payload") from None
        received = _moment(now)  # Receipt time is taken AFTER the HTTP read.
        market, source_ts, candles = derive_market_inputs(payload, now=received)
        digest = hashlib.sha256(data).hexdigest()
        state = "observed"
    except CollectionError as error:
        state, retry = error.code, error.retry_after
    except (OSError, TimeoutError):
        state = "unavailable"
    received = _moment(now)
    report = run_analysis_agent(market=market, now=received)
    report.update({
        "schema": "xorus_analysis/v2",
        "source_ts": source_ts,
        "input_provenance": "provider_observed_unverified" if state == "observed" else "no_usable_provider_input",
        "collection": {
            "provider": "binance_spot_public", "instrument": "EGLDUSDT", "interval": "1h",
            "state": state, "received_at": received.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "source_max_age_seconds": SOURCE_MAX_AGE_SECONDS,
            "candles_used": candles, "payload_sha256": digest,
            "retry_after_seconds": retry,
        },
        "limitations": [
            "single_venue_usdt_not_usd", "hourly_closed_candles_only",
            "provider_observation_not_independent_attestation",
            "commercial_analysis_rights_not_verified", "no_autonomous_execution",
        ],
    })
    return seal_report(report)


def main() -> None:
    print(json.dumps(run_analysis_cycle(), ensure_ascii=False, allow_nan=False))


if __name__ == "__main__":
    main()
