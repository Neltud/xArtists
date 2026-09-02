# Packs NFT Agents

## Séries (limitées)

| ID | Tier | Supply max | Prix liste |
|----|------|------------|-----------|
| pulse | A | 333 | 18 € |
| yield | B | 500 | 12 € |
| sentinel | C | 777 | 8 € |

## Flux

1. Connect wallet (`/#/wallet`)
2. `/#/agents` → galerie NFT + checkout Stripe / paper
3. Mint SC (pending) envoie NFT vers `erd1` acheteur
4. `/#/my-packs` — accès

## Data

- `data/nft_packs.json`
- `apps/frontend/src/lib/nftPacks.ts`
- `NftPacksGallery` · `MyNftPacksStrip`

## Hors scope

Tours artistiques ≠ pack NFT agent.
