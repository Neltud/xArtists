---
hidden: true
noIndex: true
---

# Burnify xArtists — SC dédié tro-burn

Pas un service externe. Burn $TRO + rewards EGLD.

## Flux

1. Ops : `fundRewards` (EGLD) → pool SC
2. User : `ESDTTransfer@TRO@amount@burnTro`
3. Burn on-chain + reward EGLD au burner
4. `protocol_fee_bps` de la reward → `reward_wallet` (LIA)

Pool vide → burn OK, reward 0.

## Init exemple

* tro = TRO-94c925
* reward\_wallet = LIA ops
* egld\_per\_whole\_tro = 1e15 (0.001 EGLD / TRO)
* protocol\_fee\_bps = 1000 (10%)
* decimals = 6

## Env front

VITE\_TRO\_BURN\_ADDRESS · VITE\_TRO\_BURN\_CODEHASH\_OK=1 · VITE\_TRO\_BURN\_EGLD\_PER\_TRO

Rôle token : ESDTLocalBurn sur le SC.
