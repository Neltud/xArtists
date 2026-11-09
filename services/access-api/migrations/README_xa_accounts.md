# Account and fiat subscription rollout — implementation gates

Status: DRAFT / NO-GO. This branch adds domain logic and an additive SQL schema only. No identity login, recurring Stripe checkout, account API, or production subscription access is live.

## Data ownership and trust

- `xa_user_accounts.id`: stable internal UUID. A verified OIDC identity maps to it; never derive it from an email string.
- `xa_account_identities`: a provider subject is unique globally; identity linking requires a verified OIDC assertion with exact issuer, audience, signature, expiry, nonce, and verified email when email is used.
- `xa_account_wallets`: unique MultiversX address. Linking requires authenticated account + fresh domain-bound SIWX + PostgreSQL one-time nonce. Never accept `verified_at` from the browser.
- `xa_fiat_subscriptions`: provider subscription IDs, verified status and period; only a verified webhook reconciler may write it. No NFT mint entitlement.
- `xa_subscription_events`: unique event ID. Update event ledger and subscription in one transaction; reject mismatched provider IDs and cross-account ownership.

## Commercial separation

1. Verified-wallet account may initiate an EGLD purchase. Independent chain payment, order, ownership and finality checks still apply; existing mint gates remain unchanged.
2. Either account type may hold a fiat subscription. The subscription unlocks only its explicitly scoped service tier; it cannot buy, reserve, mint or claim an NFT.
3. Do not reuse `stripe_sandbox_orders` or legacy one-off Stripe NFT checkout for subscriptions.
4. Never enable live Stripe keys or a recurring checkout until provider reconciliation, retries, refund, cancellation, billing portal and idempotency tests pass.

## Next independently reviewed PRs

1. OIDC identity verifier and session API with account-only audience; avoid sharing wallet JWT authority.
2. Account repository with transactional identity linking and wallet uniqueness; verify replay-safe SIWX challenge.
3. Stripe test-mode recurring subscription adapter with signature verification, provider subscription fetch, ordered reconciliation, event replay protection, cancellation and refunds.
4. Authenticated `GET /me` and subscription entitlement API; UI signup/login and wallet-link UX.
5. Operational migration rehearsal, backup/rollback, security review and CI before any rollout.

## Manual migration rehearsal

Use a disposable PostgreSQL database with a least-privilege migration role, and apply `services/access-api/migrations/20261109_xa_accounts_v1.sql` only after review. Verify uniqueness, foreign keys, replay conflict behavior, subscription expiration and that legacy payment/mint tables are unchanged. This SQL has not been applied to any database by this PR.

## Vérification automatisée sur PostgreSQL jetable (2026-11-09)

Le workflow `Walletless account schema — disposable PostgreSQL proof`
vérifie les deux migrations `20261109_xa_accounts_v1.sql` et
`20261109_xa_wallet_link_challenges.sql` avec PostgreSQL 16 **local à CI**.
Il vérifie la création d'un compte sans wallet, l'indépendance de l'abonnement
fiat et des NFT, les contraintes d'identité et d'adresse wallet uniques,
l'expiration du défi SIWX et l'anti-rejeu des événements Stripe. Deux exécutions
des migrations sur la base CI montrent leur rejouabilité à blanc.

**Ce test n'installe pas de login réel.** Il n'exécute aucun OIDC, aucune
signature SIWX, aucun webhook Stripe réel, ni aucun DDL sur Neon ou Render.
L'accès commercial doit rester OFF tant que le fournisseur d'identité,
les JWT vérifiés, les migrations du bon DSN, la sécurité des cookies,
le PSP signé et les parcours de renouvellement/remboursement n'ont pas été
évalués et approuvés par l'opérateur.

Commande CI :

```sh
ALLOW_EPHEMERAL_XA_ACCOUNT_PG_TEST=1 \\
TEST_XA_ACCOUNT_DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/xartists_account_probe \\
node --test services/access-api/tests/accountMigrationsPostgres.test.mjs
```
