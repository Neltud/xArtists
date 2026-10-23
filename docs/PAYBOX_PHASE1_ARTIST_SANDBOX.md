# Paybox System phase 1 — paiements artistes (sandbox)

**Branche :** `feat/paybox-artist-sandbox-p0`  
**Date :** 2026-10-23  
**Offre PSP :** **Paybox System** (Verifone) — TPE web e-Transactions, manuel d'intégration **v8.3 (2025-09)**.  
Ce n'est **pas** le produit PayBox agent API (paybox.sh).

## Authentification (protocole officiel)

| Direction | Mécanisme | Preuve |
|-----------|-----------|--------|
| Sortante (session) | **HMAC-SHA512** `PBX_HMAC`, clé secrète marchand (hex → binaire) | `signPayboxHmac` |
| Entrante (IPN) | **RSA SHA1withRSA** param `sign:K`, clé publique Paybox | `verifyPayboxRsaSignature` |
| Retour navigateur | **Aucune preuve** | `server_confirmed` uniquement après IPN RSA + montant |

Clé publique officielle : `services/access-api/src/paybox_pubkey.pem`  
(http://www1.paybox.com/wp-content/uploads/2014/03/pubkey.pem)

## Sécurité commandes

- Prix serveur (Pulse 11000 / Yield 7500 / Sentinel 5000 cents, devise 978)
- Références uniques, écriture atomique + lock fichier
- Idempotence IPN, late IPN, une seule livraison simulée
- Artiste : allowlist serveur uniquement (`PAYBOX_ARTIST_ALLOWLIST`) — absente = aucun bénéficiaire arbitraire
- Consultation commande : liée à `buyer` (403 sinon)
- Mint blockchain : **simulé**

## P0 application

- `VITE_LIA_LIVE_TRADING=0` / `LIA_LIVE_TRADING=0` sur Pages
- `VITE_PAYBOX_ENABLED=false` jusqu'à preprod prouvée
- `claimFees` : endpoint SC `require_owner` + garde applicative `scripts/claim_fees_guard.mjs` (treasury dest null → bloqué)
- Aucun chemin front `claimFees`

## Prérequis externes

1. Compte marchand Paybox System preprod (SITE, RANG, IDENTIFIANT, HMAC hex)
2. URL publique access-api pour `PBX_REPONDRE_A`
3. Allowlist artistes optionnelle
4. Échanges preprod PSP réels — **non effectués** ici (fixtures RSA isolées uniquement)

## Tests

```bash
cd services/access-api && npm ci
node --test tests/paybox_*.test.mjs
node scripts/test_claim_fees_guard.mjs
```

| Couche | Statut |
|--------|--------|
| Fixtures locales (HMAC + RSA test keys) | Automatisé |
| Preprod PSP réelle | **Non exécutée** — prérequis compte |
| Production | **Non activée** |
