# pulse-api — Tranche verticale Hype (Phase 1)

FastAPI service for Dual-Brain Pulse signals.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness |
| GET | `/pulse` | Current `ENVIRONMENT_UPDATE` |
| WS | `/ws/pulse` | Stream on change (~8s cycle) |

## Run local

```bash
cd services/pulse-api
pip install -r requirements.txt
uvicorn main:app --reload --port 8090
```

## Docker

```bash
docker compose up pulse-api
```

## Frontend

```
VITE_PULSE_API=http://localhost:8090
```

On GitHub Pages without API: `usePulse` falls back to `PULSE_DEMO_CYCLE`.

No PEM. Read-only signals.
