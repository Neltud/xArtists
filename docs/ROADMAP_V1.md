# xArtists Roadmap V1 — 7 Priorités
**Date :** 29 juillet 2026 | **Repo :** Neltud/xArtists @ v0.14.0+

Ce document formalise les 7 axes prioritaires issus de l’analyse dApp complète.
Chaque axe a un **statut**, des **livrables**, une **phase** et des **critères de done**.

---

## Vue d’ensemble

| # | Priorité | Statut | Phase | Effort |
|---|----------|--------|-------|--------|
| 1 | Full LIA v6 production + agents marketplace on-chain | 🟡 En cours | P0–P1 | Élevé |
| 2 | Marketplace NFT avancé + liquidity pools TRO | 🟡 Partiel | P1 | Élevé |
| 3 | Mobile PWA / responsive perfectionné | 🟢 Livré (base) | P0 | Moyen |
| 4 | Tests E2E complets + monitoring on-chain | 🔴 À faire | P1–P2 | Élevé |
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

### Livrables restants
| Item | Priorité | Done when |
|------|----------|-----------|
| Signature tx live (wallet / pem) dans executor | P0 | Trades mainnet confirmés on-chain |
| Poll confirmation adaptatif ms + circuit breaker | ✅ P0 livré | Broadcast → confirmation prêt pour Supernova (`LIA_CONFIRM_POLL_MS_BASE`, `LIA_CONFIRM_POLL_MS_PRE`, `LIA_CONFIRM_MAX_WAIT_S`, `LIA_SUPERNOVA_MODE`) |
| GreenSmokeConsumer branché sur les brains | P1 | Bias regime dans décisions BUY/WAIT |
| ContrarianBrain implémenté | P1 | 4 % budget, RSI < 30 + fear |
| Trailing stops + Kelly sizing | P1 | Positions dynamiques |
| **Agents Marketplace on-chain** | 🟡 P0 presque livré | Contrat list/buy agent actions + ABI dans `@xartists/core` + adresse mainnet injectée après deploy |
| PerformanceTracker → `data/lia_performance.json` | P1 | Winrate / drawdown sur Dashboard |

### Agents Marketplace (implémentation P0)
- Contrat Rust : `listAgentAction`, `buyAgentAction`, `cancelListing`, `getListing`
- Frontend : page `/agents` branchée avec hook `useAgentsMarketplace` + Warps copy/deep-link placeholder
- ABI alignée dans `packages/core/src/contracts/index.ts` et `packages/core/src/contracts/agentsMarketplaceAbi.ts`
- Templates Warps : `data/warps/buy-agent-action.json`, `data/warps/list-agent-action.json`, `data/warps/get-listing.json`

---

## 2. Marketplace NFT avancé + liquidity pools TRO

### État actuel
- UI galerie + filtres + refresh API MultiversX
- Contrats marketplace / escrow déployés (adresses dans config)
- Page `/lp` existante ; pool OneDex TRO/EGLD dans `data/config.json`
- **Manque :** `listNft` / `buyNft` depuis le wallet, ordre book, LP add/remove

### Livrables
| Item | Priorité |
|------|----------|
| Boutons List / Buy via sdk-dapp (MARKETPLACE_ABI) | P0 |
| Affichage prix listing on-chain | P0 |
| LPPoolsPage : add/remove liquidity TRO/EGLD (OneDex) | P1 |
| Escrow RWA flow (photo → AI → metadata) | P1 |
| Filtres prix / royalties / type | P2 |

---

## 3. Mobile PWA / responsive perfectionné ✅ (base)

### Livré dans ce commit
- `apps/frontend/public/manifest.webmanifest`
- `apps/frontend/public/service-worker.js` (cache shell offline)
- Meta PWA dans `index.html` (theme-color, apple-mobile-web-app)
- BottomNav + safe-area déjà en place

### Suite
- Icons 192/512 générés
- Install prompt custom
- Audit Lighthouse mobile ≥ 90

---

## 4. Tests E2E complets + monitoring on-chain

### État actuel
- Vitest au root (`npm test`)
- Pas de Playwright/Cypress ; monitoring = GitHubReporter + JSON status

### Livrables
| Item | Priorité |
|------|----------|
| Playwright : wallet mock, marketplace, DAO vote | P1 |
| CI job `e2e.yml` | P1 |
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

### Livré dans ce commit
- `docs/openapi.yaml` — contrats + endpoints dApp + MultiversX API used
- `Dockerfile` multi-stage (Node build → nginx)
- `docker-compose.yml` (frontend + optionnel proxy)

### Suite
- Swagger UI sur `/docs/api`
- CI build image GHCR

---

## 7. Alignement Supernova (sub-second finality)

### Contexte (29 juil 2026)
- Battle of Nodes depuis mars 2026 (>1B tx, ~120k TPS stress)
- Target mainnet Q2/Q3 2026
- Barnard live (gouvernance, timestamps ms)

### Actions préparatoires
| Item | Priorité |
|------|----------|
| Gas limits recalibrés pour rounds sub-second | P1 (après activation) |
| UI : indicateurs finality / shard | P2 |
| Executor : poll confirmation adaptatif (ms) | ✅ Base prête + mode `auto|on|off` documenté |
| Docs : runbook upgrade validators / SC | P2 |

---

## Ordre d’exécution recommandé

1. **P0 immédiat** : signature live executor LIA · fix workflow Deploy xArtists Exclusive · list/buy marketplace UI · agents marketplace ABI
2. **P1 court terme** : GreenSmoke + trailing · E2E Playwright · LP TRO · bridge tests
3. **P2 medium** : Supernova gas/UI · RWA escrow complet · ML brains

---

## Critères de sortie « Production complète »

- [ ] LIA exécute ≥ 1 trade live confirmé / jour sans circuit breaker
- [ ] Marketplace : list + buy end-to-end depuis le dApp
- [ ] PWA installable (Lighthouse PWA ≥ 90)
- [ ] Suite E2E verte en CI
- [ ] Bridge BTC : tests blackbox + quorum ≥ 2 relayers
- [ ] OpenAPI publié + image Docker buildable
- [ ] Checklist Supernova validée post-activation mainnet

---

*Maintenu par Neltud (@tudurioriginal) via Grok — 29 juillet 2026*
