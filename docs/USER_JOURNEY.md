# Parcours utilisateur complet — xArtists

## Principes

- **Packs / Agents IA** = produits numériques **uniques et limités** (expérience, signaux, accès).
  **Pas** un produit financier, **pas** un investissement, **pas** de promesse de rendement.
- Rewards éventuels = **cadeaux / allocations LIA** discrétionnaires, pas un droit contractuel de yield.
- Connect wallet = **user** only (jamais LIA / deployer en session achat).

## Funnel

```
Landing → Musée 3D / Galerie
       → Packs (Pulse · Yield · Sentinel) paper ou live mint
       → My Packs · ouverture scénique
       → Wallet (soldes, LP, daily points)
       → DAO vote (LP weight + ArtPass staked)
       → Staking NFT xArtists / TRO (principal)
       → Marketplace list/buy/bid · **revente agent NFT**
       → Slot (eglD/USDC) · Ads enchères
       → Tip LIA
```

## Stake / Unstake

| Asset | SC | User action |
|-------|-----|-------------|
| NFT art / ArtPass | nft-staking / governance | stakeNft / unstake |
| TRO | tro-staking | stake / unstake amount |

## Vote power

`power = LP_weight(user) + artpass_staked * 10`

LP_weight set by ops oracle (preuve LP off-chain) until on-chain LP proof.

## Resale agent IA

1. User owns agent NFT (from pack / marketplace)
2. List on **nft-marketplace** or **agents-marketplace**
3. Buyer pays EGLD · fee → accumulated → LIA claim
4. Secondary market = produit, pas titre financier

## Ads / Bids / Slot

- Ads: placeholder + paper bid tunnel `/ads`
- NFT bids: on-chain Bid endpoint marketplace
- Slot: progressive + rake → house → LIA

## Design

Nouveau design atelier (FX + SFX) : pages uniques, `RouteSfx`, `SoundDock`, musée 3D 3e personne.
