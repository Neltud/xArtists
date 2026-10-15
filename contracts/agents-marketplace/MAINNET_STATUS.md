# agents-marketplace — mainnet status

**Updated:** 2026-10-15

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

## Official pack prices (2026-10-15)

| Pack | Enum | Price | Atomic |
|------|------|-------|--------|
| Pulse | `0x01` | **10.0 EGLD** | `10000000000000000000` |
| Yield | `0x02` | **5.0 EGLD** | `5000000000000000000` |
| Sentinel | `0x03` | **2.5 EGLD** | `2500000000000000000` |

**setPackPrice CI:** [#38687973735](https://github.com/Neltud/xArtists/actions/runs/38687973735) (gate `SET_PACK_PRICES_MAINNET`, nonces 108/109/110).  
Last TX (Sentinel): [`8ea9d491cbde85b4c04e70172ebb7d517e80314477028fb36fa95d189ee6ae14`](https://explorer.multiversx.com/transactions/8ea9d491cbde85b4c04e70172ebb7d517e80314477028fb36fa95d189ee6ae14).

Recettes `buyPack` → owner du SC → financement du wallet de trading LLM **Vellum de LIA**.

`buyPack` sans value suffisante → `insufficient payment` (attendu).

## Mint test (manual — admin wallet)

NFT is minted **to the caller** (`buyPack` → `esdt_nft_create` to msg.sender).

- Admin `erd1mmh2j5y8esv2tmmyeau3hr4xa2u2te3zc3j9wumn3v5vm8uvsczqnucj5l` owns: `XAIPLS-2cf72b-01`, `XAIPLS-2cf72b-02`, `XAIYLD-987e24-01`, `XAISNT-3d8a6b-01`.
- Execute from **xPortal / dApp** with buyer wallet:
  - SC: `erd1qqqqqqqqqqqqqpgqgawa0p5y09f0e68pwaa50zm47jl9jxcwvhxqgdqwsg`
  - function `buyPack` arg `0x01` value `10000000000000000000` (10 EGLD) gas `30000000`
  - Yield: arg `0x02` value `5000000000000000000` (5 EGLD)
  - Sentinel: arg `0x03` value `2500000000000000000` (2.5 EGLD)

## dApp env

```
VITE_AGENTS_CODEHASH_OK=true
VITE_AGENT_PACK_COLLECTIONS=XAIPLS-2cf72b,XAIYLD-987e24,XAISNT-3d8a6b
```
