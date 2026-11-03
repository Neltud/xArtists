# Sprint GO — Operator checklist (updated 2026-11-03, Europe/Paris)

**Deployment evidence:** `main` commit `627409a293ec7d9f455edf6360a2de4271c52d4e` live on both Render services after PR #295.
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
| mint_dispatch_enabled | **false** | **false until separately authorised** |
| lia_live_trading | 0 | 0 |

### Credential and dispatch proof — separate gates

**Current public observation (3 November 2026):** `/health` returns
`paybox_checkout_enabled=false`, `mint_dispatch_enabled=false`,
`mint_dry_run=true`, `mint_live_enabled=false`, `lia_live_trading=0`,
`tro_solana_bridge=off`; `/v1/ops/orders-store/status` confirms actual
read-only PostgreSQL connectivity and `paybox_orders` table readiness.
These are not proofs of PSP settlement, on-chain mint or NFT delivery.

1. **Security P0: revoke the GitHub PAT previously posted into the chat.**
   The operator must verify its revocation in GitHub secure settings.
   The cleared Render environment value is not sufficient to revoke
   a compromised token. Do not paste or log the replacement.
2. **Independent CI dry-run requires no Render PAT.** The
   [Mint dispatch dry-run probe](https://github.com/Neltud/xArtists/actions/workflows/mint-dispatch-dryrun-probe.yml)
   uses an ephemeral job-scoped `GITHUB_TOKEN`, isolated runner state,
   no actual payment, no PEM and no mainnet mint. Its recorded success
   proves only the isolated dispatch path, not Render-to-GitHub dispatch.
3. Keep production `MINT_DISPATCH_ENABLED=0`, `MINT_DRY_RUN=1`,
   `MINT_LIVE_ENABLED=0`, `PAYBOX_CHECKOUT_ENABLED=0` and
   `LIA_LIVE_TRADING=0` until an expressly approved scoped release.
   Do **not** change production environment flags just to obtain a green smoke.
4. A later production-to-GitHub dispatch proof needs a fresh,
   least-privileged credential configured **only in Render's secure store**,
   an independently reviewed authorization and idempotence/rollback proof;
   HTTP 204 indicates accepted dispatch, never confirmed NFT delivery.
5. PSP S1 real signatures, on-chain S2 buyer/asset/tx proof, rollback and
   refund reconciliation remain mandatory for commercial GO in
   [issue #281](https://github.com/Neltud/xArtists/issues/281).

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
- [ ] Separate on-chain receipt/transfer verifier correlating buyer, order,
      NFT identifier and tx hash before reporting delivery.
- [ ] Controlled S1 PayBox test and refund reconciliation; no real payment yet.
- [ ] Explicit per-capability operator approval and protected GitHub environment.

**Do not use the legacy micro-price recipe or turn on
`MINT_LIVE_ENABLED` to conduct the dry-run proof.**


## D. Commercial

- [ ] S1 PayBox real (Sentinel)
- [ ] S2 My Packs NFT
- [ ] Whop TCA prod_

## E. Non-goals

LIA trade · Solana bridge · Studio/Physical prod without separate GO
