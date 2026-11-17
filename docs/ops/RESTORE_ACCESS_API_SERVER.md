# CRITICAL — Restore `services/access-api/src/server.mjs`

**Date:** 2026-11-17  
**Status:** `server.mjs` on `main` is incomplete after a tool write error during `/v1/xorus/assisted-swap` wiring.

## What is OK on main

- `services/access-api/src/xorusAssistedSwap.mjs` — full proxy module (policy + OneDex MCP)
- `apps/frontend/.../XorusAssistedSwapPanel.tsx` — calls only `POST {VITE_ACCESS_API_BASE}/v1/xorus/assisted-swap`
- `xorus/execution/*` policy + assisted gates (Python)

## What is broken

- `services/access-api/src/server.mjs` — truncated; process exits on start until restored.

## Restore (operator, 2 min)

```bash
# 1. Take last good full file
curl -sL \
  "https://raw.githubusercontent.com/Neltud/xArtists/7f6c280f27f6dbdd95f8717d421c815efdb9fb26/services/access-api/src/server.mjs" \
  -o /tmp/server.mjs

# 2. Add import (after xorusAnalysis import)
# import { runAssistedSwap, XORUS_ASSISTED_SWAP_POLICY } from './xorusAssistedSwap.mjs'

# 3. Add route after /v1/xorus/analysis block:
#   GET  /v1/xorus/assisted-swap → policy public
#   POST /v1/xorus/assisted-swap → runAssistedSwap(body)

# 4. Push
gh api --method PUT /repos/Neltud/xArtists/contents/services/access-api/src/server.mjs \
  -f message='fix(access-api): restore server.mjs + assisted-swap route' \
  -f branch=main \
  -f content="$(base64 -w0 /tmp/server.mjs)" \
  -f sha="$(gh api /repos/Neltud/xArtists/contents/services/access-api/src/server.mjs --jq .sha)"
```

Exact route body is in the local patch applied during the session (policy → MCP → signingLink only if sim OK).

## After restore

1. Redeploy access-api.
2. Confirm `GET /v1/xorus/assisted-swap` returns policy JSON.
3. Confirm Pages build has `VITE_ACCESS_API_BASE` set.
4. Front panel remains proxy-only (no browser MCP).
