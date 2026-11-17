# Neon Edge — Option A (xArtists)

Thin **Neon Functions Free** HTTP surface for P0 host when **no VPS** is available.

## Scope (v0)

| Route | Behavior |
|--------|----------|
| `GET /health` | Liveness + build identity |
| `GET /v1/ops/build-info` | SHA / role / flags (all financial OFF) |
| `GET /v1/xorus/assisted-swap` | Policy JSON, **`enabled: false`** always in this edge unless env explicitly set (default OFF) |
| `POST /v1/xorus/assisted-swap` | **503** while disabled — no MCP, no signingLink |

## Non-goals

- Not a replacement for full `services/access-api` (~133 routes)
- Not Studio / mint / Paybox / escrow
- Do **not** set `VITE_ACCESS_API_BASE` to this edge until product accepts a partial API
- No DNS change required for first deploy (use Neon Function URL for smoke)

## Flags

| Env | Default | Meaning |
|-----|---------|----------|
| `XORUS_ASSISTED_SWAP_ENABLED` | unset / not `1` | POST remains 503 |
| `GIT_SHA` | `unknown` | Reported in health/build-info |
| `CORS_ORIGINS` | `https://xartists.art,https://www.xartists.art` | Exact-origin only |

## Deploy (owner)

1. Neon Console → project sandbox → **Functions** → create Node handler from `handler.mjs`.
2. Set `GIT_SHA` to the deploy commit.
3. Leave `XORUS_ASSISTED_SWAP_ENABLED` unset.
4. Public smoke:
   ```bash
   curl -sS "$NEON_FN_URL/health"
   curl -sS "$NEON_FN_URL/v1/xorus/assisted-swap"
   curl -sS -X POST "$NEON_FN_URL/v1/xorus/assisted-swap" -H 'content-type: application/json' -d '{}'  # expect 503
   ```
5. Comment results on issue **#613** (URL + SHA, no secrets).

## Relation to access-api

`xorusAssistedSwap.mjs` in access-api remains the **full** proxy (MCP + policy) for when a complete host exists. This edge intentionally **does not** call OneDex until a later controlled promotion and explicit flag + review.
