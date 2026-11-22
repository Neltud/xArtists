# Neon Edge — Option A (xArtists)

Thin **Neon Functions Free** HTTP surface for P0 host when **no VPS** is available.

## Entry point

Neon expects a Web-standard export:

```js
export async function fetch(request) { ... }
```

Defined in `handler.mjs`. Do not rename to a bare `handler` without a `fetch` alias.

## Scope (v0)

| Route | Methods | Behavior |
|--------|---------|----------|
| `/health` | GET, HEAD | Liveness; **never** claims swap execution |
| `/v1/ops/build-info` | GET, HEAD | SHA / role / flags |
| `/v1/xorus/assisted-swap` | GET | Policy + `enabled: false` |
| `/v1/xorus/assisted-swap` | POST | **503** if flag off; **501** if flag on (not implemented on edge) |

### Flag vs capability

| Field | Meaning |
|--------|---------|
| `assisted_swap_flag_configured` | `XORUS_ASSISTED_SWAP_ENABLED===1` in env |
| `assisted_swap_capable` | Always **false** on neon-edge-v0 |
| `assisted_swap_enabled` / `enabled` | Always **false** on this edge |

## Non-goals

- Not a replacement for full `services/access-api`
- Not Studio / mint / Paybox / escrow
- Do **not** set `VITE_ACCESS_API_BASE` here until product accepts a partial API
- No DNS change for first deploy (use Neon Function URL for smoke)

## Local smoke

```bash
node services/neon-edge/smoke-local.mjs
```

## Deploy (owner)

1. Neon Console → Functions → Node handler using `export async function fetch`.
2. Set `GIT_SHA` to the deploy commit. Leave `XORUS_ASSISTED_SWAP_ENABLED` unset.
3. Smoke:
   ```bash
   curl -sS "$NEON_FN_URL/health"
   curl -sS -X POST "$NEON_FN_URL/v1/xorus/assisted-swap" -H 'content-type: application/json' -d '{}'  # 503
   ```
4. Report URL + SHA on issue **#613**.
