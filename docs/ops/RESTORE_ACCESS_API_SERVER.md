# Access API incident — restored source, deployment verification pending

**Incident:** 2026-11-17 · `services/access-api/src/server.mjs` was truncated by a repository file update.

## Recovery executed

- Restored the complete `server.mjs` body from the known-good commit `7f6c280f27f6dbdd95f8717d421c815efdb9fb26` (42,360 source characters).
- Reintroduced the `xorusAssistedSwap.mjs` import and both `GET` and `POST /v1/xorus/assisted-swap` handlers.
- Preserved the existing account, walletless, Studio, storefront, Paybox, private xOrus, rights and monitoring routes.
- Main restoration commit: [`f05fc9c2`](https://github.com/Neltud/xArtists/commit/f05fc9c2b3d9f83c205b2b1f8f2bbfc08dcaf475).
- Restored file length: 43,862 characters. The fail-fast `process.exit(1)` stub was removed.
- Follow-up proxy audit + offline regressions: [PR #619](https://github.com/Neltud/xArtists/pull/619).

**Source recovery ≠ production deployment.** No API restart or live response has yet been independently confirmed.

## Live-trading / assisted-swap switches

- `XORUS_LIVE_TRADING=false`: never enable autonomous trading.
- `XORUS_ASSISTED_SWAP_ENABLED`: **unset / 0** by default; when disabled the restored route returns HTTP 503 to POST requests.
- GET `/v1/xorus/assisted-swap` is a safe read-only policy probe and returns `enabled:false` until explicitly approved.
- POST must remain disabled until production token-ID/contract validation, server rate limits, client authorization, simulation-proof checks, reviewed URL checks, and real-wallet E2E tests have passed.

## Verification on the actual access-api host

1. Deploy this restored source to the actual API host (do not assume that GitHub Pages deploys the backend).
2. Confirm the host starts without `process.exit(1)`.
3. Probe `GET https://api.xartists.art/health` and `GET https://api.xartists.art/v1/xorus/assisted-swap`. Expected policy `enabled:false` unless an explicit later GO occurred.
4. Probe POST with an invalid public address and otherwise valid JSON. With gate OFF, it must return HTTP 503 and `assisted_swap_not_enabled` without contacting OneDex.
5. Verify CI: `node --check services/access-api/src/server.mjs` and `node --test services/access-api/tests/serverRestoration.test.mjs`.
6. Confirm `VITE_ACCESS_API_BASE` in the **successful** GitHub Pages build. `.github/workflows/static.yml` currently only accepts the exact repository variable `https://api.xartists.art`; an empty variable results in a disabled front panel.
7. Public `/xorus` must make no direct browser requests to `aggregator.onedex.app`.

## Release blocker

The first Pages build triggered by the restoration commit failed in its frontend release test gate (six unrelated frontend assertions), before building/uploading the new Pages artifact. Do not treat this as a successful Pages rollout.

No secrets, keys, payments, minting, signatures or auto-broadcast are required for this recovery.
