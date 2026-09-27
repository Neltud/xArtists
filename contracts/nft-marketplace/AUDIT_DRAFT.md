# NFT Marketplace SC — audit draft notes

Existing crate: `contracts/nft-marketplace`.

## Scope before mainnet

- [ ] List / buy / delist with royalty bps to creator
- [ ] Protocol fee bps → LIA + optional burn path (TRO convert off-scope V1)
- [ ] Holders slice → `rewards_pool` address (immutable at init)
- [ ] Reject list if codeHash / roles missing
- [ ] No upgradeability after deploy
- [ ] Fail closed if payment token not EGLD/USDC allowlist

## Alignement treasury

`marketplace_sale` matrix :

| Bucket | % |
|--------|---|
| Creator royalty | 70 |
| Protocol fee | 20 |
| Burn TRO (ops policy) | 5 |
| Holders rewards | 5 |

## GO_LIVE

1. External audit  
2. Testnet verify  
3. Mainnet deploy  
4. `VITE_MARKETPLACE_ADDRESS` + `VITE_MARKETPLACE_CODEHASH_OK=1` only after hash confirmed  
