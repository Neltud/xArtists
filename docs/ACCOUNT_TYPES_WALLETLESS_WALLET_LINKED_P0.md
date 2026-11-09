# xArtists — distinct walletless and wallet-linked accounts (P0 contract)

Status: design contract only; **not implemented or production-approved**.

## Identity and account types

- `walletless`: email/social identity verified by an independent account authentication provider. No wallet address required, no on-chain ownership implied.
- `wallet_linked`: same internal account ID, with at least one wallet address proven by a fresh, one-use SIWX challenge and bound server-side.
- A wallet-only user may sign in through SIWX and receive an internal account ID. Linking must never merge two accounts automatically based solely on an email or wallet address.
- `account_type` is a **derived server-side projection** from verified linked-wallet records; clients must not set it. Removing the last wallet returns the projection to `walletless` while preserving orders.

## Proposed relational schema (migration not yet applied)

```sql
CREATE TABLE user_accounts (
  id uuid PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  disabled_at timestamptz
);
CREATE TABLE account_identities (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES user_accounts(id),
  provider text NOT NULL,
  provider_subject text NOT NULL,
  verified_at timestamptz NOT NULL,
  UNIQUE (provider, provider_subject)
);
CREATE TABLE account_wallets (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES user_accounts(id),
  network text NOT NULL CHECK (network = 'multiversx'),
  address text NOT NULL,
  verified_at timestamptz NOT NULL,
  UNIQUE (network, address)
);
CREATE TABLE account_orders (
  order_id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES user_accounts(id),
  status text NOT NULL,
  delivery_wallet_id uuid REFERENCES account_wallets(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
```

This is a **proposed schema**; production migration must preserve existing PayBox order IDs and include an audited backfill strategy. Do not assume the existing orders table can be replaced.

## Commercial policy (owner decision, 2026-11-09)

Only two commercial routes are permitted:

1. **EGLD purchase** — wallet-linked account with verified wallet ownership; NFT/on-chain delivery is gated on independent proof and finality.
2. **Recurring fiat subscription** — walletless or wallet-linked account; grants subscription-scoped service access, never an NFT or deferred NFT claim.

No one-off fiat NFT purchase, no fiat-to-NFT automatic mint, no pending-wallet NFT claim generated from a fiat subscription. Subscription tiers and billing provider require separate product approval.

## Required invariants

1. Email verification proves control of email, **not** control of a wallet. Never accept an unverified email as an account identity.
2. SIWX proof must bind address, nonce, domain, issued-at and expiration; nonce consumed once, with database-backed replay protection. Wallet linking requires an authenticated session for the target user AND a fresh wallet proof.
3. JWTs must have distinct audiences/scopes: `account` for profile/order access and `wallet` for wallet-sensitive actions. A walletless account JWT cannot satisfy `resolveAuthenticatedBuyer`'s wallet authentication or authorize mint.
4. `GET /me` must return a stable `user_id`, derived `account_type`, and wallet-link state, not secrets. User-facing My Packs shows walletless purchases as `delivery_pending_wallet` and never `delivered` or `active` without independently verified chain proof.
5. **Exclusive commercial modes:** EGLD purchase for verified wallet accounts, or recurring fiat subscription for walletless and wallet-linked accounts. Fiat subscription never purchases, reserves, claims or mints an NFT. Do not add fiat NFT checkout or deferred NFT claim. Existing PayBox wallet checkout remains unchanged and NO-GO pending separate deprecation/migration review.
6. EGLD NFT flow: verified wallet signature, independently verified on-chain EGLD payment, idempotent reservation and chain-finality proof before delivery. Fiat subscription flow: provider-verified subscription state and period, refund/cancellation reconciliation, subscription entitlement only. No cross-conversion from fiat subscription to NFT.
7. An email change, wallet unlink, account merge, lost wallet, refund or chargeback must not silently transfer NFT ownership or activate entitlements.
8. Rate-limit login, signup, recovery, link and claim endpoints; hash passwords using a vetted identity provider or Argon2id; avoid implementing homemade password reset and session storage.
9. Access controls must be checked server-side for every order; no lookup by guessed order ID alone.
10. Rollout must be behind a disabled-by-default feature flag with migrations, tests and rollback.

## Acceptance tests for implementation

- Walletless signup/login -> account exists with no wallet; no mint or wallet entitlement.
- Wallet SIWX login -> distinct account, wallet ownership verified.
- Walletless -> link wallet with fresh challenge -> same `user_id`, type becomes `wallet_linked`.
- Link address already linked to another account -> 409; no silent merge.
- Reused/expired/foreign-domain challenge -> denied.
- Walletless account JWT used on existing wallet-required checkout -> denied.
- Walletless fiat subscription -> subscription access only, never an NFT claim or mint; cancellation/expiry -> subscription access revoked.
- Wallet account EGLD purchase -> NFT delivery only after independently verified payment and chain proof.
- Concurrent claim/replay -> exactly one durable claim reservation.
- Unlink last wallet -> account remains; NFT history does not disappear.
- No EGLD payment/chain evidence -> never NFT `delivered`/`active`.
- Fiat subscription payment -> no NFT, no mint intent, no claim reservation.
- Fiat subscription cancellation, failed renewal or refund -> subscription entitlement reconciled and revoked per policy.

## Implementation sequence

1. Choose managed auth provider and implement authenticated account sessions with verified emails.
2. Apply additive PostgreSQL migration; account and wallet identity mapping; tests.
3. Add SIWX wallet linking with one-use DB nonce and account ownership checks.
4. Add `GET /me`, profile and My Packs order scoping.
5. Add recurring fiat subscription checkout and webhook reconciliation for both account types, independently of NFT ownership. EGLD purchases remain wallet-only.
6. Certify chain proof and atomic entitlement commit; only then consider commercial GO.

**NO-GO:** this document does not enable registration, checkout, NFT delivery or production deployment.
