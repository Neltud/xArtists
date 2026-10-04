# LIA Status Aggregator (Task 1 — Unification)

## Professional choice (current)

| Layer | Implementation |
|-------|----------------|
| **Contract** | `lia_status/v1` JSON |
| **Producer** | `python -m lia.vellum.publish_lia_status` (Vellum cadence) |
| **Distribution** | `data/` → mirrored to `apps/frontend/public/data/` + `docs/data/` |
| **Consumer** | `fetchLiaStatus()` in `apps/frontend/src/lia/liaStatus.ts` |
| **Hub** | `/#/lia` prefers aggregator, falls back to live MVX + local shadow |

**Why not FastAPI first?** GitHub Pages has no persistent Node/Python server. JSON publish is the production path that already works with Vellum + Pages. Same JSON schema is what `/api/lia/status` must return later.

## Future FastAPI (optional)

```
GET /api/lia/status  →  identical body to lia_status.json
```

Set `VITE_LIA_API=https://your-api.example` — the client tries API first, then static JSON.

## Fields

- `onchain` — EGLD, tokens, txCount (public wallet)
- `mindset` — strategy, confidence, vellum flags (`LIA_LIVE_TRADING` always documented as 0 in paper publishes)
- `shadow` — fills, PnL USD, last 5 legs, win_rate
- `links` — explorer + hub

## Cadence

Hooked from `publish_data_for_frontend.publish()` after hub status. Also runnable alone.
