# xArtists Roadmap V1 — 7 Priorités
**Date :** 6 août 2026 | **Repo :** Neltud/xArtists @ v0.15.0+

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
- LIA v6 : 62 nœuds Vellum, statut `PRODUCTION_MAINNET`
- `UniversalExecutor` : plus un stub — swaps / stake / unstake / claim + circuit breaker
- `MxContractCustomNode` : queries NFT staking, TRO, marketplace, minter + cache TTL
- Audit détaillé : `LIA_V6_OPTIMIZATION_AUDIT.md`
- Agents Marketplace : SC + ABI + hooks List/Buy + UI livrés (v0.15.0)

### Livrables restants
| Item | Priorité | Done when |
|------|----------|-----------|
| Signature tx live (wallet / pem) dans executor | P0 | Trades mainnet confirmés on-chain |
| GreenSmokeConsumer branché sur les brains | P1 | Bias regime dans décisions BUY/WAIT |
| ContrarianBrain implémenté | P1 | 4 % budget, RSI < 30 + fear |
| Trailing stops + Kelly sizing | P1 | Positions dynamiques |
| Deploy mainnet agents-marketplace | P0 | Adresses dans contracts.json |
| PerformanceTracker → `data/lia_performance.json` | P1 | Winrate / drawdown sur Dashboard |

---

## 2. Marketplace NFT avancé + liquidity pools TRO

### État actuel
- UI galerie + filtres + refresh API MultiversX
- Contrats marketplace / escrow + List/Buy UI + multi-currency notices + burn TRO notices
- Page `/lp` existante ; pool OneDex TRO/EGLD dans `data/config.json`
- Escrow logic ajoutée (4 août)

### Livrables
| Item | Priorité |
|------|----------|
| Boutons List / Buy via sdk-dapp (MARKETPLACE_ABI) end-to-end | P0 |
| Affichage prix listing on-chain | P0 |
| LPPoolsPage : add/remove liquidity TRO/EGLD (OneDex) | P1 |
| Escrow RWA flow complet (photo → AI → metadata) | P1 |
| Filtres prix / royalties / type | P2 |

---

## 3. Mobile PWA / responsive perfectionné ✅ (base)

### Livré
- `apps/frontend/public/manifest.webmanifest`
- `apps/frontend/public/service-worker.js` (cache shell offline)
- Meta PWA dans `index.html` (theme-color, apple-mobile-web-app)
- BottomNav + safe-area + install banner

### Suite
- Icons 192/512 générés
- Audit Lighthouse mobile ≥ 90

---

## 4. Tests E2E complets + monitoring on-chain

### État actuel
- Playwright smoke (dashboard + marketplace) en CI (`e2e.yml`)
- Vitest au root
- Monitoring = GitHubReporter + JSON status

### Livrables
| Item | Priorité |
|------|----------|
| Playwright : wallet mock, marketplace full, DAO vote | P1 |
| Monitoring : health endpoint + alert Telegram si LIA halt | P1 |
| Dashboard on-chain : last 20 txs LIA wallet | P2 |

---

## 5. Bridge BTC stabilisé + cross-chain RWA

### État actuel
- Contrat `contracts/btc-bridge` : fees, config, quorum signatures, pause, admin
- Endpoint `bridgeBtcToSbtc` (expérimental)
- Tip BTC address configurée

### Livrables
| Item | Priorité |
|------|----------|
| Tests blackbox bridge (nonce, quorum, pause) | P1 |
| Relayers config mainnet + monitoring | P1 |
| UI Tip / Bridge page unifiée | P2 |
| Lien RWA escrow ↔ sBTC collateral (design) | P2 |

---

## 6. Documentation API / OpenAPI + Docker ✅ (base)

### Livré
- `docs/openapi.yaml` — contrats + endpoints dApp + MultiversX API used
- `Dockerfile` multi-stage (Node build → nginx)
- `docker-compose.yml` (frontend + optionnel proxy)

### Suite
- Swagger UI sur `/docs/api`
- CI build image GHCR

---

## 7. Alignement Supernova (sub-second finality)

### Contexte (6 août 2026)
- **Mainnet v1.11.10.0 activé aujourd’hui** (epoch 2198) — améliorations VM.
- Battle of Nodes depuis mars 2026 (>1B tx, ~120k TPS stress).
- **Target Supernova mainnet : 10 septembre 2026**.
- Supernova Arcade disponible pour tests 600 ms.

### Actions préparatoires
| Item | Priorité |
|------|----------|
| Gas limits recalibrés pour rounds sub-second | P1 (après activation Supernova) |
| UI : indicateurs finality / shard | P2 |
| Executor : poll confirmation adaptatif (ms) | P1 |
| Docs : runbook upgrade validators / SC | P2 |

---

## Ordre d’exécution recommandé

1. **P0 immédiat** : signature live executor LIA · deploy mainnet agents/nft marketplace · list/buy end-to-end
2. **P1 court terme** : GreenSmoke + trailing · E2E Playwright étendu · LP TRO · bridge tests
3. **P2 medium** : Supernova gas/UI (post 10 sept.) · RWA escrow complet · ML brains

---

## Critères de sortie « Production complète »

- [ ] LIA exécute ≥ 1 trade live confirmé / jour sans circuit breaker
- [ ] Marketplace : list + buy end-to-end depuis le dApp
- [ ] PWA installable (Lighthouse PWA ≥ 90)
- [ ] Suite E2E verte en CI
- [ ] Bridge BTC : tests blackbox + quorum ≥ 2 relayers
- [ ] OpenAPI publié + image Docker buildable
- [ ] Checklist Supernova validée post-activation mainnet (10 sept.)

---

*Maintenu par Neltud (@tudurioriginal) via Grok — 6 août 2026*
