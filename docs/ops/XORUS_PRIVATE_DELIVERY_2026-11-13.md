# xOrus private analysis delivery — 13 November 2026

**Candidate implementation, disabled by default.** Private reading is not yet a live subscription service. The public `/v1/xorus/analysis` paper-only endpoint is unchanged, and this module never authorizes trading, buying, NFT mint or signing.

## Route and authorization

`GET /v1/xorus/private/{pulse|yield|sentinel}/{sha256-64-hex}`:
- requires a current Bearer Neon Auth **Ed25519 JWT**, validated through fixed operator-configured JWKS, issuer, audience, expiry and verified email;
- maps to an **existing, active** account UUID in `xa_user_accounts` (no silent signup on read; no client account IDs accepted);
- checks exact product and scope, verified provider evidence, active subscription, non-refunded and non-revoked grant, expiry, 60-second evidence freshness;
- loads only the product's **private, licensed, derived analysis**; requires a fixed JSON contract, content digest matching `report_id`, matching source/generated times, and no extra fields;
- atomically reserves quota in PostgreSQL while rechecking key entitlement state; then returns only the analysis plus report ID, expiry and remaining quota.

No URL query parameters, provider URLs, arbitrary product names, client-selected source/input, prompt, raw market data, refund event IDs or wallet ownership claims are returned. `Cache-Control: no-store` applies. Failed validation returns generic errors, not content or SQL messages.

The content schema `xorus_private_analysis/v1` is **curated qualitative output**: summary, limited findings, risks, scenarios, limitations, and non-executable stance `ABSTAIN`, `WATCH` or `CAUTION`. The whitelist blocks unknown payload fields and URLs, but **does not certify source licensing, legal ownership, factual accuracy or absence of malicious free-text values**; those must be reviewed before the writer accepts a report. No automatic report writer exists in this PR.

## Explicit OFF gates

The read route returns 503 unless **all** of the following server-only prerequisites are present:

- `WALLETLESS_ACCOUNT_SESSION_ENABLED=1` and `WALLETLESS_DATABASE_TARGET_CONFIRMED=1`;
- exact operator-selected `NEON_AUTH_BASE_URL` and correct `DATABASE_URL`;
- `XORUS_PRIVATE_READ_ENABLED=1`, `XORUS_PRIVATE_COMMERCIAL_RIGHTS_VERIFIED=1` and `XORUS_PRIVATE_DELIVERY_CERTIFIED=1`.

None of these flags are modified, stored in the browser or enabled by this PR. A feature flag is not proof of a PSP payment, provider rights or a production migration.

## Storage

`services/access-api/migrations/20261113_xorus_private_contents.sql` adds one private JSONB body table referencing `xa_xorus_private_reports`; its size is bounded. It is **not** executed against Neon/Render by CI or by runtime startup. The database must restrict INSERT/UPDATE/DELETE to an audited writer, and authenticated application roles to minimal SELECT and transaction rights. Prevent updates to report content after issuance and prove digest independently.

## Validation

- Unit tests: invalid JWT-like input, hostile origin, absent entitlement, raw/extra fields, tampered digest, source mismatch, disabled route, no secret leakage, never consume quota for bad content.
- PostgreSQL 16 ephemeral CI: synthetic signed Neon JWT → verified account UUID → private report content with independent SHA-256 → quota exhausted → refund revocation; no real vendor, wallet or data source contacted.
- Production release gates still missing: user-facing verified email OTP/login flow, database target and backup/restore, schema migration authorization, signed Stripe subscription+refund reconciliation, licensed provider sources, durable curated report writer, private-report authenticity, ownership/consumer rights review, abuse/rate limits, account data deletion/export, rollout and incident plan.

**No commercial GO, no premium report exists in production merely because these tests pass.**
