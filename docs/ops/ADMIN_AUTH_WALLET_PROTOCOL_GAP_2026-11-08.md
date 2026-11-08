# Auth admin — liaison adresse vs protocole wallet (2026-11-08)

**Commit de référence :** `081dfb06` sur `fix/rwa-escrow-release-gates-20261108`  
**NO-GO production.**

## Ce qui est prouvé offline (tests éphémères)

| Primitive | Module | Preuve |
|-----------|--------|--------|
| Bech32 `erd1` encode/decode + checksum | `adminAuthAddressBindingTest.mjs` | Round-trip 32 octets ↔ adresse |
| Signature Node Ed25519 sur **UTF-8 brut** du message canonique | même module + `adminAuthSignatureTest.mjs` | Valide / altération / mauvaise clé |
| Schéma message admin (domaine, TTL, nonce) | `adminAuthMessage.mjs` | Parse fail-closed |

Commande :

```bash
node --test apps/frontend/tests/admin-auth-message.test.mjs \
  apps/frontend/tests/admin-auth-signature-test.test.mjs \
  apps/frontend/tests/admin-auth-address-binding.test.mjs
```

## Ce qui n'est PAS prouvé

### 1. Protocole de signature wallet MultiversX

Les wallets MultiversX **ne signent pas** les octets UTF-8 bruts du texte.
Ils signent le digeste produit par `MessageComputer.computeBytesForSigning` / `computeBytesForVerifying` (`@multiversx/sdk-core`), puis la vérification passe par `UserVerifier`.

Conséquence : une signature acceptée par `node:crypto.verify` sur le message admin **n'est pas** équivalente à une signature xPortal / extension / Web Wallet.

Avant tout endpoint admin :

1. Construire un `Message` SDK avec les octets du texte canonique.
2. Vérifier via `MessageComputer` + `UserVerifier.fromAddress(admin)`.
3. Comparer les vecteurs du cookbook officiel « Sign a message + verify a signature ».

### 2. Égalité avec `Address` du SDK

L'encodeur Bech32 local est indépendant. Il doit être confronté à :

```js
import { Address } from '@multiversx/sdk-core'
// new Address(rawPublicKey32).toBech32()
```

sur des clés éphémères (pas de PEM ops).

### 3. Challenge serveur + anti-replay durable

Le store de nonce en mémoire des tests n'est pas une base atomique. Manque :

- émission serveur du challenge (`nonce`, `issuedAt`, `expiresAt`)
- consommation atomique unique (DB / Redis) sous le même `admin` + `action`
- binding session authentifiée ≠ adresse collée

### 4. Multisig on-chain

Owner SC monolithe : voir `RWA_ADMIN_MULTISIG_POLICY_2026-11-08.md`.

## Ordre d'activation (inchangé)

1. Cross-check Bech32 vs `sdk-core` Address  
2. Vérif signature via MessageComputer (clés test)  
3. Challenge HTTP paper + nonce durable  
4. VM escrow points 1–5  
5. Multisig owner  

Aucun de ces points n'autorise mainnet, fusion, ou bouton admin live.
