"""Ingestion engine — X API when configured, else async mock/replay."""
from __future__ import annotations

import asyncio
import logging
from typing import Any, AsyncIterator

import httpx

from pulse.config import settings
from pulse.noise import is_noise
from pulse.sentiment import analyze_text, velocity_bucket
from pulse.signals import make_signal, publish

log = logging.getLogger("pulse.ingestion")

# rolling sentiment for velocity
_last_score: float = 0.0
_window_hits: int = 0


def detect_asset(text: str) -> str:
    u = text.upper()
    for a in ("HTM", "TRO", "EGLD", "ETH", "BTC", "USDC", "WBTC", "WTAO"):
        if a in u or f"${a}" in u:
            return a
    if "MULTIVERS" in u:
        return "EGLD"
    return "MACRO"


async def fetch_recent_search(client: httpx.AsyncClient, query: str) -> list[dict[str, Any]]:
    """X API v2 recent search — requires bearer."""
    url = "https://api.twitter.com/2/tweets/search/recent"
    params = {
        "query": query,
        "max_results": 10,
        "tweet.fields": "created_at,public_metrics,lang",
    }
    r = await client.get(
        url,
        params=params,
        headers={"Authorization": f"Bearer {settings.x_bearer_token}"},
        timeout=30.0,
    )
    if r.status_code != 200:
        log.warning("X API %s %s", r.status_code, r.text[:200])
        return []
    data = r.json()
    return list(data.get("data") or [])


async def mock_stream() -> AsyncIterator[dict[str, Any]]:
    samples = [
        "MultiversX Supernova feels smooth — $EGLD volume picking up",
        "Hatom $HTM liquidity talk on timeline, cautious not hype",
        "Another spam mint bot airdrop link http://x http://y http://z #####",
        "xArtists gallery demo live, builders shipping",
    ]
    i = 0
    while True:
        yield {"id": f"mock-{i}", "text": samples[i % len(samples)]}
        i += 1
        await asyncio.sleep(8)


async def process_raw_text(text: str, meta: dict | None = None) -> dict | None:
    global _last_score, _window_hits
    meta = meta or {}
    if is_noise(text, followers=int(meta.get("followers") or 0)):
        sig = make_signal(
            event="NOISE",
            asset=detect_asset(text),
            sentiment=0.0,
            velocity="low",
            context="filtered",
        )
        await publish(sig)
        return sig

    res = analyze_text(text)
    delta = res.score - _last_score
    _window_hits = min(_window_hits + 1, 20)
    vel = velocity_bucket(delta, _window_hits)
    _last_score = res.score

    event = "SENTIMENT_SHIFT"
    if vel == "high" and res.score >= 0.4:
        event = "HYPE_DETECTED"
    elif abs(delta) < 0.05:
        event = "HEARTBEAT"

    sig = make_signal(
        event=event,
        asset=detect_asset(text),
        sentiment=res.score,
        velocity=vel,
        context=text[:180],
        extra={"label": res.label, "hits": res.tokens_hit},
    )
    await publish(sig)
    return sig


async def run_loop(stop: asyncio.Event) -> None:
    if settings.x_enabled:
        log.info("X API enabled — recent search loop")
        q = " OR ".join(settings.keywords[:8])
        async with httpx.AsyncClient() as client:
            while not stop.is_set():
                try:
                    tweets = await fetch_recent_search(client, q)
                    for t in tweets:
                        await process_raw_text(t.get("text") or "")
                except Exception as e:
                    log.exception("ingest error %s", e)
                await asyncio.sleep(30)
    else:
        log.info("X bearer missing — mock stream")
        async for item in mock_stream():
            if stop.is_set():
                break
            await process_raw_text(item.get("text") or "")
