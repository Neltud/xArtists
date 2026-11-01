# Sprint 1 — Preuves on-chain & verrouillage technique

**Statut** : EN COURS (docs + CI codeHash)  
**Dépendance** : Sprint 0 code mergé (PR #222) · admin residual pour VERT total  
**Branche de travail récente** : `sprint-1/ci-codehash-owner`

## Objectifs

1. Build reproductible + hash épinglé  
2. Vérification codeHash on-chain vs hash épinglé  
3. Owner SC → multisig + timelock  
4. Micro-preuve d’achat pack complet documentée  
5. Pause d’urgence testée  
6. Politique de prix explicite + CID IPFS définitifs  

## Checklist

### 1.1 Build & hash
- [x] `data/contracts.json` codeHash pins  
- [x] `scripts/verify_pinned_codehashes.py` (11/11 match live 2026-11-01)  
- [x] CI Regression : step « Verify pinned codeHashes »  
- [ ] Artefact wasm déterministe local documenté (optionnel post-build)  

### 1.2 Owner & upgrade control
- [x] Owner actuel identifié (EOA deployer) — voir `OWNER_MULTISIG_PLAN.md`  
- [ ] Multisig + timelock exécuté ou plan daté accepté  
- [ ] `data/contracts.json` section owners  

### 1.3 Micro-preuve d’achat
- [x] Runbook `MICRO_PROOF_BUY_PACK.md`  
- [ ] Exécution Variante A ou B journalisée  

### 1.4 Pause d’urgence
- [x] Endpoints `set_paused` / `is_paused` présents (agents, escrow, …)  
- [x] Runbook `PAUSE_EXERCISE.md`  
- [ ] Exercice journalisé (hashes)  

### 1.5 Prix & IPFS
- [x] Rule 1 110/75/50 documenté  
- [ ] CID IPFS définitifs (plus de temporaires)  

## Critère de sortie

- Rapport d’achat réel de bout en bout (screenshot + tx hashes + balances)  
- Pause testée  
- codeHash épinglé en CI ✅  
- Owner plan multisig/timelock documenté ou exécuté  

## Doctrine

Paper LIA maintenu. Aucun switch live. No commercial GO.
