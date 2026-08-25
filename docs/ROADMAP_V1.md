# Roadmap V1 — xArtists

**Date :** 25 août 2026 | **Repo :** Neltud/xArtists @ v0.15.0+

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
* LIA v6 : 62 nœuds Vellum, statut PRODUCTION_MAINNET
* UniversalExecutor : plus un stub — swaps / stake / unstake / claim + circuit breaker
* Agents Marketplace : ABI + hooks List/Buy + UI + deploy script livrés
* Paper cycle OK (`LIA_LIVE_TRADING=0`)

### Livrables restants
* Signature live executor (PEM / wallet) — micro-size only after paper stability
* Deploy mainnet agents-marketplace + codeHash verify
* Micro-proofs user end-to-end

### Critères de done
* Trades mainnet confirmés on-chain (micro)
* codeHash agents ≠ null + UI fail-open uniquement si verified

---

## 2. Marketplace NFT avancé + liquidity pools TRO

### État actuel
* List / Buy / Offer / Bid UI + multi-currency notices + burn TRO notices
* Escrow logic Python + Stripe onramp
* SC nft-marketplace prêt (P0+P1 hardened), codeHash null (empty account)

### Livrables restants
* Deploy mainnet + codeHash
* Burn $TRO on-chain à chaque vente
* LP TRO-WEGLD live TVL + native multi-currency buy

### Critères de done
* List/Buy E2E user wallet + codeHash verified
* Burn on-chain + fee split treasury

---

## 3. Mobile PWA / responsive perfectionné

### État actuel
* 🟢 Base livrée : PWA install banner, BottomNav safe-area, offline shell

### Livrables restants
* Polish iOS install path + Lighthouse 90+

### Critères de done
* Installable Android + iOS ; score Lighthouse ≥ 90

---

## 4. Tests E2E complets + monitoring on-chain

### État actuel
* Smoke Playwright (dashboard + marketplace) en CI

### Livrables restants
* Wallet mock, marketplace full, DAO, LIA board
* Monitoring codeHash + listings index auto

### Critères de done
* Suite E2E green sur PR ; alertes codeHash

---

## 5. Bridge BTC stabilisé + cross-chain RWA

### État actuel
* Squelette `contracts/btc-bridge` + rwa-escrow-bridge
* **EXPERIMENTAL — DO NOT deploy / no user funds**

### Livrables restants
* Blackbox tests + relayers + attestor LIA

### Critères de done
* Tests pass + policy no-user-funds until audit

---

## 6. Documentation API / OpenAPI + Docker

### État actuel
* 🟢 Base livrée : openapi.yaml + Docker + CI build image GHCR

---

## 7. Alignement Supernova (sub-second finality)

### Contexte (25 août 2026)
* **Mainnet v1.11.10.0** activé le 6 août (epoch 2198) — VM. Réseau **stable J+19**.
* **Mainnet v1.11.11.0** (10 août) — miniblock checks. **J+15**.
* **Supernova Devnet** : **LIVE** depuis le **20 août** (600 ms rounds, J+5).
* **Target mainnet** : Upgrade nodes **1er septembre** · Activation **10 septembre 2026** (countdown **~16 jours**).
* Note protocole (24 août) : timeouts / deadlines calibrés sur 6 s seront off by **10×** — adresses, ABIs, SDK inchangés.
* Stats (24 août) : 9.25 M accounts · 623 M tx · xExchange $3.68 M TVL · pic 238 K tx/jour.
* Builders : http://supernova-sprint.xyz/builders · arcade https://supernova-arcade.xyz/arcade

### Livrables
* Observer gas / latence / UX sur Devnet
* Aligner polling nonce, TX timeouts frontend + LIA pour 600 ms **avant** le 10 sept.
* Alignement UI + gas estimates post-mainnet Supernova

### Critères de done
* dApp responsive <1 s finality intra-shard après activation mainnet
* Aucun timeout hardcodé 6 s restant dans le path critique

---

## Ordre d’exécution recommandé

1. **P0 immédiat** : wallets Mission/Reserve/Reward/Ops · deploy mainnet agents/nft marketplace · list/buy E2E · codeHash
2. **P1 court terme** : GreenSmoke + trailing · E2E Playwright étendu · LP TRO · deploy tro-burn · bridge tests · timeouts ×10
3. **P2** : Supernova mainnet alignment (10 sept.) · RWA escrow live · audit externe

---

*Synchronisé avec STATUS_2026-08-25.md — 25 août 2026*
