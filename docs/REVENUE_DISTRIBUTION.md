# Répartition des revenus — xArtists / LIA

**Règle** : pas de promesse de yield. Packs IA = produits d’entitlement (NFT/SFT), pas des parts de fonds.

## 1. On-chain live

### Venue-split (mainnet)

Adresse : `erd1qqqqqqqqqqqqqpgqvy4qejg6lds00hy829nwmyxktrdqsuq3vhxq2vje2y`

| Bucket | BPS | % |
|--------|-----|---|
| Institution | 4000 | 40 |
| Associations | 2000 | 20 |
| LIA treasury | 2500 | 25 |
| Holders pool | 1500 | 15 |

Endpoint : `rentPay(tier_id)` payable EGLD (et ESDT si branché).

## 2. Paper / post-GO_LIVE

| Source | LIA | Holders | Associations | Institution | Creator | Protocol | Burn |
|--------|-----|---------|--------------|-------------|---------|----------|------|
| Pack paper | 70 | 20 | 10 | — | — | — | — |
| Ads bid | 60 | 25 | 15 | — | — | — | — |
| Venue rental | 25 | 15 | 20 | 40 | — | — | — |
| NFT marketplace | — | 5 | — | — | 70 | 20 | 5 |
| Agents marketplace | 50 | 15 | 5 | — | — | 30 | — |
| Slot rake | 55 | 30 | 15 | — | — | — | — |
| Tip | 100 | — | — | — | — | — | — |

### Sous-répartition pool packs (holders issus pack_paper)

| Pack | BPS | % du pool pack |
|------|-----|----------------|
| Pulse | 4000 | 40 |
| Yield | 3500 | 35 |
| Sentinel | 2500 | 25 |

## 3. Packs IA = NFT / SFT d’entitlement

| Pack | Collection ticker | Token | Prix floor |
|------|-------------------|-------|------------|
| Pulse | `xAiAx` | NFT/SFT Agent 001+ | ≥ 10 EGLD |
| Yield | `xAiAy` | NFT/SFT Agent 002+ | ≥ 10 EGLD |
| Sentinel | `xAiAs` | NFT/SFT Agent 003+ | ≥ 10 EGLD |

- **NFT** : 1/1 unique (genesis agents).
- **SFT** : série limitée par nonce (même métadonnée pack, supply plafonnée) — mint SC après GO_LIVE.
- **Pas** un produit financier : pas de partage auto des trades LIA ; droit d’accès signaux + part **pool pack** si rewards_pool live.

## 4. DEX / farms externes (xExchange · OneDex)

| Item | Custody xArtists ? | Notes |
|------|--------------------|-------|
| LP TRO/* | Non | Wallet user |
| APR farm | Non | Claim user |
| Frais swap | Non | Restent sur le DEX |
| Vote DAO | Oui (lecture) | Voting power = valeur LP TRO + ArtPass staked |

xArtists **n’agrège pas** les rewards farm dans un SC tant que GO_LIVE rewards_pool n’est pas vérifié.

## 5. Ordre activation flags

1. `rentPay` dust OK  
2. `VITE_VENUE_CODEHASH_OK=1` (match explorer)  
3. Deploy nft-marketplace + agents-marketplace → verify codeHash  
4. Mint pack NFT/SFT collections  
5. rewards_pool branché holders / pack pools  
6. Annonce publique  

Source de vérité front : `apps/frontend/src/config/treasuryFlows.ts`.
