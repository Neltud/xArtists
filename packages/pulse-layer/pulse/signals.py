"""Signal store + optional Redis pub/sub."""
from __future__ import annotations

import asyncio
import json
import logging
from collections import deque
from datetime import datetime, timezone
from typing import Any

from pulse.config import settings

log = logging.getLogger("pulse.signals")

MAX_HISTORY = 200
_history: deque[dict[str, Any]] = deque(maxlen=MAX_HISTORY)
_subscribers: list[asyncio.Queue] = []
_redis = None


def make_signal(
    *,
    event: str,
    asset: str,
    sentiment: float,
    velocity: str,
    context: str,
    category: str = "NEUTRAL",
    extra: dict | None = None,
) -> dict[str, Any]:
    payload = {
        "event": event,
        "asset": asset,
        "sentiment": round(float(sentiment), 4),
        "velocity": velocity,
        "category": category,
        "context": context[:280],
        "ts": datetime.now(timezone.utc).isoformat(),
        "source": "pulse-layer",
    }
    if extra:
        payload["extra"] = extra
    return payload


async def _ensure_redis():
    global _redis
    if _redis is not None or not settings.redis_url:
        return _redis
    try:
        import redis.asyncio as redis

        _redis = redis.from_url(settings.redis_url, decode_responses=True)
        await _redis.ping()
        log.info("Redis connected")
    except Exception as e:
        log.warning("Redis unavailable: %s", e)
        _redis = False
    return _redis if _redis is not False else None


async def publish(signal: dict[str, Any]) -> None:
    _history.appendleft(signal)
    dead = []
    for q in _subscribers:
        try:
            q.put_nowait(signal)
        except Exception:
            dead.append(q)
    for q in dead:
        if q in _subscribers:
            _subscribers.remove(q)
    r = await _ensure_redis()
    if r:
        try:
            await r.publish("pulse.signals", json.dumps(signal))
        except Exception as e:
            log.debug("redis publish fail %s", e)


def latest(n: int = 20) -> list[dict[str, Any]]:
    return list(_history)[:n]


def subscribe() -> asyncio.Queue:
    q: asyncio.Queue = asyncio.Queue(maxsize=100)
    _subscribers.append(q)
    return q
