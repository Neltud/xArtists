# NFT / SFT Marketplace SC — audit draft

## Règle économique (immuable produit)

**Le vendeur reçoit ≥ 90 % du prix de vente.**

- `MAX_FEE_PLUS_ROYALTY_BPS = 1000`
- `listNft` / `buyNft` / `acceptBid` reject si `fee_bps + royalty_bps > 1000`
- Vue `getSellerShareBps(royalty_bps)` pour le front

### Défaut recommandé au deploy

```
init(fee_bps = 300)  // 3 % protocol
// listing: royalty_bps = 700, royalty_receiver = créateur
// → seller 90 %
```

### SFT

List **1 unité** par call (`amount == 1`). Même split que NFT.

## Scope before mainnet

- [x] Seller ≥ 90 % enforced on-chain
- [ ] List / buy / delist + royalty to creator
- [ ] Protocol fee → claimFees → LIA (70) / holders (20) / burn (10) — ops off-chain V1 or rewards_pool later
- [ ] No upgrade after GO_LIVE
- [ ] EGLD payment V1 (USDC later allowlist)

## Alignement treasury (`marketplace_sale`)

| Bucket | % du **prix** |
|--------|----------------|
| **Seller** | **≥ 90** |
| Creator royalty | ≤ 10 (défaut 7) |
| Protocol fee | ≤ 10 (défaut 3) |

Ancienne matrice « creator 70 % » = **obsolète** (confusion avec share post-fee).

## GO_LIVE

1. External audit  
2. Testnet micro buy  
3. Mainnet deploy `fee_bps=300`  
4. `VITE_MARKETPLACE_ADDRESS` + `CODEHASH_OK` only after hash match  
