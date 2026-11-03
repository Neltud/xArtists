# PAT-free mint dry-run dispatch — GitHub OIDC pull

Code default: **disabled** unless explicitly enabled. **Production observation 3 November 2026:** Render `MINT_OIDC_PULL_ENABLED=1`, OIDC dry-run enabled; legacy PAT-based dispatch **off**. Scope: dry-run dispatch **only**.
No PayBox payments are created by this workflow; no private key, transaction signing,
NFT delivery, transfer, live trading, or Solana bridge action is possible.

## Why

Render's `mint_dispatch_enabled` is false without `MINT_GITHUB_PAT` or
`GITHUB_TOKEN`. Never reuse an exposed PAT. Instead, the trusted GitHub
Actions workflow pulls eligible *already server-verified* PayBox orders from
Render, then calls GitHub's workflow dispatch endpoint with its short-lived
`GITHUB_TOKEN`. Render never stores a GitHub PAT.

## Trust boundary

* API route: `POST /v1/ops/mint-oidc-pull` (no public order listing).
* GitHub OIDC: RS256 against GitHub's HTTPS JWKS, pinned audience
  `xartists-render-mint-pull-v1`, issuer, fixed GitHub repository ID
  `999144165`, owner ID `95723989`, exact `main` ref, workflow path,
  event `schedule` or `workflow_dispatch`, expiry/iat checks.
* Only `/health` exposes `mint_oidc_pull_enabled` (boolean, no order data).
* Hard gate: `MINT_OIDC_PULL_ENABLED=1` AND PostgreSQL AND
  `MINT_DRY_RUN=1` AND `MINT_LIVE_ENABLED=0` AND
  `MINT_MICRO_PRICE=false`; off by default, any unsafe flag disables the route.
* Eligible only when the **stored** order is `paid`, `server_confirmed===true`,
  valid buyer/pack/amount/provider transaction, and not already verified delivered.
  Client-supplied `paid` or order payload is ignored.
* Claims are durable in `mint_jobs`, under a PostgreSQL advisory transaction
  lock, BEFORE the GitHub REST call. Two workers cannot claim one order.
  The opaque claim ID and exact OIDC workflow run/attempt must match on ack.
* After GitHub `204`, state `submitted` **not** `confirmed`. On uncertainty,
  retain a non-retryable claim requiring manual reconciliation. Both states
  block automatic redelivery; manual reconciliation must inspect GitHub runs.
* The downstream `mint-on-payment.yml` receives `live_mint=false`,
  `micro_price=false`, `confirm=DRY_RUN`. Its dry_run job has no production
  environment, PEM, or on-chain effect.

## Verified production exercise — 3 November 2026

- [PR #304](https://github.com/Neltud/xArtists/pull/304) merged the OIDC queue,
  RS256 verification and PostgreSQL anti-replay checks; its isolated OIDC/PG
  CI and all PR checks passed.
- [PR #305](https://github.com/Neltud/xArtists/pull/305) added one-shot
  trusted-main bootstrap. [Bootstrap #41624031389](https://github.com/Neltud/xArtists/actions/runs/41624031389)
  completed and started [OIDC child #41624043754](https://github.com/Neltud/xArtists/actions/runs/41624043754),
  which successfully **authenticated with Render and queried the queue**.
  Its log states `candidate orders=0, GitHub HTTP 204=0`.
- The OIDC proof confirms **GitHub → Render authentication only**, not an
  HTTP 204 mint dispatch for an authentic paid order and not S1/S2 delivery.
  No synthetic paid orders were inserted into production.
- After [PR #306](https://github.com/Neltud/xArtists/pull/306) deployed
  (`main=df501fd408ab8c427c453676c9c48b12727bf88e`), both Render services
  were live and `/health` still reported:
  `mint_oidc_pull_enabled=true`, `mint_dispatch_enabled=false`,
  `mint_dry_run=true`, `mint_live_enabled=false`,
  `mint_micro_price=false`, `paybox_checkout_enabled=false`,
  `lia_live_trading=0`, `tro_solana_bridge=off`; PostgreSQL readiness
  remained `ok=true`, `table_ready=true`.
- The older PAT was **cleared in Render**, but only the operator can
  independently confirm its **revocation at GitHub**. Never reuse it.

## Activation order

1. **Completed for the current dry-run rollout:** merge PRs #304/#305,
   confirm Render deployed them and `/health` reports mint live off.
   Repeat this check for every subsequent deployment.
2. Keep `MINT_DISPATCH_ENABLED=0` (legacy PAT push path off), keep
   `PAYBOX_CHECKOUT_ENABLED=0`, and do NOT add or reuse any GitHub PAT.
3. **Already enabled in Render for dry-run** (`MINT_OIDC_PULL_ENABLED=1`).
   Do not change other gates; verify `/health` reports
   `mint_oidc_pull_enabled=true`, `mint_dispatch_enabled=false`,
   `mint_dry_run=true`, `mint_live_enabled=false`,
   `mint_micro_price=false`, `lia_live_trading=0`.
4. **Completed authentication probe:** trusted bootstrap and OIDC child
   succeeded with `candidate orders=0`, and therefore zero actual mint
   dispatches. Scheduled and manual future runs remain **dry-run only**.
   Check the ledger and child run when authentic paid orders appear; never
   fabricate them in production.
5. For any authentic paid order, correlate `mint_jobs` `submitted` to the
   downstream `Mint on payment` dry-run SUCCESS workflow run. A `204` alone
   is NOT delivery. Do not create fake paid orders in production to test.
6. Reconciliation, IPN receipt, the first real mint, S2 chain verifier, buyer
   delivery, and refund remain their own human-reviewed gates.

## Rollback / emergency stop

Set `MINT_OIDC_PULL_ENABLED=0`. The API route returns 503 and the scheduled
workflow becomes a no-op after reading health. Existing durable jobs remain as
audit evidence; **never** delete their claims to blindly retry.

## Limitations

* A lost ack or GitHub timeout requires manual reconciliation; it must not
  automatically resend.
* The route reads pending orders from the current order ledger; large-scale
  operation should move to a paged SQL query and add an ops audit dashboard.
* Existing legacy mint dispatch and non-atomic contract price changes are
  unchanged; **production live mint is still NO-GO**.
* This bridge is not an on-chain NFT verifier and does not grant NFT rights.
* GitBook/public marketing should say "dry-run integration tested" only after
  deployment proof, never "automatic NFT delivery" before S1/S2.
