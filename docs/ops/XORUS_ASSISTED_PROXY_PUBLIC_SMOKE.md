# xOrus — assisted OneDex proxy: public deployment smoke (gate OFF)

Date: 2026-11-17. Operational plan, **not** a claim that the API is live.

## Release position

- Restored complete access-api `server.mjs`: main commit `f05fc9c2`, route available in source.
- Proxy and protected frontend: source is present; hardening PR [#619](https://github.com/Neltud/xArtists/pull/619) remains under review.
- Stale Pages tests were revised in PR [#620](https://github.com/Neltud/xArtists/pull/620), but release/deployment evidence is separate.
- Hosted API currently **not verified**. This repository's Neon Free function is **a read-only staging handler**, not the entire Node.js access-api.
- Hosting: no VPS or dedicated server available. Do not attempt the legacy OVH SSH or Docker staging deployment without a confirmed eligible machine/contract.
- Money flows, mint, autonomous xOrus and agent wallets stay **OFF**. x402 OMNIGATE is a future **separate** API-metering initiative, not part of this rollout.

## 1. Operator gates: actual backend runtime

Choose a hosting environment able to serve the complete application `services/access-api/src/server.mjs`, its locked Node dependencies and required trusted storage. Test its actual startup process and HTTPS routing; **GitHub Pages cannot run this backend**. Only existing-cost, free-tier, contract-compliant infrastructure may be considered, with explicit quota and billing review. Do not accept a paid tier by default.

Check:

- [ ] Real API host and TLS are independently verified; **not** a Neon read-only placeholder, static Pages or a Render fallback.
- [ ] The deployed runtime's `/v1/ops/build-info.source_sha` matches the exact commit and `/health.service` is `access-api`; identity only, not certification of DB/mint/swap.
- [ ] Verified `CORS_ORIGIN=https://xartists.art` or exact approved equivalent, no `*` for the tested public surface.
- [ ] `XORUS_ASSISTED_SWAP_ENABLED` unset or `0`, `XORUS_LIVE_TRADING=false` and legacy live-transfer/mint/payment flags OFF.
- [ ] Production authentication, per-user/IP rate limits, verified full MultiversX token identifiers, contract receiver + transaction payload validation, decimal precision and simulation-link validation **before** any future POST enablement.
- [ ] xPortal/Reown exact-origin allowlist and a real-wallet **test with no signing/broadcast**, followed by an independent review of amounts/receiver.
- [ ] No changes to OVH MX Plan, email credentials, NFT storage, live trading, minting, domain A records, or database schema.

## 2. Safe staging/prod smoke

The script sends exactly **five GETs and one intentionally invalid POST**. The POST is sent **only after** the first five GETs prove the correct source SHA, safe paper flags, exact CORS origin and `enabled:false`. Its `sender` is always `invalid-public-address`, never a real wallet. Even if the flag races to ON, policy should reject before OneDex. No legitimate quote/transaction is requested.

From repository root, after a trusted deployment exists:

```bash
# Review the exact deployed SHA from the operator-approved release.
export EXPECTED_API_SHA=<40-hex-commit-sha>
node scripts/ops/probe-xorus-assisted-disabled.mjs \
  --url https://api-staging.xartists.art \
  --sha "$EXPECTED_API_SHA"
```

After staging and explicit production cutover approval, the same probe may use `https://api.xartists.art`; it will still require the POST gate OFF. Expected verdict: `candidate_identity_verified:true`, `assisted_policy_get:'pass'`, `assisted_post_disabled:'pass'`, `commerce_go:false`. Nonzero exit means **NO-GO**. The script prints derived statuses only; no wallet, auth header, DSN or provider response body.

Mock-only CI (safe before any deployment):

```bash
node --test tests/probe-free-api-candidate.test.mjs tests/probe-xorus-assisted-disabled.test.mjs
```

## 3. GitHub Pages gate

- [ ] Merge reviewed PR #619 and #620 only after resolving relevant failing CI jobs; do not reactivate retired LIA live modes to turn tests green.
- [ ] Independently prove `https://api.xartists.art` is serving the genuine API and passed the safe smoke.
- [ ] Set GitHub Actions **public variable** `VITE_ACCESS_API_BASE=https://api.xartists.art` only after the API, DNS/TLS, CSP `connect-src` and rollback plan have passed.
- [ ] Rebuild GitHub Pages through canonical `.github/workflows/static.yml`; confirm its success and exact deployed source SHA. A green **read-only Pages smoke** does not by itself prove a new Pages build.
- [ ] In browser devtools on `/xorus`, check requests go to the configured access-api only and **not** `aggregator.onedex.app`; no signing link with enabled OFF.
- [ ] `GET /v1/xorus/assisted-swap` is policy-only; `POST` disabled answers HTTP 503 `assisted_swap_not_enabled`.

## 4. Stop / rollback

STOP if SHA differs, CORS is wildcard/wrong, runtime is Neon placeholder, quotas/billing are unclear, POST is enabled unexpectedly, a signing link appears while OFF, or  any automation/payout flag changes. Revert frontend API base to empty and redeploy Pages only after review; keep finance flags OFF. Do **not** erase user accounts, perform a DB migration or modify DNS/mail as a side effect of rollback.

x402 is backlog only: future independent 402 challenge + quote/verify/settle protocol for **derived analytics**; OneDex assisted swaps stay a separate path.
