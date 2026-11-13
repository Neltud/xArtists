# Private xOrus PostgreSQL preflight — 13 November 2026

**Candidate only, not deployed to production databases, not a commercial release.** This is the durable storage counterpart to PR #556/#557's purely server-side entitlement policy.

## Three isolated tables
- xa_xorus_private_reports: immutable SHA-256 report reference, fixed offer/scope, derived-only, private-only, licensed approval, generated/source timestamps and expiry. Does not contain report bodies, raw quotes, partner payloads, prompts or secrets. Hash must be independently checked against the real privately stored report by a future audited writer.
- xa_xorus_grants: a walletless subject **MUST** be a real xa_user_accounts UUID (database FK); a wallet actor needs independent SIWX proof. Stores quota and timestamps for current verified evidence, expiration, cancellation, refund and revocation. Signed Stripe webhooks or independently validated MultiversX ownership must be verified outside this repository. Boolean flags are never evidence without that verification.
- xa_xorus_read_reservations: random server-generated UUID request IDs and an atomic PostgreSQL transaction protect grant quota against concurrent reads and replay. No tenant can select another subject, offer, scope or report.

## Controls and limits
- No HTTP handler or frontend bundle imports this repository. It cannot mint, checkout, trade, grant access or deliver a private report.
- Public /v1/xorus/analysis continues to return paper-only analysis with commercial_enabled=false.
- The application caller must separately validate a live session; passing a claimed actor from the browser is forbidden.
- The grant writer and report writer do not exist in this PR. Before using them, introduce a role with minimal table privileges, signed PSP/chain verification and issuer-reference idempotency, provider reconciliation, licence proof, content-digest attestation and transactional cancellation.
- Strict per-read evidence freshness is currently 60 seconds. Never extend it or cache paid rights without a separate security and privacy review.
- Revoke or refund/transfer ownership must be reflected by an authoritative writer immediately; the read path fails closed if evidence is unavailable.
- PostgreSQL schema file is **not** an automated production migration. CI runs it ONLY against an opt-in disposable local Postgres 16 database named xartists_xorus_probe.

## Next release gates
1. Verify Render's actual PostgreSQL target using nonsecret proof. Test backup/restore before planning DB changes.
2. Complete email OTP sessions/verified Neon JWT → account UUID mapping and optional linked wallet with SIWX challenges. Add account deletion/data export policy.
3. Independently verify source-commercial rights, private report storage and SHA-256 digest; no supplier raw data sold.
4. Add authoritative subscription event writer and current NFT ownership reconciler with refund/revocation and replay resistance.
5. Add authenticated private read API with explicit service flag OFF by default and abuse control; only enable in test environment after e2e tests.
6. Prove email signup → test payment → signed webhook → entitlement → private report → cancellation/refund/revocation across accounts and replicas; separate public GO approval.

**Not an entitlement issuer**: a database row is not proof of payment, a signed wallet intent or provider licence.
