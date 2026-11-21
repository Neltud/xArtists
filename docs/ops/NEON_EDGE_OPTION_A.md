# Option A — Neon Edge progressive host

**Decision (17 Nov 2026):** no confirmed VPS → port **health + assisted-disabled** first on Neon Functions Free.

## Why

- `api.xartists.art` currently unreachable
- Full access-api needs a process host; Neon Postgres alone is not HTTP
- Neon Functions provide HTTPS entry without buying a VPS

## Safety

- `XORUS_ASSISTED_SWAP_ENABLED` default OFF → POST **503**
- Edge v0 **never** calls OneDex MCP even if flag is wrongly set (501)
- `replaces_full_access_api: false` in build-info
- Do not point Pages `VITE_ACCESS_API_BASE` here until product accepts partial API

## Code

- `services/neon-edge/handler.mjs`
- `services/neon-edge/smoke-local.mjs`
- `services/neon-edge/README.md`

## Owner deploy steps

See README. Report URL + SHA on **#613** after first Function publish.

## Next routes (later, still no commerce)

1. Paper xOrus analysis read-only (if already pure compute)
2. Auth pilot already exists separately — do not merge identities carelessly
3. Only then evaluate promoting assisted MCP proxy under flag + review
