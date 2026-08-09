# $TRO burn — `contracts/tro-burn`

## Endpoint
`burnTro` (payable ESDT) — only configured token (TRO-94c925) → `esdt_local_burn`.

## Deploy checklist
1. Build/deploy wasm (owner LIA ops / multisig)
2. Token manager: **ESDTLocalBurn** role for SC address
3. `contracts.json` → `tro_burn: erd1…`
4. Env: `VITE_TRO_BURN_ADDRESS` + `VITE_TRO_BURN_CODEHASH_OK=1`
5. Rebuild Pages

## TX
`ESDTTransfer@TRO-94c925@amount@burnTro` → tro-burn SC

User signs only. LIA never burns user tokens.

## vs partner Burnify
xArtists = pure deflation. Partner BFY rewards = external, optional later.
