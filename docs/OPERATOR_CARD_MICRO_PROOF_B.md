# Operator Card — Micro-preuve Variante B (PayBox fiat → entitlement)

**Prérequis** : S1-A VERT · PayBox PROD code path (JWT + IPN RSA fail-closed) · `VITE_LIA_LIVE_TRADING=0`  
**Objectif** : 1 paiement réel Sentinel **50 €** journalisé + My Packs / NFT proof + refund test  
**Doctrine** : commercial GO **interdit** tant que cette carte n’est pas verte

## Pré-checks (code déjà sur main)

- [ ] access-api : mode prod, IPN RSA, fail-closed  
- [ ] `PAYBOX_IPN_URL` HTTPS set (pas de fallback origin)  
- [ ] JWT secret configuré  
- [ ] Pack Sentinel 50 € Rule 1 (ceil4 EUR→EGLD)  

## Procédure

1. Ouvrir le site live : https://neltud.github.io/xArtists/  
2. Route packs : `/agents` ou `/packs/sentinel` (selon alias)  
3. Créer **1** ordre Sentinel 50 € (carte réelle contrôlée)  
4. Compléter paiement PayBox  
5. Vérifier IPN signé → order `paid` côté access-api / logs  
6. Preuve entitlement : **My Packs** ou NFT pack visible  
7. Tester **remboursement** (1 refund) et journaliser  

## Journal

| Champ | Valeur |
|-------|--------|
| Date UTC | |
| Order id | |
| Amount EUR | 50 |
| PayBox ref | |
| IPN status | |
| My Packs / NFT id | |
| Refund ref | |
| Operator | @Neltud |

## Critères de succès B

- [ ] 1 paiement réel 50 €  
- [ ] IPN signature OK  
- [ ] Entitlement / NFT visible  
- [ ] Refund OK  
- [ ] LIA toujours paper  
- [ ] Screenshots + hashes archivés dans `data/sprint1_microproof_journal.md` (section B)  

## Interdits

- Pas de volume commercial  
- Pas d’activation `VITE_LIA_LIVE_TRADING=1`  
- Pas de claim de rendement  
