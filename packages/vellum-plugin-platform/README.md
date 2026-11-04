# Vellum / xArtists plugin governance — paper contracts

**Status (4 November 2026): PAPER-ONLY; NOT HOSTED, NOT CONNECTED TO THE COMMAND BAR, PAYBOX, NFT MINTING, BRIDGE, LP OR TREASURY.**

This isolated Node 22 module implements the first P1 security and monetization contracts for issue [#375](https://github.com/Neltud/xArtists/issues/375). It is designed to precede integration with [LIA Intent PR #366](https://github.com/Neltud/xArtists/pull/366) and [Genesis Art Engine PR #374](https://github.com/Neltud/xArtists/pull/374). It is not proof that either agent module, a plugin installer or a settlement rail is deployed.

## Security boundary

| API | Authority | Effect | Permanent paper refusal |
| --- | --- | --- | --- |
| canonicalManifest / verifyPluginManifest | Backend-pinned Ed25519 publisher keys and per-plugin allowlist | Verify and digest manifest | Unknown, expired, revoked, unsigned, altered, wildcard resource |
| createPaperPluginRegistry.install | Authenticated tenant admin AND verified server-side human consent AND Guardian | Record process-local paper installation | Forged actor, nonconsensual install, stale or changed publisher grant |
| registry.authorize | Backend-authenticated tenant, actor scopes, exact resource and Guardian | Consume bounded paper-call quota | All finance capabilities, cross-tenant use, ungranted resources |
| registry.revoke | Tenant admin | Disable in memory | Unauthenticated, foreign-tenant or non-admin revoke |
| createPaperRevenueRouter.simulate | orders:prepare:paper granted by registry | Compute **estimated** revenue/cost allocation only | Fake settled amount, fake transaction, non-integer money, conflicting idempotency replay |
| revenue.reconcile | Tenant admin | Summarize paper estimates | Reporting paper receipts as financial income |

**Hard deny list even with a genuinely signed publisher manifest:** payments:execute, nft:mint, bridge:submit and escrow:release. No model, user input, frontend variable or signed manifest can make these capabilities live in this package.

The only allowed paper capabilities are read:catalog, art:generate:paper and orders:prepare:paper. Resources are precise names such as pack:pulse or art:genesis, never wildcards.

## Signed manifest contract

The exact schema is xartists.plugin.manifest.v1, with these ordered fields: schema, pluginId, version (strict major.minor.patch), publisherKeyId, issuedAtMs, expiresAtMs (maximum 31 days), sorted capabilities, sorted exact resources and maxDailyPaperCalls.

Message signed by the trusted publisher is UTF-8 of the fixed domain prefix **xartists.plugin.manifest.v1 + NUL** followed by canonicalManifest(manifest). The publisher returns a hex-encoded Ed25519 signature. The manifest digest is the SHA-256 of these bytes. This canonicalization is *specific to this constrained schema*, not generic RFC 8785/JCS serialization.

Publisher public keys, plugin/key allowlists and key/manifest revocations MUST come from trusted backend operations; they may never be copied from a model response, user-submitted JSON or localStorage. The files in examples/ are **unsigned, expired, intentionally untrusted illustrations**, and are neither installable manifests nor credential proofs.

The host must pass authenticated actorId, tenantId, isAdmin, scopes and resources, together with a trusted out-of-band install-consent checker. Guardian must return exactly {paused:false,mode:'paper'}. Never accept these parameters directly from browser JSON without host verification.

## Paper-only Revenue Router

For each simulation, pass the fixed schema xartists.revenue.paper.v1, an idempotency key, plugin/resource, EUR currency, grossMinor, pspMinor, providerMinor, storageMinor, relayerMinor, refundMinor, rebateMinor and an illustrative creatorShareBps. All amounts are decimal-string **integer euro cents**, computed in BigInt without floating point.

net estimate = gross estimate - provider/PSP/hosting/relayer costs - refunds - rebates. A negative net estimate is a paper loss; neither creator nor platform gets a positive distribution from it. Positive net is apportioned by creatorShareBps with integer rounding down for creator and remainder to platform. The input split is only illustrative; it does not override contracts or determine entitlement.

Outputs ALWAYS include:

- mode: paper
- paymentVerified: false; settlementVerified: false; deliveryVerified: false
- recognizedRevenueMinor: '0'
- actualCreatorPaidMinor: '0'; actualTreasuryReceivedMinor: '0'
- txHash: null; settlementReference: null; transferSubmitted: false

Repeated same-actor, same-tenant, same-key and same-content events return the same paper estimate. Changed content under the same key is rejected. The reconciliation API always reports actual revenue zero and no settled events.

**Limitations:** data and quotas are process-local maps. They are bounded but NOT persistent, atomic across processes or suited to billing. Do not build production payment mandates or revenue sharing on this prototype.

## Threat model

- Rogue or compromised publisher: require pinned keys, plugin-ID allowlist, signature verification on every authorization, independent revocation and expiry.
- Manifest mutation/replay/downgrade: deny changed signatures or active-install replacement; require a separate future signed update and rollback protocol.
- Privilege escalation/tenant crossover/prompt injection: host-only identity and grants, exact scoped resources, no LLM-authorized approvals.
- Phantom revenue and duplicate webhooks: hard-coded zero financial settlement; actual receipts require verified PSP settlement, refunds, delivery and immutable ledger references.
- Quota bypass/overspend: process-local limits are only a demo. Future design needs atomic PostgreSQL quotas, rate limits and verifiable audit logs.
- Outbound finance: **no calls to PayBox, MultiversX, Solana, relayers or swaps**. Never enable operations merely because an incoming SOL transfer was confirmed.

## Validation and next release gates

Run: npm test from this package (Node 22); GitHub Actions checks the same 14 self-contained tests and syntax. The fixtures generate disposable local Ed25519 key pairs. No secrets, network, wallet, customer funds or real plugin installation are used.

To proceed beyond prototype, require separately reviewed persistent and tenant-isolated installation/revocation, durable idempotency and reconciliation, independent human approval, backend SIWX/JWT auth and CSRF/origin checks, and real verified PayBox/NFT delivery evidence (#281, #353, #367, #369). A separate legal/tax review is required before any TRO revenue-share or investment product.

To disable: do not import this package in the production server. It has no public HTTP routes. Do not change paybox_checkout_enabled, mint_live_enabled or LIA_LIVE_TRADING.
