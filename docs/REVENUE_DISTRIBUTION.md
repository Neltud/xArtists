# Répartition des revenus — xArtists / LIA

**Règle** : pas de promesse de yield. Packs IA = produits d’entitlement (NFT/SFT), pas des parts de fonds.

## 1. Vente d’œuvre NFT / SFT — **vendeur ≥ 90 %**

SC `nft-marketplace` : `fee_bps + royalty_bps ≤ 1000` (10 %).

| Bénéficiaire | % typique | BPS | Qui |
|--------------|-----------|-----|-----|
| **Vendeur** | **≥ 90** | ≥ 9000 | Wallet qui liste (owner actuel) |
| Royalties créateur | ≤ 7–10 | ≤ 1000 | `royalty_receiver` (artiste / collection) |
| Frais protocole | ≤ 3–10 | ≤ 1000 | `accumulated_fees` → claim owner → LIA |

### Exemple défaut (100 EGLD)

| | EGLD | BPS |
|--|------|-----|
| Vendeur | **90** | 9000 |
| Créateur (royalty) | 7 | 700 |
| Protocole (fee) | 3 | 300 |

### SFT vs NFT

Même chemin on-chain : list **1 unité** (NFT nonce unique ou 1 SFT).  
Royalties :

1. **ESDT token royalties** (champ collection MultiversX) — informatif / wallets  
2. **Listing `royalty_bps` + `royalty_receiver`** — **appliqué à chaque vente** dans le SC  

Pour un pack SFT (xAiAx / xAiAy / xAiAs) : royalty_receiver = créateur / LIA treasury selon mint policy ; vendeur secondaire garde ≥ 90 %.

### Redistribution du seul protocol fee (après `claimFees`)

| Destination | % du fee |
|-------------|----------|
| LIA treasury | 70 |
| Holders rewards | 20 |
| Burn $TRO | 10 |

## 2. Agrégation des sources

| Source | On-chain | Split |
|--------|----------|-------|
| **Marketplace art** | post-deploy | Seller 90 · Royalty 7 · Fee 3 |
| **Agents marketplace** | post-deploy | Seller 90 · Fee 10 |
| **Venue rental** | **live** venue-split | Inst 40 · Asso 20 · LIA 25 · Holders 15 |
| **Pack paper** | mint | LIA 70 · Holders 20 · Asso 10 |
| **Ads bid** | paper/SC | LIA 60 · Holders 25 · Asso 15 |
| **Slot rake** | post SC | LIA 55 · Holders 30 · Asso 15 |
| **Tip** | transfer | LIA 100 |
| **xExchange / OneDex** | externe | 0 % xArtists (wallet user) |

Helpers front : `splitArtworkSale` · `aggregateFlows` · `splitProtocolFee` dans `treasuryFlows.ts`.

### Sous-pool packs (part holders des ventes pack)

Pulse 40 % · Yield 35 % · Sentinel 25 % (`PACK_POOL_SHARE_BPS`).

## 3. Venue-split (mainnet live)

`erd1qqqqqqqqqqqqqpgqvy4qejg6lds00hy829nwmyxktrdqsuq3vhxq2vje2y` — BPS immuables 4000/2000/2500/1500.

## 4. Ordre flags

1. rentPay dust  
2. `VITE_VENUE_CODEHASH_OK`  
3. Deploy marketplace (init `fee_bps=300`) → verify  
4. Mint collections pack NFT/SFT  
5. Annonce  
