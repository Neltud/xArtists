# Flux trésorerie xArtists / LIA / $TRO

## Principes

- **Paper-first** : aucun prélèvement on-chain tant que `codeHash` non vérifié / GO_LIVE.
- **Supply TRO** plafonnée **500 000** ; burns historiques hors dApp.
- **Packs / agents** = produits d’accès, pas investissement.
- **PEM** : jamais dans le front ni Akash ; Vellum / ops uniquement.

## Sources → buckets

| Source | Institution | Assoc. | LIA | Holders | Burn / Creator |
|--------|-------------|--------|-----|---------|----------------|
| Packs paper | — | 10% | 70% | 20% | — |
| Ads bids | — | 15% | 60% | 25% | — |
| Location salles | **40%** | 20% | 25% | 15% | — |
| Marketplace | — | — | fee 20% | 5% | creator 70% + burn 5% |
| Slot (rake) | — | 15% | 55% | 30% | jackpot user d’abord |
| Tips | — | — | 100% | — | — |

Implémentation TS : `apps/frontend/src/config/treasuryFlows.ts`.

## Burns

| Mécanique | Statut | Note |
|-----------|--------|------|
| **Burn direct TRO** | Cible SC marketplace | 5% du protocol fee convertible |
| **LP burn** | **OFF** sans vote DAO | Retire la liquidité — dangereux en auto |
| Buyback treasury | Ops LIA discret | Jamais présenté comme yield |

## Holders rewards (éligibilité)

- LP TRO/* (USDC, EGLD, MEX, USDT, WBTC, WETH, XOXNO, WDAI)
- ArtPass SFT staked
- **Holder paper ≠ autorisation on-chain**

## SC (après audit)

1. `venue-split` — split loyers immuable
2. `marketplace` — list/buy + royalty + burn bps
3. `rewards` — claim holders (LP value + ArtPass)
4. **Pas de deploy mainnet** sans checklist GO_LIVE

## Agent 8008

Route intents (`BUY_NFT`, `VENUE_RENTAL`, …) → Vellum workflow `xartists-8008-intents`. Config : `apps/frontend/src/config/agent8008.ts`.
