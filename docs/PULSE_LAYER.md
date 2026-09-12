# THE PULSE — architecture

```
X API / mock  →  noise filter  →  sentiment (-1..1)  →  velocity
                                              ↓
                                    signal bus (memory + optional Redis)
                                              ↓
                         ┌────────────────────┼────────────────────┐
                         ▼                    ▼                    ▼
                   Strategist/LIA      GrokyversX orchestrator   WebXR visual map
```

Package: `packages/pulse-layer`

## Redis (optional later)

`REDIS_URL=redis://localhost:6379/0` — publish JSON to channel `pulse.signals`.

## Frontend hook (museum / home)

Subscribe `WS /v1/stream` → apply `visual.chaos`, `particleDensity`, etc. on R3F scene.
