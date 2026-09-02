# Burnify xArtists — SC dédié `tro-burn`

Pas un service externe. Burn $TRO + rewards EGLD.

## Flux
1. Ops : `fundRewards` (EGLD) → pool SC
2. User : `ESDTTransfer@TRO@amount@burnTro`
3. Burn on-chain + reward EGLD au burner
4. `protocol_fee_bps` de la reward → `reward_wallet` (LIA)

Pool vide → burn OK, reward 0.

## Init exemple
- tro = TRO-94c925
- reward_wallet = LIA ops
- egld_per_whole_tro = 1e15 (0.001 EGLD / TRO)
- protocol_fee_bps = 1000 (10%)
- decimals = 6

## Env front
VITE_TRO_BURN_ADDRESS · VITE_TRO_BURN_CODEHASH_OK=1 · VITE_TRO_BURN_EGLD_PER_TRO

Rôle token : ESDTLocalBurn sur le SC.
