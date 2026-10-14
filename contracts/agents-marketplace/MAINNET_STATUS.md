# agents-marketplace — mainnet status

**Updated:** 2026-10-14

## Upgrade — SUCCESS

| Field | Value |
|-------|--------|
| Address | `erd1qqqqqqqqqqqqqpgqgawa0p5y09f0e68pwaa50zm47jl9jxcwvhxqgdqwsg` |
| Upgrade TX | [`3e400b5132314cd55f050e14918c03cbd4ef5c3fd32da1f10a88f3d7db08021a`](https://explorer.multiversx.com/transactions/3e400b5132314cd55f050e14918c03cbd4ef5c3fd32da1f10a88f3d7db08021a) |
| codeHash | `igm9oUpgad+QO2cQqhphuLZuicEBNR7jdcQHk8YEe00=` |
| Owner | `erd1kex0pvp9dng8j76sgsejkyx86nhxuqk24my6wnha8dga9mymvhxqvl8v0g` |

## Collections + roles — SUCCESS (CI run [#38590609905](https://github.com/Neltud/xArtists/actions/runs/38590609905))

| Pack | Collection | getPackCollection | ESDTRoleNFTCreate on SC |
|------|------------|-------------------|-------------------------|
| Pulse (01) | `XAIPLS-2cf72b` | ok | yes (`canCreate: true`) |
| Yield (02) | `XAIYLD-987e24` | ok | yes |
| Sentinel (03) | `XAISNT-3d8a6b` | ok | yes |

Prices: 1 / 2 / 3 EGLD. `buyPack` query without value → `insufficient payment` (expected — collection configured).

## Mint test (manual — admin wallet)

NFT is minted **to the caller** (`buyPack` → `esdt_nft_create` to msg.sender).

- Admin `erd1mmh2j5y8esv2tmmyeau3hr4xa2u2te3zc3j9wumn3v5vm8uvsczqnucj5l` has ≥ 1.7 EGLD.
- Deployer PEM in CI has only ~0.04 EGLD → **cannot** fund CI buyPack without top-up.
- Execute from **xPortal / dApp** with admin wallet:
  - SC: `erd1qqqqqqqqqqqqqpgqgawa0p5y09f0e68pwaa50zm47jl9jxcwvhxqgdqwsg`
  - function `buyPack` arg `0x01` value `1000000000000000000` gas `30000000`

Expected NFT: `XAIPLS-2cf72b-01` (or next nonce) on admin Explorer NFTs tab.

## dApp env

```
VITE_AGENTS_CODEHASH_OK=true
VITE_AGENT_PACK_COLLECTIONS=XAIPLS-2cf72b,XAIYLD-987e24,XAISNT-3d8a6b
```
