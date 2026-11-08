# Auth admin — liaison adresse vs protocole wallet (2026-11-08)

**Branche :** `fix/rwa-escrow-release-gates-20261108`  
**NO-GO production.**

## Ce qui est prouvé offline

| Primitive | Preuve |
|-----------|--------|
| Bech32 local ≡ `Address` SDK (8 clés) | `admin-auth-sdk-address.test.mjs` |
| Checksum + liaison pubkey | `admin-auth-address-binding.test.mjs` |
| Schéma message admin | `admin-auth-message.test.mjs` |
| **MessageComputer + UserVerifier** | `admin-auth-message-computer.test.mjs` |
| Signature UTF-8 brute **refusée** par UserVerifier | même fichier |

Commande CI :

```bash
cd apps/frontend && npm ci --ignore-scripts
node --test tests/admin-auth-message.test.mjs \
  tests/admin-auth-signature-test.test.mjs \
  tests/admin-auth-address-binding.test.mjs \
  tests/admin-auth-sdk-address.test.mjs \
  tests/admin-auth-message-computer.test.mjs
```

## Protocole wallet (fait établi)

1. Construire `new Message({ data: utf8Bytes, address })`.
2. `MessageComputer.computeBytesForSigning` → digeste 32 octets (keccak envelope).
3. Signer ce digeste avec `UserSecretKey` / wallet.
4. Vérifier avec `UserVerifier.fromAddress(admin)` sur `computeBytesForVerifying`.

`node:crypto.sign(null, utf8, key)` **n'est pas** interopérable avec les wallets MultiversX.
Les helpers `adminAuthSignatureTest` / binding qui vérifient l'UTF-8 brut restent des **tests de forme** uniquement.

## Toujours manquant avant privilège admin

1. Challenge serveur (nonce émis, TTL, domaine lié)
2. Anti-replay **durable** (consommation atomique)
3. Session authentifiée ≠ adresse collée
4. Owner **multisig** on-chain
5. Tests VM escrow

Aucun endpoint admin live. Aucune clé ops. Aucun broadcast.


## Backend SDK signature verifier — offline primitive added (2026-11-08)

`services/access-api/src/adminAuthWalletVerifier.mjs` now accepts **only**
a trusted, already-issued PostgreSQL challenge row and an exact 64-byte
hex signature. It recomputes the canonical message bytes using the same
`buildMessage` serializer used at issue time, checks domain/chain ID,
action, nonce, TTL and spent state, verifies a configured admin allowlist and
the exact Bech32/SDK address, then checks the **MultiversX
MessageComputer/UserVerifier** signature.

- A raw UTF-8 Ed25519 signature fails, as it should for xPortal.
- Wrong wallet, altered action/nonce, expired or consumed row, missing
  allowlist and malformed signature all fail closed.
- A valid signature returns `authorizesActions:false` and issues **no**
  JWT, session, cookie, escrow command, wallet transaction, or payout.
- The module is NOT exposed as a public admin route. It must eventually be
  connected to an authenticated session and atomic PostgreSQL nonce consume
  in one reviewed server-side operation.
- Reference offline CI: `Admin auth access-api paper tests`,
  workflow `42498134283`: **13 tests total, 12 passed, 0 failed, 1 skipped**
  (the skipped test is not proof of PostgreSQL integration).

**Still NO-GO for privileges:** wallet-session binding, transaction/action
authorization, durable single-use consumption coupling, multisig owner policy,
live database migration, contract deployment and legal attestor approvals
remain separate unverified conditions.


## Transactional wallet proof redemption — tested with real disposable PostgreSQL

**New internal-only module:** `services/access-api/src/adminAuthProofRedemption.mjs`.
It obtains one trusted pool client, begins a transaction, loads the exact database
challenge with `SELECT ... FOR UPDATE`, calls
`verifySdkAdminWalletProof` against that **database row**, and atomically sets
`consumed_at_ms` before `COMMIT`. Invalid signature, replay, expired challenge,
missing allowlist, wrong action/admin and SQL failures return `ok:false` and
`authorizesActions:false`. Failed operations roll back; verified receipts never
trigger HTTP, JWT, payment, escrow release, signing or SC transactions.

**Verified GitHub Actions:** job `42499449148`, disposable `postgres:16-alpine`
with isolated schema and ephemeral credentials only. **30/30 tests passed,
0 skipped.** Includes a *real PostgreSQL* 12-request concurrent race:
exactly one winner, 11 denied. Wrong-wallet signatures do not consume
the row, and timeout/expiry checks reject it. Unit mock separately checks
rollback on update/commit failure.

**Server-session gate hardened:** `adminAuthSessionBinding.mjs` now refuses to
bind from a bare `erd1...` address plus selected wallet method; a
trusted-server `verifyWalletSession` resolver must validate an actual separate
SIWX login session. There is still **no production SIWX resolver** connected,
so the binder remains paper-only. It is not safe to accept a callback or
`verified:true` flag originating from a browser request.

No administrator route, multisig configuration or authority changes were
enabled by this feature. The missing integration is a separately reviewed
SIWX login/session validator, strict cookie/CSRF controls, server-side
admin policy and on-chain multisig approval (plus explicit legal attestor
approval). No use of Neon/Render production database or secret was made.

Tests can be reproduced by the isolated GitHub Actions workflow
`.github/workflows/admin-auth-access-api.yml`; its database URL intentionally
targets the disposable GitHub Actions PostgreSQL service, not a production
host.
