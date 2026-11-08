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
