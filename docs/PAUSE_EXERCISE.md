# Sprint 1.4 — Exercice pause d’urgence

**Statut** : RUNBOOK — exécution manuelle contrôlée uniquement  
**Prérequis** : Environment `production` + approval ; Sprint 0 admin  
**SC cible prioritaire** : `agents_marketplace` (`set_paused` / `is_paused`)

## Objectif

Démontrer qu’en incident on peut **geler** les endpoints payants puis **relancer** sans redeploy.

## Procédure (agents marketplace)

1. Lire état : query `isPaused` (ou `is_paused`) on-chain  
2. `set_paused(true)` via owner (aujourd’hui EOA deployer — demain multisig)  
3. Tenter `buyPack` → doit échouer `paused`  
4. Journal : tx hash pause, timestamp, opérateur  
5. `set_paused(false)`  
6. Vérifier `is_paused == false`  
7. Journal unpause  

## Journal type

| Champ | Valeur |
|-------|--------|
| Date UTC | |
| SC address | |
| pause tx | |
| unpause tx | |
| buyPack attempt result | |
| Operator | |
| Notes | |

## Interdits

- Ne pas laisser `paused=true` en production sans communication  
- Ne pas tester pendant une fenêtre de vente publique ouverte  
- LIA reste paper (`VITE_LIA_LIVE_TRADING=0`)  

## Critère de sortie 1.4

- [ ] Pause + unpause journalisés avec hashes  
- [ ] Preuve d’échec d’achat pendant pause  
