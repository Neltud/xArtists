"""Signal store + bridge format."""
from __future__ import annotations

import asyncio
from collections import deque
from datetime import datetime, timezone
from typing import Any

MAX_HISTORY = 200
_history: deque[dict[str, Any]] = deque(maxlen=MAX_HISTORY)
_subscribers: list[asyncio.Queue] = []


def make_signal(
    *,
    event: str,
    asset: str,
    sentiment: float,
    velocity: str,
    context: str,
    extra: dict | None = None,
) -> dict[str, Any]:
    payload = {
        "event": event,
        "asset": asset,
        "sentiment": round(float(sentiment), 4),
        "velocity": velocity,
        "context": context[:280],
        "ts": datetime.now(timezone.utc).isoformat(),
        "source": "pulse-layer",
    }
    if extra:
        payload["extra"] = extra
    return payload


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


def latest(n: int = 20) -> list[dict[str, Any]]:
    return list(_history)[:n]


def subscribe() -> asyncio.Queue:
    q: asyncio.Queue = asyncio.Queue(maxsize=100)
    _subscribers.append(q)
    return q
