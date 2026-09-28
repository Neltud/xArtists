# Venue-split — deploy testnet

## Prérequis

- `mxpy` + toolchain MultiversX SC
- `SC_DEPLOYER_PEM` (wallet funded **devnet**)
- 4 adresses bucket (institution, associations, LIA, holders pool)

## Commande

```bash
export SC_DEPLOYER_PEM=~/keys/deployer-devnet.pem
export INSTITUTION_ADDR=erd1...
export ASSOCIATIONS_ADDR=erd1...
export LIA_TREASURY_ADDR=erd1...
export HOLDERS_POOL_ADDR=erd1...
./scripts/deploy_venue_split_testnet.sh
```

## Après deploy

1. Explorer devnet → noter **address** + **codeHash**
2. Appeler `getSplitBps` / `getBuckets`
3. Test micro `rentPay` avec tier_id
4. **Ne pas** activer `VITE_VENUE_CODEHASH_OK` sur mainnet Pages tant que non audité

## Alignement

Front: `venueRental.ts` · `treasuryFlows.ts` · intent `VENUE_RENT_PAY`
