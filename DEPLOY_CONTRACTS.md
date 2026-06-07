# Deploy tro-staking and nft-staking with LIA Wallet

**LIA Wallet:** `erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6`

## 1. Build the contracts
```bash
# tro-staking
cd contracts/tro-staking
cargo build --release --target wasm32-unknown-unknown

# nft-staking
cd ../nft-staking
cargo build --release --target wasm32-unknown-unknown
```

## 2. Deploy using LIA wallet
Use `mxpy` or the MultiversX IDE with the LIA address above.

Example:
```bash
mxpy contract deploy \
  --bytecode output/tro_staking.wasm \
  --pem your-lia-wallet.pem \
  --gas-limit 200000000
```

## 3. After deployment
- Copy the new contract addresses
- Update `.env` and `CONTRACT_ADDRESSES` in `transactions.ts`
- Implement the real query functions in `queryStakedTRO` and `queryStakedNFTs`

Once done, the MainDashboard will show real staked amounts.