"""
xArtists Vellum 8008 proxy — NEVER expose Vellum API key to the browser.

Front calls: POST /vellum-8008  (VITE_VELLUM_8008_WEBHOOK)
Proxy calls: Vellum execute-workflow with VELLUM_API_KEY from env.

Env:
  VELLUM_API_KEY          required
  VELLUM_WORKFLOW_NAME    default xartists-8008-intents
  VELLUM_API_URL          default https://api.vellum.ai/v1/execute-workflow
  ALLOW_ORIGINS           comma list, default *
"""
from __future__ import annotations

import os
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="xArtists Vellum 8008 Proxy", version="1.0.0")

origins = [o.strip() for o in os.getenv("ALLOW_ORIGINS", "*").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)

VELLUM_API_KEY = os.getenv("VELLUM_API_KEY", "")
VELLUM_WORKFLOW = os.getenv("VELLUM_WORKFLOW_NAME", "xartists-8008-intents")
VELLUM_URL = os.getenv(
    "VELLUM_API_URL", "https://api.vellum.ai/v1/execute-workflow"
)


@app.get("/health")
async def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "service": "vellum-8008-proxy",
        "key_configured": bool(VELLUM_API_KEY),
        "workflow": VELLUM_WORKFLOW,
    }


@app.post("/vellum-8008")
async def vellum_8008(request: Request) -> dict[str, Any]:
    if not VELLUM_API_KEY:
        raise HTTPException(503, "VELLUM_API_KEY not configured")

    try:
        body = await request.json()
    except Exception as e:
        raise HTTPException(400, f"invalid json: {e}") from e

    # Accept front shape from agent8008Bridge.buildVellumProxyBody
    workflow = body.get("workflow_deployment_name") or VELLUM_WORKFLOW
    external_id = body.get("external_id") or f"xa-8008-{body.get('intent', 'unknown')}"
    inputs = body.get("inputs")
    if not inputs:
        # flatten simple shape
        inputs = [
            {"name": "intent_type", "type": "STRING", "value": str(body.get("intent", ""))},
            {"name": "agent_id", "type": "STRING", "value": str(body.get("agent", "8008"))},
            {"name": "paper", "type": "STRING", "value": str(body.get("paper", True)).lower()},
            {
                "name": "payload_json",
                "type": "STRING",
                "value": __import__("json").dumps(body.get("payload") or body),
            },
        ]

    payload = {
        "workflow_deployment_name": workflow,
        "external_id": external_id,
        "inputs": inputs,
    }

    headers = {
        "Authorization": f"Bearer {VELLUM_API_KEY}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            res = await client.post(VELLUM_URL, json=payload, headers=headers)
        except httpx.RequestError as e:
            raise HTTPException(502, f"vellum unreachable: {e}") from e

    if res.status_code >= 400:
        raise HTTPException(
            502,
            f"vellum HTTP {res.status_code}: {res.text[:300]}",
        )

    try:
        data = res.json()
    except Exception:
        data = {"raw": res.text[:500]}

    return {"ok": True, "vellum": data, "external_id": external_id}


@app.get("/")
async def root() -> dict[str, str]:
    return {"service": "vellum-8008-proxy", "post": "/vellum-8008"}
