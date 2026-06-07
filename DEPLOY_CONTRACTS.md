# Deploying Contracts with LIA Wallet

## LIA Deployer
Use the official LIA / project wallet address for all contract deployments:

```ts
const LIA_DEPLOYER_ADDRESS = 'erd1qqqqqqqqqqqqqpgq...'; // <-- Replace with real address
```

## Steps
1. Build all contracts (tro-staking, nft-staking, btc-bridge, minter if separate).
2. Deploy using LIA wallet (mxpy or MultiversX IDE).
3. Update `.env` and `transactions.ts` with the new addresses.
4. Update TRO token references to TRO-94c925 everywhere.

After deployment, real prices will come from MultiversX API + CoinGecko fallback.
