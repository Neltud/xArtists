# Sprint 1 — Micro-preuve buy → mint (runbook)

**Statut** : RUNBOOK ONLY — aucune exécution automatique dans ce document.  
**Prérequis** : Sprint 0 admin VERT + Environment `production` opérationnel.  
**Pack cible** : plus petit pack commercial (Sentinel 50 € Rule 1) **ou** micro-prix temporaire strictement contrôlé puis restore.

## Objectif de la preuve

Chaîne complète documentée :

1. Quote Rule 1 (EUR → EGLD ceil4)  
2. Paiement (sandbox PayBox **ou** 1 paiement réel contrôlé)  
3. NFT pack reçu (wallet acheteur ou custody admin documentée)  
4. Supply débitée on-chain  
5. Fonds dans le bucket attendu  
6. Remboursement / annulation testé et journalisé  

## Variante A — On-chain only (EGLD buyPack)

Utilise les workflows **après** approval Environment `production` :

1. `mint-test-buypack.yml` avec `confirm_mainnet=MINT_TEST_MAINNET`  
   - prix temporaire bas → buyPack Pulse → restore 1 EGLD  
2. Ou `mint-3-packs-to-admin.yml` (micro + transfer admin + restore)  

**Journal à remplir** :

| Champ | Valeur |
|-------|--------|
| Date UTC | |
| Workflow run URL | |
| buyPack tx hash | |
| NFT identifier | |
| Prix test atomic | |
| Prix restored | |
| Balance SC avant/après | |
| Operator | |

## Variante B — PayBox fiat (commercial path)

1. `access-api` en mode contrôlé (JWT, IPN RSA, fail-closed)  
2. 1 ordre Sentinel 50 €  
3. IPN signé → order paid  
4. Preuve mint / entitlement My Packs  
5. Refund path testé  

**No-Go** tant que Variante B n’est pas journalisée + My Packs NFT visible.

## Interdits

- Ne pas laisser un prix micro en production après le test  
- Ne pas activer `VITE_LIA_LIVE_TRADING=1`  
- Ne pas committer de PEM  
- Ne pas financer slot (`isPayable=false`)  

## Critère de sortie micro-preuve

- [ ] Au moins une Variante A **ou** B complète avec hashes  
- [ ] Screenshots explorer + journal  
- [ ] Prix officiels restaurés  
- [ ] LIA toujours paper  
