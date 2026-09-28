"""
xArtists Pulse API — tranche verticale Hype (Phase 1).
GET /pulse · GET /health · WS /ws/pulse
Simule le cycle Dual-Brain (Grok social → signal ENVIRONMENT_UPDATE).
Pas de PEM · lecture seule · prêt Docker.
"""
from __future__ import annotations

import asyncio
import itertools
import time
from typing import Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="xArtists Pulse API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PULSE_CYCLE: list[dict[str, Any]] = [
    {
        "type": "ENVIRONMENT_UPDATE",
        "sentiment": 0.72,
        "intensity": "high",
        "color_target": "#ffaa00",
        "vibe": "hype_event",
        "category": "MARKET_HYPE",
        "asset": "EGLD",
        "context": "Supernova narrative · constructive volume",
    },
    {
        "type": "ENVIRONMENT_UPDATE",
        "sentiment": 0.41,
        "intensity": "medium",
        "color_target": "#a78bfa",
        "vibe": "art_glow",
        "category": "ART_TREND",
        "asset": "ART",
        "context": "WebXR gallery · xArtists builders shipping",
    },
    {
        "type": "ENVIRONMENT_UPDATE",
        "sentiment": 0.28,
        "intensity": "low",
        "color_target": "#22d3ee",
        "vibe": "whale_calm",
        "category": "WHALE_MOVE",
        "asset": "HTM",
        "context": "Quiet accumulation talk",
    },
    {
        "type": "ENVIRONMENT_UPDATE",
        "sentiment": -0.35,
        "intensity": "medium",
        "color_target": "#64748b",
        "vibe": "crash_fog",
        "category": "SOCIAL_CRASH",
        "asset": "MACRO",
        "context": "Risk-off chatter · demo only",
    },
    {
        "type": "ENVIRONMENT_UPDATE",
        "sentiment": 0.05,
        "intensity": "low",
        "color_target": "#94a3b8",
        "vibe": "neutral",
        "category": "NEUTRAL",
        "asset": "MACRO",
        "context": "Pulse idle · paper demo",
    },
]

_cycle = itertools.cycle(PULSE_CYCLE)
_current: dict[str, Any] = {**PULSE_CYCLE[0], "ts": int(time.time()), "source": "seed"}
_tick_lock = asyncio.Lock()


def _stamp(env: dict[str, Any]) -> dict[str, Any]:
    return {**env, "ts": int(time.time()), "source": "pulse-api"}


async def _ticker() -> None:
    global _current
    while True:
        await asyncio.sleep(8)
        async with _tick_lock:
            _current = _stamp(next(_cycle))


@app.on_event("startup")
async def startup() -> None:
    asyncio.create_task(_ticker())


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "pulse-api"}


@app.get("/pulse")
async def get_pulse() -> dict[str, Any]:
    async with _tick_lock:
        return dict(_current)


@app.websocket("/ws/pulse")
async def ws_pulse(ws: WebSocket) -> None:
    await ws.accept()
    last_ts = 0
    try:
        while True:
            async with _tick_lock:
                payload = dict(_current)
            if payload.get("ts") != last_ts:
                last_ts = int(payload.get("ts") or 0)
                await ws.send_json(payload)
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        return
