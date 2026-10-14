# Agents Marketplace — buyPack upgrade (1 pack = 1 ESDT NFT)

## What changed

- New payable endpoint: `buyPack(pack_type: u8)` with `pack_type` ∈ `{1=Pulse, 2=Yield, 3=Sentinel}`
- On payment ≥ configured price: `esdt_nft_create` + `direct_esdt` to **caller** in the same TX
- Event: `packPurchased(buyer, pack_type, nft_nonce, token_id)`
- Owner endpoints: `setPackCollection`, `setPackPrice`
- Existing `listAgentAction` / `buyAgentAction` / `claimFees` unchanged

## Prerequisites (owner / ops)

1. **Collections** issued on MultiversX (full ids with suffix):
   - Pulse → e.g. `xAiAx-xxxxxx`
   - Yield → `xAiAy-…`
   - Sentinel → `xAiAs-…`
2. **ESDTRoleNFTCreate** granted to the **agents-marketplace SC address** on each collection.
3. Owner PEM for the **current** SC owner (upgrade authority).

> CI / agent environments **cannot** hold your PEM or broadcast mainnet TXs.
> Run upgrade + role grants on a secure machine with `mxpy` / MultiversX IDE.

## Build

```bash
cd contracts/agents-marketplace
sc-meta all build
# or: cargo build --release --target wasm32-unknown-unknown
```

## Upgrade (mainnet)

```bash
CONTRACT=erd1qqqqqqqqqqqqqpgqgawa0p5y09f0e68pwaa50zm47jl9jxcwvhxqgdqwsg

mxpy contract upgrade "$CONTRACT" \
  --bytecode=output/agents-marketplace.wasm \
  --pem=/secure/path/owner.pem \
  --proxy=https://gateway.multiversx.com \
  --chain=1 \
  --gas-limit=60000000 \
  --recall-nonce \
  --send
```

## Configure collections & prices (after upgrade)

```bash
mxpy contract call "$CONTRACT" \
  --function=setPackCollection \
  --arguments 0x01 str:xAiAx-XXXXXX \
  --pem=/secure/path/owner.pem \
  --proxy=https://gateway.multiversx.com --chain=1 \
  --gas-limit=10000000 --recall-nonce --send

mxpy contract call "$CONTRACT" \
  --function=setPackPrice \
  --arguments 0x01 0x0de0b6b3a7640000 \
  --pem=/secure/path/owner.pem \
  --proxy=https://gateway.multiversx.com --chain=1 \
  --gas-limit=10000000 --recall-nonce --send
```

Repeat for `0x02` (Yield) and `0x03` (Sentinel).

## Grant NFTCreate role

Use MultiversX Console → Token → Roles → add `ESDTRoleNFTCreate` for the SC address on each collection.

## Test buyPack

```bash
mxpy contract call "$CONTRACT" \
  --function=buyPack \
  --arguments 0x01 \
  --value=1000000000000000000 \
  --pem=/secure/path/admin.pem \
  --proxy=https://gateway.multiversx.com --chain=1 \
  --gas-limit=30000000 --recall-nonce --send
```

Verify NFTs: https://explorer.multiversx.com/accounts/<erd1>/nfts

## dApp

- `useAgentPackTx.buyPack` already sends `buyPack@01|02|03`
- Env after live collections: `VITE_AGENTS_CODEHASH_OK=true` and `VITE_AGENT_PACK_COLLECTIONS=<full-ids>`

## Security

- Never commit PEM files.
- Prefer **devnet** test before mainnet.
- `claimFees` withdraws accumulated EGLD from pack sales to owner.
