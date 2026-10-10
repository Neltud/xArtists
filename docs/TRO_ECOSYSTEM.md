# $TRO Ecosystem — Liquidity, Holders, Phygital Certification

## 1. Liquidité & Farming

**Fichier :** `apps/frontend/src/services/defi/troLiquidityService.ts`

- Agrège pools **xExchange** + **OneDex** depuis `config/troPools.ts`
- TVL via `mex/pairs` (xExchange) ou balance compte ×2 (OneDex)
- APR best-effort via `mex/farms` (xExchange uniquement)
- UI : `components/defi/TroLiquidityPanel.tsx`

```ts
import { fetchTroLiquiditySnapshot } from '@/services/defi/troLiquidityService'
```

## 2. Indexation holders

**Fichier :** `apps/frontend/src/services/analytics/holderService.ts`

- `GET /tokens/TRO-94c925/accounts`
- Classification : `user` | `sc-vault` | `sc-pool`
- Top users hors SC + vaults isolés
- NFT leaderboard via `VITE_XARTISTS_NFT_COLLECTIONS`
- UI : `components/analytics/TroHolderBoard.tsx`

## 3. Certification NFT physique

**Fichier :** `apps/frontend/src/components/PhysicalNftCertifier.tsx`

- Formulaire photo + métadonnées
- Génération **CoA** (authenticité) / **CoP** (propriété) — paper
- Empreinte SHA-256 locale de la photo
- Intents LIA : `PHYGITAL_REEVAL`, mint paper via `digitalTwinCertificate`

## Intégration suggérée

| Page | Composant |
|------|-----------|
| Staking / DeFi | `<TroLiquidityPanel />` |
| Market Analytics / Holder Room | `<TroHolderBoard />` |
| RWA / Digital Twin / Studio | `<PhysicalNftCertifier />` |

## Env

```
VITE_XARTISTS_NFT_COLLECTIONS=COLLECTION1-xxxxxx,COLLECTION2-yyyyyy
```

Paper-only : aucune TX automatique. Lecture API MultiversX publique.
