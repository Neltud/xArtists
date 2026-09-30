# Mainnet deployment sequence (MultiversX)

## Already live (reference)

See `apps/frontend/public/data/contracts.json`:

- tro_staking, nft_marketplace, slot_casino, treasury_splitter, venue, governance, …
- status: LIVE + codeHash map

## Grand Switch (front)

```
VITE_LIVE_MODE=1
VITE_APP_MODE=live
VITE_TRO_STAKING_CODEHASH_OK=1
VITE_MARKETPLACE_CODEHASH_OK=1
VITE_VENUE_CODEHASH_OK=1
VITE_SLOT_CASINO_CODEHASH_OK=1
```

Never commit these as `=1` in git.

## Warm-up

1. Fund Slot SC EGLD (house + progressive headroom).
2. Optional: `setPaused false` if paused.
3. Micro stake TRO + micro spinEgld + resolve.

## Rollback

1. `setPaused true` (owner/multisig) → UI maintenance banner.
2. Clear CODEHASH secrets / force paper session.
3. Investigate via explorer + `txLog`.
