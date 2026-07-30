# xArtists Smart Contracts (MultiversX)

| Contract | Path | Status |
|----------|------|--------|
| **NFT Marketplace** | `contracts/nft-marketplace` | Ready to deploy — list/buy, royalties, pause, claimFees |
| **Agents Marketplace** | `contracts/agents-marketplace` | Ready to deploy — list/buy agent actions |
| BTC Bridge | `contracts/btc-bridge` | Experimental skeleton |
| NFT Staking | `contracts/nft-staking` | Cargo only — complete source later |
| TRO Staking | `contracts/tro-staking` | Cargo only — complete source later |

## Deploy (mainnet)

**I cannot deploy for you** without your PEM and EGLD. Run locally:

```bash
# 1. Tools
pip install multiversx-sdk-cli
# rustup target add wasm32-unknown-unknown  # if local build

# 2. Wallet (NEVER commit)
export PEM=~/wallets/xartists-deployer.pem
export CHAIN=1
export PROXY=https://gateway.multiversx.com
export FEE_BPS=300   # 3%

# 3. Deploy both marketplaces
chmod +x scripts/deploy_all_scs.sh
./scripts/deploy_all_scs.sh

# Or one by one:
./scripts/deploy_all_scs.sh nft-marketplace
./scripts/deploy_all_scs.sh agents-marketplace
```

Script writes addresses into `data/contracts.json`.

## After deploy

1. Commit `data/contracts.json` (addresses only, no PEM)
2. Frontend: `VITE_MARKETPLACE_ADDRESS=<nft-marketplace>`
3. Update `packages/core/src/contracts/marketplaceAbi.ts` address
4. Test list/buy with small amount on mainnet

## Security

- Start with **devnet** (`CHAIN=D`, proxy devnet) if unsure
- Audit before large TVL
- Keep owner key offline / hardware when possible
- `setPaused(true)` emergency

## NFT Marketplace endpoints

- `listNft(price, royalty_bps, royalty_receiver)` + pay 1 NFT
- `buyNft(listing_id)` + pay EGLD
- `cancelListing(listing_id)`
- `claimFees` (owner)
- `setPaused` / `setFeeBps` (owner)
