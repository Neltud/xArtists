# Roadmap V1 xArtists — 7 priorités

**Date :** 11 août 2026 | **Repo :** Neltud/xArtists @ v0.15.0+

Ce document formalise les 7 axes prioritaires issus de l’analyse dApp complète.  
Chaque axe a un **statut**, des **livrables**, une **phase** et des **critères de done**.

---

## Vue d’ensemble

| # | Priorité | Statut | Phase | Effort |
|---|----------|--------|-------|--------|
| 1 | Full LIA v6 production + agents marketplace on-chain | 🟡 En cours | P0–P1 | Élevé |
| 2 | Marketplace NFT avancé + liquidity pools TRO | 🟡 Partiel | P1 | Élevé |
| 3 | Mobile PWA / responsive perfectionné | 🟢 Livré (base) | P0 | Moyen |
| 4 | Tests E2E complets + monitoring on-chain | 🟡 Smoke livré | P1–P2 | Élevé |
| 5 | Bridge BTC stabilisé + cross-chain RWA | 🟡 Squelette | P2 | Élevé |
| 6 | Documentation API / OpenAPI + Docker | 🟢 Livré (base) | P0 | Moyen |
| 7 | Alignement Supernova (sub-second finality) | 🟡 Préparé | P2 | Moyen |

---

## 1. Full LIA v6 production + agents marketplace on-chain

### État actuel
- LIA v6 : 62 nœuds Vellum, statut PRODUCTION_MAINNET
- UniversalExecutor : plus un stub — swaps / stake / unstake / claim + circuit breaker
- Agents Marketplace : ABI alignée, hooks List/Buy, UI, deploy script livrés (v0.15.0)
- Fee split helper + catalog packs limités
- Paper mode par défaut (`LIA_LIVE_TRADING=0`)

### Livrables restants (P0)
- Signature live executor (PEM / wallet) + confirmation on-chain des trades
- Deploy mainnet agents-marketplace + adresses dans contracts.json + codeHash
- GreenSmoke + trailing stops production

### Critères de done
- Trades LIA visibles on-chain en mainnet
- List/Buy packs end-to-end sans erreur

---

## 2. Marketplace NFT avancé + liquidity pools TRO

### État actuel
- List/Buy UI + multi-currency notices + burn TRO notices
- Escrow logic ajoutée (4 août)
- LP TRO : endpoints + page présente
- SC nft-marketplace : adresse présente, **codeHash null** (not live)

### Livrables restants
- Deploy mainnet + codeHash verify
- Burn $TRO on-chain à chaque vente
- Achat multi-currency natif (EGLD/USDC/TRO)
- TVL live + charts LP

---

## 3. Mobile PWA / responsive perfectionné

### État actuel
- 🟢 Base livrée : manifest + service-worker + install banner + BottomNav safe-area

### Améliorations optionnelles
- Offline caching avancé, push notifications (si besoin)

---

## 4. Tests E2E complets + monitoring on-chain

### État actuel
- Smoke Playwright (dashboard + marketplace) en CI

### Livrables restants
- Suite étendue (wallet mock, DAO, agents marketplace, trading)
- Monitoring on-chain (alertes LIA, circuit breakers)

---

## 5. Bridge BTC stabilisé + cross-chain RWA

### État actuel
- Squelette contracts/btc-bridge + tip BTC

### Livrables
- Tests blackbox + relayers
- Documentation latence + sécurité

---

## 6. Documentation API / OpenAPI + Docker

### État actuel
- 🟢 Base livrée : openapi.yaml + Docker + CI build image GHCR

---

## 7. Alignement Supernova (sub-second finality)

### Contexte (11 août 2026)
- **Mainnet v1.11.10.0 activé le 6 août** (epoch 2198) — améliorations VM. Réseau **stable J+5**.
- **Mainnet v1.11.11.0** sorti **10 août** — extra checks miniblocks (pas d’activation epoch).
- Battle of Nodes depuis mars 2026 (>1B tx, ~120k TPS stress).
- Hardening intensif (rapport 9 août) : intégration tests, guardians, replay historical, transition guards, mini-block pre-fetching proof-driven.
- **Target activation Supernova : 10 septembre 2026**.

### Actions xArtists
- Préparer gas estimates + UI pour latence ~100–250 ms intra-shard
- Valider executor LIA post-Supernova
- Mettre à jour docs dès activation

---

## Ordre d’exécution recommandé

1) **P0 immédiat** : signature live executor LIA · deploy mainnet agents/nft marketplace · list/buy end-to-end · codeHash  
2) **P1 court terme** : GreenSmoke + trailing · E2E Playwright étendu · LP TRO · deploy tro-burn · bridge tests  
3) **P2** : Supernova alignment (post-10 sept.) · scale monitoring

---

*Mise à jour : 11 août 2026 — Neltud via Grok*
