# Agents Marketplace — buyPack upgrade (1 pack = 1 ESDT NFT)

## What changed

- New payable endpoint: `buyPack(pack_type: u8)` with `pack_type` ∈ `{1=Pulse, 2=Yield, 3=Sentinel}`
- On payment ≥ configured price: `esdt_nft_create` + `direct_esdt` to **caller** in the same TX
- Event: `packPurchased(buyer, pack_type, nft_nonce, token_id)`
- Owner endpoints: `setPackCollection`, `setPackPrice`
- Existing `listAgentAction` / `buyAgentAction` / `claimFees` unchanged

## ⚠️ buyAgentAction is NOT a pack NFT purchase

| Endpoint | Pays | Transfers NFT |
|----------|------|---------------|
| **`buyPack`** | EGLD ≥ pack price | **Yes** — mint to caller |
| **`buyAgentAction`** | EGLD ≥ listing price | **No** — seller gets EGLD only |

`listAgentAction` stores an `agent_id` string + price; it does **not** escrow an ESDT.

**dApp rule (2026-10-16):** default checkout uses `buyPack` only.
`buyAgentAction` requires explicit `VITE_AGENT_PACK_BUY_ENDPOINT=buyAgentAction`.

## Prerequisites (owner / ops)

1. **Collections** issued on MultiversX (full ids with suffix):
   - Pulse → `XAIPLS-2cf72b`
   - Yield → `XAIYLD-987e24`
   - Sentinel → `XAISNT-3d8a6b`
2. **ESDTRoleNFTCreate** granted to the **agents-marketplace SC address** on each collection.
3. Owner PEM for the **current** SC owner (upgrade authority).

> CI / agent environments **cannot** hold your PEM or broadcast mainnet TXs.
> Run upgrade + role grants on a secure machine with `mxpy` / MultiversX IDE.

## Build

```bash
cd contracts/agents-marketplace
sc-meta all build
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

See `MAINNET_STATUS.md` — prices **10 / 5 / 2.5 EGLD** already set (2026-10-15).

## Test buyPack

```bash
mxpy contract call "$CONTRACT" \
  --function=buyPack \
  --arguments 0x01 \
  --value=10000000000000000000 \
  --pem=/secure/path/buyer.pem \
  --proxy=https://gateway.multiversx.com --chain=1 \
  --gas-limit=30000000 --recall-nonce --send
```

## dApp

- `useAgentPackTx.buyPack` → `buyPack@01|02|03`
- Env: `VITE_AGENTS_CODEHASH_OK=true` and collections env if needed

## Security / pause

- Never commit PEM files.
- Incident: `docs/EMERGENCY_PAUSE.md`
- Monitor: `python3 scripts/ops_sc_watch.py` · workflow **Ops SC watch**
- `claimFees` withdraws pack sale EGLD to owner.
