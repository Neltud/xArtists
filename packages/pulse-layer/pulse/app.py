"""FastAPI entry — THE PULSE v2."""
from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field

from pulse import __version__
from pulse.categories import categorize
from pulse.config import settings
from pulse.env_update import build_environment_update
from pulse.ingestion import process_raw_text, run_loop
from pulse.sentiment import analyze_text
from pulse.signals import latest, subscribe

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("pulse.app")

_stop = asyncio.Event()
_task: asyncio.Task | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _task
    _stop.clear()
    _task = asyncio.create_task(run_loop(_stop))
    log.info("PULSE v%s x_api=%s redis=%s", __version__, settings.x_enabled, bool(settings.redis_url))
    yield
    _stop.set()
    if _task:
        await asyncio.sleep(0.1)
        _task.cancel()


app = FastAPI(title="THE PULSE", version=__version__, lifespan=lifespan)


class AnalyzeIn(BaseModel):
    text: str = Field(..., min_length=1, max_length=4000)


@app.get("/health")
async def health() -> dict[str, Any]:
    return {
        "ok": True,
        "service": "pulse-layer",
        "version": __version__,
        "x_api": settings.x_enabled,
        "redis": bool(settings.redis_url),
        "keywords": settings.keywords[:6],
    }


@app.post("/v1/analyze")
async def analyze(body: AnalyzeIn) -> dict[str, Any]:
    res = analyze_text(body.text)
    cat = categorize(body.text, res.score)
    sig = await process_raw_text(body.text)
    env = build_environment_update(
        sentiment=res.score,
        velocity=(sig or {}).get("velocity") or "low",
        category=cat,
        context=body.text,
    )
    return {"sentiment": res.__dict__, "category": cat, "signal": sig, "environment": env}


@app.get("/v1/signals/latest")
async def signals_latest(n: int = 20) -> dict[str, Any]:
    return {"signals": latest(min(n, 100))}


@app.get("/v1/environment/latest")
async def environment_latest() -> dict[str, Any]:
    sigs = latest(1)
    if not sigs:
        env = build_environment_update(sentiment=0.0, velocity="low", category="NEUTRAL")
        return {"environment": env}
    s = sigs[0]
    extra = s.get("extra") or {}
    env = extra.get("environment") or build_environment_update(
        sentiment=float(s.get("sentiment") or 0),
        velocity=str(s.get("velocity") or "low"),
        category=str(s.get("category") or "NEUTRAL"),
        asset=str(s.get("asset") or "MACRO"),
        context=str(s.get("context") or ""),
    )
    return {"environment": env, "signal": s}


@app.websocket("/v1/stream")
async def ws_stream(ws: WebSocket):
    await ws.accept()
    q = subscribe()
    try:
        while True:
            sig = await q.get()
            extra = sig.get("extra") or {}
            env = extra.get("environment")
            await ws.send_json({"signal": sig, "environment": env})
    except WebSocketDisconnect:
        pass
