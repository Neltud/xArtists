# xOrus private entitlement policy — candidate (13 Nov 2026)

Related to [issue #548](https://github.com/Neltud/xArtists/issues/548). This **does not activate premium xOrus**, provide customer reports or create a checkout.

## Boundary
- `services/access-api/src/xorusEntitlements.mjs` is a **pure server-side policy**. There is no public handler, no endpoint, no frontend import, and no entitlement issuance.
- The only products are **derived xArtists analyses**, with fixed scopes: Pulse (markets), Yield (DeFi), Sentinel (risk). No sale of raw OHLCV, provider payloads or third-party content is implied.
- Access is denied by default: `enabled=false` and `commercialUsageRightsVerified=false`. A valid principal must be sourced from a verified email session or SIWX, not a claimed account/wallet.
- An authoritative entitlement record must match subject, offer, scope, expiry, revocation, refund state and **fresh** ledger/ownership evidence. A paid invoice alone is never enough; current billing state and reconciliation must be checked.
- A **durable, atomic** quota reservation is mandatory before allowing a read; no in-memory quota counter is accepted as production authority. Errors, stale evidence, account mismatch and repeated reservations all deny.
- A success response includes only offer, scope, report ID digest, quota remainder and expiry. It carries no reports, raw provider data, secrets, billing event or wallet identifiers.

## Not yet implemented / release gates
1. Authenticated email OTP session with opaque account id; SIWX wallet linking with challenge/replay prevention.
2. Production DB grant ledger with verified Stripe webhook, refund and cancellation reconciliation; independently proofed NFT ownership.
3. Atomic PostgreSQL quota reservation with replay resistance and bounded per-identity rate limits.
4. Commercial data-source licences validated, dated, reviewed and renewed; own derived output only.
5. Private report storage + immutable digest, real report entitlement and revocation tests; no premium reports in Vite assets.
6. Agent tool adapters `xorus_get_analysis`, `xorus_check_access`, `xorus_explain_analysis` bound to delegated identity.
7. End-to-end sandbox proof from email registration to test payment and revocation, then human review.

The public `/v1/xorus/analysis` remains paper-only, `commercial_enabled=false`, `access_granted=false`. No production config, DB migration, payment, mint, market order or NFT transaction is performed here.
