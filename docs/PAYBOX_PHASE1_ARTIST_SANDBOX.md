# Paybox phase 1 — paiements artistes (sandbox)

**Branche :** `feat/paybox-artist-sandbox-p0`
**Date :** 2026-10-23

## Offre PSP
Paybox System **e-Transactions** (carte FR, hosted redirect). HMAC-SHA512, IPN serveur.

## Implémenté
- Commandes persistantes (`data/paybox_orders.json` ou `PAYBOX_ORDERS_PATH`)
- Prix **uniquement** catalogue serveur (Pulse 11000 / Yield 7500 / Sentinel 5000 cents)
- Référence unique `xa_{pack}_{buyer}_{ts}{rand}`
- Artiste / bénéficiaire via `PAYBOX_ARTIST_ALLOWLIST` (erd1…, optionnel)
- IPN authentifié + idempotence (doublons) + late IPN
- Livraison / mint **simulés** (`delivery: simulated`)
- Retour navigateur **ne valide jamais** seul (`server_confirmed` seulement après IPN paid)
- `VITE_LIA_LIVE_TRADING=0` forcé dans `static.yml` (était à 1 — P0)

## Secrets serveur uniquement
`PAYBOX_SITE`, `PAYBOX_RANG`, `PAYBOX_HMAC_KEY`, `PAYBOX_ENV=preprod`, `PAYBOX_IPN_URL`, `PAYBOX_ARTIST_ALLOWLIST`

## Front
`VITE_PAYBOX_ENABLED=true` + `VITE_ACCESS_API_BASE` — sinon indisponible. États: unavailable / refused / redirect / attente IPN.

## Prérequis externes restants
1. Compte marchand Paybox preprod (SITE / RANG / HMAC hex)
2. URL publique access-api pour IPN
3. Allowlist artistes si split bénéficiaire requis
4. Mint live (phase ultérieure) — hors scope

## Tests locaux
```bash
cd services/access-api && npm ci && node --test tests/paybox_*.test.mjs
# 8/8 pass
```
