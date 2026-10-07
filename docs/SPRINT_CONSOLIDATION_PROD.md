# Sprint consolidation — production ready

## T1 SIWX strict

- `requireSiwx()` **defaults ON**
- Disable only with `REQUIRE_SIWX=0`
- Unsigned / bad sig / expired nonce → HTTP 401 + `status: SAMPLE` (UI safe)

## T2 Prices

- `GET /v1/prices` — EGLD economics + TRO token, **TTL 60s** memory cache
- Front `livePrices.ts` prefers access-api, falls back to MVX direct

## T3 Legacy

- Orphans removed: Agents, LandingHero, MyPacks, Tip (+ README list)
- More can be deleted the same way; not imported by App.tsx

## T4 Sfumato UX

- `SfumatoChapterPlayer` timestamp **flash** on seek
- `lipSyncHooks.ts` — `useLipSync` + `applyMorphTargets` for hologram wire-up

## Env

```bash
JWT_SECRET=...
# REQUIRE_SIWX defaults true; set 0 for local unsigned tests
PULSE_ALLOWLIST=erd1...
PULSE_COLLECTION=...
CORS_ORIGIN=https://neltud.github.io
```

Front: `VITE_ACCESS_API_BASE=https://your-api`
