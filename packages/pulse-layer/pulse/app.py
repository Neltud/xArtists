"""FastAPI entry — THE PULSE."""
from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field

from pulse import __version__
from pulse.config import settings
from pulse.ingestion import process_raw_text, run_loop
from pulse.sentiment import analyze_text
from pulse.signals import latest, subscribe
from pulse.visual_map import sentiment_to_visual

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("pulse.app")

_stop = asyncio.Event()
_task: asyncio.Task | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _task
    _stop.clear()
    _task = asyncio.create_task(run_loop(_stop))
    log.info("PULSE started v%s x_enabled=%s", __version__, settings.x_enabled)
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
        "keywords": settings.keywords[:6],
    }


@app.post("/v1/analyze")
async def analyze(body: AnalyzeIn) -> dict[str, Any]:
    res = analyze_text(body.text)
    sig = await process_raw_text(body.text)
    visual = sentiment_to_visual(res.score, (sig or {}).get("velocity") or "low")
    return {"sentiment": res.__dict__, "signal": sig, "visual": visual}


@app.get("/v1/signals/latest")
async def signals_latest(n: int = 20) -> dict[str, Any]:
    return {"signals": latest(min(n, 100))}


@app.websocket("/v1/stream")
async def ws_stream(ws: WebSocket):
    await ws.accept()
    q = subscribe()
    try:
        while True:
            sig = await q.get()
            visual = sentiment_to_visual(sig.get("sentiment") or 0, sig.get("velocity") or "low")
            await ws.send_json({"signal": sig, "visual": visual})
    except WebSocketDisconnect:
        pass
