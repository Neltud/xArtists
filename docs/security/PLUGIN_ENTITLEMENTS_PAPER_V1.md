# xArtists plugin entitlements — paper-only gate v1 (2026-11-06)

Status: **code-review candidate; OFF**. This is not a live paid download, wallet login, payment endpoint, mint, revenue payout or commercial GO.

## Threat boundary

The current public XA World Rights PR #415 bundles an MIT-licensed ZIP. It cannot be described as a paid-only proprietary plugin. Issue #416 requires independent authorship/licence review, a chosen legal distribution model, and product terms. This server-side module alone **does not** override MIT permissions or prevent redistribution.

The `checkPluginEntitlement` function in `services/access-api/src/pluginEntitlements.mjs` is a pure access-decision primitive. It defaults to `enabled=false`. To even evaluate a paid grant, the future trusted service must supply:
1. a **server-authenticated subject** from a verified account session / wallet challenge, never a browser-supplied wallet address;
2. a server-issued HMAC-SHA256 grant scoped to product, subject, environment, event, and expiry, with the signing key held only server-side;
3. a current, durable PostgreSQL row whose issuer event has been independently verified against a signed provider webhook plus settlement; and
4. a DB lookup per request for revocation, expiry, refund and settlement status.

If any of these checks fail, access is refused. A provider callback, a payment success URL, a downloaded ZIP, localStorage, or a signed grant without a current database record is not a settlement proof. A grant does not confer authorship, third-party copyright or NFT delivery.

## Owner exception

The requested free account/wallet-owner exception **is not implemented**. It is intentionally denied even if the request supplies the owner's address as text. Next phase requires a wallet challenge with nonce, expiry, domain, chain ID, cryptographic signature verification, server session binding, revocation and anti-replay; after owner identity and scope verification, grant the precise product entitlement server-side. Never enable a bypass with a public address, frontend flag or GitHub username.

## Integration and rollout sequence

- This PR adds only the verification library, nine offline unit tests, candidate SQL and CI. No network calls or accounts are contacted.
- Verify the provider webhook signature, order identity, environment, exact product, amount and terminal settlement. Insert the unique `(environment,provider,issuer_event)` record transactionally. Do not trust a boolean supplied by the buyer.
- Apply/migrate the proposed table only after an isolated ephemeral-PostgreSQL test, review of access control and an explicit operator decision. There is no production DB migration in this PR.
- Store signing keys in secrets management with rotation IDs. Never log tokens, keys or provider payloads.
- Integrate an authenticated read-only `/plugins/me` capability endpoint only after tests for session fixation, CSRF, browser-origin allowlist, refunds and replay. Do not serve paid artifacts from a public static route.
- After documented licensing and wallet verification, connect the actual paid plugin download and keep revenue rules distinct from NFT ownership/creator royalties.

## Local test

```bash
node --test services/access-api/tests/plugin-entitlements.test.mjs
```

The test uses a synthetic grant, synthetic DB record and a fake fixture signing secret. Passing tests **does not establish production entitlement, signing authority or billing**.

Refs: #416, #415, #375, #281, #370.
