# Blackbox checklist — mainnet post-deploy

After `./scripts/deploy_mainnet.sh`:

## agents-marketplace

- [ ] `getFeeBps` == 300  
- [ ] list/register agent (if endpoint)  
- [ ] buyAgent small amount → seller receives ~97%, SC holds fee  
- [ ] `claimFees` only owner  
- [ ] non-owner claim fails  
- [ ] pause blocks buy  

## nft-marketplace

- [ ] listNft  
- [ ] buyNft + excess refund  
- [ ] cancelListing  
- [ ] placeBid / acceptBid / withdrawBid (if new codehash)  
- [ ] claimFees owner  

## Frontend

- [ ] `VITE_AGENTS_MARKETPLACE_ADDRESS` / `VITE_MARKETPLACE_ADDRESS`  
- [ ] Rebuild Pages  
- [ ] TxCapabilityBanner green with real wallet  
- [ ] One Buy test micro-amount  

## Executor

- [ ] `LIA_LIVE_TRADING=0` paper ok  
- [ ] live only after above green  
