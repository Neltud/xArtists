# Deploying Rust Contracts (tro-staking, nft-staking, btc-bridge)

## Prerequisites
- Rust + cargo installed
- mxpy or MultiversX CLI tools
- Testnet or Mainnet access

## Steps
1. Build contract:
   ```bash
   cd contracts/tro-staking
   cargo build --release --target wasm32-unknown-unknown
   ```

2. Deploy (example with mxpy):
   ```bash
   mxpy contract deploy --bytecode output/tro_staking.wasm --pem wallet.pem --gas-limit 200000000
   ```

3. Note the deployed address and update:
   - `.env` → VITE_TRO_STAKING_ADDRESS
   - `src/services/transactions.ts` → CONTRACT_ADDRESSES

Repeat for nft-staking and btc-bridge.

After deployment, implement the exact endpoint names and argument encoding in transactions.ts based on your Rust contract.
