# Sprint GO — Operator checklist (updated 2026-11-02 20:38 CET)

**Release:** 0.129.1  
**API:** https://xartists-access-api.onrender.com

## A. Public surfaces — DONE (probed)

- [x] Pages home + 3 packs + TRO sale → 200
- [x] `lia_status.json` paper · LIA_LIVE_TRADING 0
- [x] daily signal 200
- [x] API `/health` 200
- [x] API signals / TRO bridge status / physical+studio config

## B. access-api — measured

| Flag | Measured | Target dry GO |
|------|----------|---------------|
| paybox_mode | **prod** | prod |
| paybox_checkout_enabled | **false** (expected after API repair) | **false until commercial GO** |
| orders_backend | postgres | postgres |
| mint_dry_run | true | true |
| mint_live_enabled | false | false |
| mint_dispatch_enabled | **false** | **true** (next) |
| lia_live_trading | 0 | 0 |

### Credential and dispatch proof — separate gates

**Current finding:** Render flags `MINT_DISPATCH_ENABLED=1`, `MINT_DRY_RUN=1`,
`MINT_LIVE_ENABLED=0`, `LIA_LIVE_TRADING=0` were set earlier; public
`/health` still reports `mint_dispatch_enabled=false`. The server evaluates
this as *flag AND token present*. This is a credential block, **not** permission
to run a live transaction.

1. GitHub → Settings → Developer settings → Personal access tokens →
   **Fine-grained tokens**. Create a short-lived token restricted to
   `Neltud/xArtists`, with **Actions: Read and write** (Metadata: Read).
   Do not place a token in Git, a PR, a CI log or a chat.
2. Render → xartists-access-api → Environment: set **secret**
   `MINT_GITHUB_PAT` to that token using the dashboard, not a placeholder.
   Ensure `MINT_DISPATCH_ENABLED=1`, `MINT_DRY_RUN=1`,
   `MINT_LIVE_ENABLED=0`, `LIA_LIVE_TRADING=0`. Save/deploy.
3. After Render is live, verify `/health` has
   `mint_dispatch_enabled=true`, `mint_dry_run=true`,
   `mint_live_enabled=false`, `lia_live_trading=0`. Do not print token.
4. To prove the **GitHub Actions** side independently, run
   [Mint dispatch dry-run probe](https://github.com/Neltud/xArtists/actions/workflows/mint-dispatch-dryrun-probe.yml)
   on `main`. This trusted workflow uses the built-in **short-lived**
   `GITHUB_TOKEN` in an isolated runner; it issues one real HTTP 204
   dispatch, rejects concurrent replay in its isolated store, checks the
   downstream dry-run completed and does **not** use the Render secret,
   any PSP payment or a PEM. Its success **does not** prove Render→GitHub
   or Postgres cross-instance idempotence; test those separately.
5. The production IPN-path proof requires a **properly signed** test
   payment on an isolated, authorized PSP test environment and a
   reconciliation receipt. Never manufacture a paid order in production.

No live mint, NFT delivery, buyer payment or chain transfer is authorised
by this checklist. Keep `MINT_DRY_RUN=1` until a separately approved GO.

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
