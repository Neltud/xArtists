# THE PULSE — xArtists Empire

Real-time social intelligence layer. Bridges X (Twitter) chaos → structured signals for **Strategist** (Claude/LIA board) and **GrokyversX** (execution).

## Dual-brain

| Brain | Role |
|-------|------|
| **Strategist** | Logic, architecture, risk gates |
| **THE PULSE** (this package) | Ingestion, sentiment, hype velocity, webhooks |

## Signal contract

```json
{
  "event": "HYPE_DETECTED",
  "asset": "HTM",
  "sentiment": 0.85,
  "velocity": "high",
  "context": "short human summary",
  "ts": "2026-09-12T21:00:00Z",
  "source": "pulse-layer"
}
```

Events: `HYPE_DETECTED` | `SENTIMENT_SHIFT` | `NOISE` | `HEARTBEAT`

## Stack

- FastAPI + asyncio
- Optional Redis pub/sub
- X API v2 (Bearer) — **not committed**; set `X_BEARER_TOKEN`
- Without token: **replay mode** from fixtures / keyword mock

## Quick start

```bash
cd packages/pulse-layer
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export X_BEARER_TOKEN=...   # optional
uvicorn pulse.app:app --reload --port 8787
```

- `GET /health`
- `POST /v1/analyze` `{ "text": "..." }`
- `GET /v1/signals/latest`
- `WS /v1/stream`

## Wire to GrokyversX

Orchestrator can poll `GET /v1/signals/latest` or subscribe webhook  
`POST {GROK_HOST}/hooks/pulse` with the JSON contract above.

## Security

No PEM. No Discord bot token in this package. X bearer = host secret only.
