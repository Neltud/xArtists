# Audit release — v2.8.0-demo-live

**Date :** 2026-08-27  
**Commit HEAD (pré-tag) :** `8c9eeda` (HashRouter) + suite main  
**Cible prod :** https://neltud.github.io/xArtists/

---

## 1. Périmètre audité

| Zone | Verdict |
|------|--------|
| Build Vite production | **PASS** (sandbox + workflow deploy) |
| GitHub Pages home | **PASS** HTTP 200 |
| Deep links path-style `/entity` | **FAIL historique** → corrigé par **HashRouter** |
| Chunks lazy (Entity, Sim, Trading…) | **PASS** assets 200 |
| data JSON (entity_map, live_network, board) | **PASS** |
| API MultiversX economics / accounts | **PASS** (lectures) |
| Marketplace on-chain List/Buy | **BLOCK** codeHash null |
| Agents mint SC | **BLOCK** null |
| LIA live trading | **OFF** paper only |
| Sécurité secrets front | **PASS** (pas de PEM/JWT) |
| Risk Manager / Guardian | **PASS** paper path |

---

## 2. Fonctionnel produit

### Live
- Prix EGLD, market cap, APR (API)
- Solde LIA ops (~0.069 EGLD)
- Wallet user connect (lecture / Web Wallet)

### Paper / démo
- Board LIA, compounding, brain EV, fusion, paper legs
- Simulation Lab, Intent ⌘K, Paper Soul, LIA Monitor
- Entity map (12 succursales + roadmap)

### Non live (volontaire)
- SC marketplace / agents / splitter / burn
- Exécution auto LIA on-chain

---

## 3. Correctifs récents inclus

1. Vite build green (TxShell sans sdk-dapp Ledger BLE)
2. `404.html` SPA + **HashRouter** (refresh fiable)
3. ErrorBoundary retry + timeout loader
4. Snapshot réseau publié

---

## 4. URLs post-deploy (hash)

- Home : `https://neltud.github.io/xArtists/`
- Entité : `https://neltud.github.io/xArtists/#/entity`
- Sim : `https://neltud.github.io/xArtists/#/sim`
- Trading : `https://neltud.github.io/xArtists/#/trading`
- Agents : `https://neltud.github.io/xArtists/#/agents`

Hard refresh (Ctrl+Shift+R) si ancien cache JS.

---

## 5. Risques résiduels

| ID | Risque | Mitigation |
|----|--------|------------|
| R1 | SC non déployés | UI gated codeHash |
| R2 | EGLD LIA insuffisant deploy | Financer ≥ 0.25 EGLD |
| R3 | TxShell sans sdk-dapp complet | Web Wallet redirect |
| R4 | Cache Pages après deploy | HashRouter + hard refresh |
| R5 | Paper confondu avec live | DEMO banner + flags |

---

## 6. Tag / release

**Tag recommandé :** `v2.8.0-demo-live`  
**Type :** prerelease (démo prod, pas mainnet commerce)

```bash
git checkout main && git pull
git tag -a v2.8.0-demo-live -m "Demo live: HashRouter, entity map, Vite prod"
git push origin v2.8.0-demo-live
# GitHub → Releases → Draft from tag
```

Ou UI : https://github.com/Neltud/xArtists/releases/new?tag=v2.8.0-demo-live

---

## 7. Verdict

**GO démo production** (UI + données réseau + paper LIA).  
**NO-GO** trading live / marketplace on-chain jusqu’à deploy SC + verify + micro-preuves.
