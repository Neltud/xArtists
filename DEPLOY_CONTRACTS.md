# Deploying Contracts with LIA Wallet

**LIA Wallet Address:** `erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6`

## Steps
1. Use the LIA wallet above to deploy all contracts (tro-staking, nft-staking, btc-bridge, etc.).
2. Build:
   ```bash
   cd contracts/tro-staking
   cargo build --release --target wasm32-unknown-unknown
   ```
3. Deploy with mxpy or MultiversX tools using the LIA address.
4. Copy the new contract addresses into `.env` and update `CONTRACT_ADDRESSES` in `transactions.ts`.
5. Real prices are fetched live from MultiversX API + CoinGecko for TRO-94c925.

After deployment, all on-chain features (mint, stake, governance) will work with real transactions.