# Sprint GO — Operator checklist (updated 2026-11-03, Europe/Paris)

**Deployment evidence:** `main` commit `df501fd408ab8c427c453676c9c48b12727bf88e` live on both Render services after [PR #306](https://github.com/Neltud/xArtists/pull/306); observed 3 November 2026. Previous observations remain historical snapshots.
**API:** https://xartists-access-api.onrender.com

**Decision:** Public read-only website **GO with transient availability caveat**; commercial PayBox, autonomous LIA, mainnet mint and $TRO Solana bridge **NO-GO**. A Render `live` deployment is not a PSP transaction or NFT delivery proof.

## A. Public surfaces — DONE (probed)

- [x] Pages home + 3 packs + TRO sale → 200
- [x] `lia_status.json` paper · LIA_LIVE_TRADING 0
- [x] daily signal 200
- [x] API `/health` 200
- [x] API signals / TRO bridge status / physical+studio config
- [x] Public Render frontend `https://xartists-services-and-products.onrender.com/xArtists/` reachable in independent smoke (Render Free may briefly return 503)
- [x] Both `/xArtists/tro/sale/` frontends render informational portal; bridge and direct sale stay off
- [x] PR #295 fixes exact CORS for Pages and Render; unknown browser origins denied
- [ ] Observe repeated six-hour `GO public smoke` after the additional Render/CORS probe is merged; report recurrent 503 and stale Pages cached assets

## B. access-api — measured

| Flag | Measured | Target dry GO |
|------|----------|---------------|
| paybox_mode | **prod** | prod |
| paybox_checkout_enabled | **false** (expected after API repair) | **false until commercial GO** |
| orders_backend | postgres | postgres |
| mint_dry_run | true | true |
| mint_live_enabled | false | false |
| mint_dispatch_enabled (legacy PAT) | **false** | **false** |
| mint_oidc_pull_enabled (PAT-free dry-run) | **true** | **true, dry-run only** |
| mint_micro_price | **false** | **false** |
| lia_live_trading | 0 | 0 |

### Credential and dispatch proof — separate gates

**Observed production health (3 November 2026, after PR #306):**
`/health` returns `ok=true`, `service=access-api`,
`paybox_mode=prod` (merchant configured, **not** checkout enabled),
`paybox_checkout_enabled=false`, `mint_oidc_pull_enabled=true`,
`mint_dispatch_enabled=false`, `mint_dry_run=true`,
`mint_live_enabled=false`, `mint_micro_price=false`,
`lia_live_trading=0`, `tro_solana_bridge=off`.
`/v1/ops/orders-store/status` verifies **read-only** PostgreSQL
connectivity and `paybox_orders` table readiness. Neither endpoint proves
card capture, database writes, mint or NFT delivery.

1. **Security P0: revoke the previously exposed GitHub PAT at its issuer**,
   using GitHub secure settings. Render has been cleared of that PAT, but
   clearing Render does not revoke a leaked token.
2. **PAT-free OIDC is proven on production (DRY ONLY):** [PR #304](https://github.com/Neltud/xArtists/pull/304)
   and [PR #305](https://github.com/Neltud/xArtists/pull/305) merged. The
   [bootstrap run #41624031389](https://github.com/Neltud/xArtists/actions/runs/41624031389)
   dispatched the [real OIDC child #41624043754](https://github.com/Neltud/xArtists/actions/runs/41624043754)
   (SUCCESS); the child passed a signed GitHub OIDC identity to Render and
   queried the Postgres-backed queue: `candidate orders=0`,
   `GitHub HTTP 204=0`. **No real order dispatch and no NFT delivery proven.**
   Production `MINT_OIDC_PULL_ENABLED=1` and legacy
   `MINT_DISPATCH_ENABLED=0`; do **not** introduce a fresh PAT just to
   make the legacy flag true.
3. Keep `MINT_DRY_RUN=1`, `MINT_LIVE_ENABLED=0`,
   `MINT_MICRO_PRICE=false`, `PAYBOX_CHECKOUT_ENABLED=0`,
   `LIA_LIVE_TRADING=0` and TRO bridge off. If the OIDC dry-run queue
   must be paused, set `MINT_OIDC_PULL_ENABLED=0`; previously reserved
   jobs require reconciliation before any retry.
4. **S1/S2 candidate verifier is now merged, not commercially approved:**
   [PR #306](https://github.com/Neltud/xArtists/pull/306) with seven
   CI checks passing. `s1s2Reconciliation.mjs` requires a signed-PSP
   evidence trail, exact catalogue price, a correlated live mint job,
   independently approved issuer/collection, unique PSP/tx/NFT bindings
   and read-only MultiversX transaction and holder evidence. Its strongest
   result is **`candidate_verified=true, delivery_verified=false`**;
   no HTTP endpoint, sale, chain write or order-delivery mutation is added.
5. A genuine signed PayBox S1 receipt, authorized mint mainnet S2, refund
   and SQL-atomic delivery reconciliation are still required for commercial
   GO. Track them in [issue #281](https://github.com/Neltud/xArtists/issues/281).

No live mint, NFT delivery, buyer payment or mainnet transfer is
authorised by this checklist.

## C. Mainnet mint — blocked until separate human GO

The legacy `micro_price=true` route is **NOT authorised**. The smart-contract
`setPackPrice`-then-`buyPack` sequence is non-atomic for unrelated purchasers,
even with a GitHub Actions concurrency group. After the P0 safety fix, the
backend defaults `MINT_MICRO_PRICE=false`, requires an **explicit**
`MINT_MAINNET_CONFIRM=LIVE_MINT_MAINNET`, and the workflow refuses **live**
`micro_price=true` before loading or writing the PEM.

- [ ] Independent security review of mainnet pricing/mint semantics and verified
      wallet recipient, collection, supply and replay protection.
- [x] **Read-only** S2 candidate verifier / S1–S2 binding implemented and
      CI-tested ([#297](https://github.com/Neltud/xArtists/pull/297),
      [#306](https://github.com/Neltud/xArtists/pull/306)); **this does not
      report or persist delivery**.
- [ ] Independently approve real S1/S2 evidence and implement SQL-atomic,
      idempotent NFT delivery binding with operator review.
- [ ] Controlled S1 PayBox test and refund reconciliation; no real payment yet.
- [ ] Explicit per-capability operator approval and protected GitHub environment.

**Read-only deployer liquidity observation (3 November 2026):**
`0.005341715 EGLD` at `erd1kex0pvp9dng8j76sgsejkyx86nhxuqk24my6wnha8dga9mymvhxqvl8v0g`.
This cannot fund a full-price mainnet pack purchase. Balances change;
re-check on chain before any separate operator-approved operation.

**Do not use the legacy micro-price recipe or turn on
`MINT_LIVE_ENABLED` to conduct the dry-run proof.**


## D. Commercial

- [ ] S1 PayBox real (Sentinel)
- [ ] S2 My Packs NFT
- [ ] Whop TCA prod_

## E. Non-goals

LIA trade · Solana bridge · Studio/Physical prod without separate GO
