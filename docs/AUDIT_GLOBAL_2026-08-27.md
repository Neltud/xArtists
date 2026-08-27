# Audit global poussé — xArtists dApp

**Date :** 2026-08-27 ~20:50 CEST  
**Repo :** https://github.com/Neltud/xArtists  
**Prod :** https://neltud.github.io/xArtists/  

## Verdict

| Couche | Verdict |
|--------|--------|
| **UI / SPA demo** | **GO_DEMO** |
| **Data paper + lectures MVX** | **GO** (quasi complet) |
| **Commerce on-chain (List/Buy/Mint packs)** | **NO-GO** |
| **LIA trading live auto** | **NO-GO** (flag off — correct) |
| **Sécurité front (secrets / gates)** | **GO** avec réserves |

---

## 1. Shell & déploiement (mesuré)

| Check | Résultat | Sévérité |
|-------|----------|----------|
| Home HTTP | 200 | OK |
| **index.js vs 404.js** | **DRIFT** au moment de l’audit (`BHdtwICv` vs `CEhbLFWV` ; ancien JS **404**) | **P0** |
| HashRouter | Oui (`#/…`) | OK |
| Data JSON critiques | entity, voyage, liquidity, board, gsn, agents, contracts, risk, live_network, lia_v6 → **200** | OK |
| `oracle_prices.json` | **404** (stub ajouté ce commit) | P2 |

**Cause probable du drift 404 :** double pipeline (commit `docs/` par bot + artifact Pages) ou course entre workflows ; l’ancien `404.html` restait en cache CDN avec un hash d’asset déjà purgé.

**Correctif immédiat :** réaligner `docs/404.html` sur le bundle live `index-BHdtwICv.js` + garde finale dans `deploy-pages.yml` (déjà présente — à ne pas contourner).

---

## 2. On-chain (mesuré API MultiversX)

| Item | État |
|------|------|
| Marketplace SC (`…8354t`) | **codeHash null**, balance 0 — **NOT_DEPLOYED** |
| Agents marketplace | **null** (jamais déployé) |
| LIA ops wallet | ~**0.069 EGLD**, nonce 1437 — insuffisant pour gros deploy si non rechargé |
| NFT staking / governance adresses | Présentes dans `contracts.json` — non re-vérifiées codeHash dans cet audit |

**Fail-closed front :** `canListBuyNft()` / `canBuyAgent()` exigent `VITE_*_CODEHASH_OK` + adresse utilisable ≠ placeholder vide. **Correct.**

---

## 3. Cartographie fonctionnelle

### 3.1 Cerveau LIA / Vellum (paper)
- Board, brain cycle, fusion signaux, paper legs, compounding 10 colonnes, annual yield, risk/guardian
- Liquidity orchestrator **paper only**
- Voyage soft-bias policy documentée
- **LIA_LIVE_TRADING off** — honnête

### 3.2 Produits
| Module | Route | État |
|--------|-------|------|
| Entity map | `/#/entity` | 15 succursales, verdict GO_DEMO |
| Agents packs | `/#/agents` | UI + pricing ; mint SC pending |
| Voyage | `/#/agents/voyage` | Advisory paper |
| Marketplace NFT | `/#/marketplace` | UI ; SC empty |
| Studio / Gallery | `/#/studio` `/#/gallery` | UI ; IPFS proxy ops |
| My Packs / Checkout | `/#/my-packs` | Intent local sans Stripe |
| Trading | `/#/trading` | Paper + live reads |
| Sim Lab | `/#/sim` | Client-side sim |
| Wallet / Tip / DAO / TRO | … | UI + lectures |
| Staking / Hatom / LP | … | UI / liens externes |
| On-ramp | ⌘K + Home | MoonPay redirect + sim |

### 3.3 UX transverse
- Intent ⌘K (voyage, entity, ONRAMP, trading…)
- Personas (artist/collector/investor/curious)
- PageGuides, Demo banner, ScStatusBanner
- Paper Soul, LiaMonitor

---

## 4. Sécurité & conformité produit

| Contrôle | Statut | Note |
|----------|--------|------|
| Pas de PEM / clés privées en front | OK | |
| MoonPay webhook secret | OK | Serveur only (non présent front) |
| Séparation wallet LIA ops ≠ user | OK | Guards `isLiaOpsWallet` |
| Marketplace gated codeHash | OK | |
| Montants BigInt paths (TX) | Partiel | À re-vérifier à chaque path TX post-deploy |
| CSP / headers GH Pages | Limité | Hébergeur Pages — pas de CSP custom fine |
| Dépendances npm audit | Non exécuté ici | P1 CI `npm audit` |
| SC formal audit | Non | Obligatoire avant volume |

**Risques résiduels**
1. **Deep links cassés** tant que 404 ≠ index (P0 — en cours de fix).
2. Confusion utilisateur « paper vs live » si banners ignorés (mitigé par DemoModeBanner + Trading banner).
3. EGLD LIA bas → deploy ops peut échouer mid-flight.
4. Adresse marketplace placeholder encore listée dans JSON (documentée empty) — ne jamais y envoyer de fonds.

---

## 5. Cohérence données / Vellum

| Artefact | Rôle | Santé |
|----------|------|--------|
| `lia_board.json` | Board | 200 |
| `compounding` / trades | Paper | selon production_run |
| `voyage_agent.json` | Travel signals | 200 |
| `liquidity_cycle.json` | Rebalance paper | 200 |
| `contracts.json` | SC registry | 200, honest NOT_DEPLOYED |
| `entity_map.json` | Org chart | 200 |
| `greensmoke_forecasts.json` | GSN | 200 + Array.isArray guards |

---

## 6. Matrice priorités

### P0 (bloquant prod commerce / deep links)
1. **404.html ≡ index.html** à chaque deploy (vérifier CDN après push)
2. Deploy SC marketplace + agents · **codeHash verify exit 0**
3. Fund LIA ops EGLD
4. Micro Tip WC + List/Buy user wallet

### P1
5. Mission + Reserve wallets + treasury splitter
6. `npm audit` / CI + tag `v2.9.2-demo`
7. Stripe `VITE_ACCESS_API_BASE` si checkout fiat réel
8. oracle_prices branché production_run

### P2
9. RWA escrow SC  
10. Soul SBT  
11. Bridge health avant liquidity live  
12. Formal SC audit avant volume  

---

## 7. Conclusion

La dApp est une **démo produit aboutie** (entité, packs, voyage, on-ramp, board paper, sim, guides).  
Elle n’est **pas** une marketplace live ni un robot de trading live — et le code **l’avoue** correctement via gates.

**Prochaine étape unique critique après fix 404 :** pipeline deploy SC + preuves micro, piloté Vellum avec [VELLUM_P0_CHECKLIST.md](VELLUM_P0_CHECKLIST.md).
