# Release v3.3.0 — xArtists

**Date :** 2026-08-29  
**Branche :** `main`  
**Tag cible :** `v3.3.0`  
**Demo :** https://neltud.github.io/xArtists/

---

## 1. Vision de cette release

Passer d’une démo dispersée à un **produit clair** :

| Offre | Route | Nature |
|-------|-------|--------|
| Packs Agents NFT | `/#/agents` | Pulse · Yield · Sentinel |
| Art Tours | `/#/tours` | Service culturel + carte mondiale |
| Trading / LIA | `/#/trading` | Paper + moniteur TX |
| Wallet | `/#/wallet` | Connexion Web MultiversX |

**Règle produit :** un travel agent n’est **pas** un pack IA. Art Tours ≠ Agents.

**Règle nom :** Vellum = `app.vellum.ai` (orchestration IA). Les swaps s’exécutent sur MultiversX.

---

## 2. Livrables techniques

### 2.1 Core agentique (v3)

```
UI → useLIA → DoctrineEngine → MultiversXService → TransactionMonitor
```

- `src/core/doctrine.ts` — Guardian
- `src/services/multiversXService.ts` — balances + execute gated
- `src/services/transactionMonitor.ts` — statut on-chain
- `src/services/multiversXExecutionAdapter.ts` — broadcast injecté (no fake)
- `src/types/intent.ts` — schéma strict
- `src/hooks/useLIA.ts` — orchestrateur

### 2.2 Front produit

- `ArtWorldMap` + `ArtToursPage`
- `TxMonitorPanel`
- Agents page nettoyée (pas de travel pack)
- Wallet Web live callback

### 2.3 Data

- `data/art_tour_locations.json`
- `data/art_tours.json`

---

## 3. Liens demo (HashRouter)

| Page | URL |
|------|-----|
| Home | https://neltud.github.io/xArtists/#/ |
| Art Tours | https://neltud.github.io/xArtists/#/tours |
| Agents | https://neltud.github.io/xArtists/#/agents |
| Trading | https://neltud.github.io/xArtists/#/trading |
| Wallet | https://neltud.github.io/xArtists/#/wallet |

Hard refresh après deploy : **Ctrl+Shift+R**

---

## 4. Hors scope / NO-GO

- [ ] Mint SC agents marketplace déployé mainnet
- [ ] Live trading volume (`LIA_LIVE_TRADING=1` + confirm)
- [ ] IPFS media packs (si encore PENDING)
- [ ] Route swap DEX signée end-to-end testnet

**Verdict release :** GO pour démo publique organisée · NO-GO pour fonds utilisateurs en volume.

---

## 5. Créer le tag GitHub Release (UI ou API)

Si le tag n’est pas encore publié côté Releases :

1. https://github.com/Neltud/xArtists/releases/new
2. Tag : `v3.3.0` (créer sur `main`)
3. Title : `v3.3.0 — Demo organized · Art Tours map · TX monitor · Agents packs-only`
4. Body : coller ce fichier ou le résumé §1–4
5. Set as **latest release**

---

## 6. Pour Vellum (ops)

- Tirer `main` / tag `v3.3.0`
- Workflows LIA restent secrets côté Vellum
- Corps public = repo (doctrine, monitor, intent, front)
- Ne pas confondre Vellum avec MultiversX execution layer
