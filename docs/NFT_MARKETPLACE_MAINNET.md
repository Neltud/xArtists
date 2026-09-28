# nft-marketplace — MAINNET LIVE

| Field | Value |
|-------|--------|
| **SC address** | `erd1qqqqqqqqqqqqqpgqx0araa285cdepdsfe8s23mer30r3dh9lvhxqq8txmm` |
| **Deploy tx** | `bed6ae0962f174a67e327568061a665536e2fb891354dd1185fda6776d5acf6b` |
| **Deployer** | `erd1kex0pvp9dng8j76sgsejkyx86nhxuqk24my6wnha8dga9mymvhxqvl8v0g` |
| **Init** | `fee_bps = 300` (3 %) → seller ≥ 90 % with royalty ≤ 700 |
| **Explorer** | https://explorer.multiversx.com/accounts/erd1qqqqqqqqqqqqqpgqx0araa285cdepdsfe8s23mer30r3dh9lvhxqq8txmm |

## Rules

- `fee_bps + royalty_bps ≤ 1000`
- List 1 NFT or 1 SFT unit
- Do **not** set `VITE_MARKETPLACE_CODEHASH_OK` until explorer codeHash matches build wasm

## Next

1. Deploy agents-marketplace
2. Verify both codeHashes
3. Wire front addresses (paper fail-closed until CODEHASH_OK)
