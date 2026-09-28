# GO_LIVE Status — venue-split & production

Updated: 2026-09-28

## venue-split mainnet

| Step | Status |
|------|--------|
| 1 Deploy mainnet (4 buckets) | ✅ LIVE |
| 2 Address | `erd1qqqqqqqqqqqqqpgqvy4qejg6lds00hy829nwmyxktrdqsuq3vhxq2vje2y` |
| 3 codeHash on-chain | `SRrGio4iLmtQrb22JJhapwobNgavYsoQ52WmfT1owuY=` |
| 4 Micro rentPay dust | ⏳ **à faire** (xPortal → SC) |
| 5 Pages `VITE_VENUE_SC_ADDRESS` | ✅ branched in front / env example |
| 6 `VITE_VENUE_CODEHASH_OK` | ❌ **interdit** jusqu’après step 4 |
| 7 Annonce publique | ❌ après 4–6 |

Explorer: https://explorer.multiversx.com/accounts/erd1qqqqqqqqqqqqqpgqvy4qejg6lds00hy829nwmyxktrdqsuq3vhxq2vje2y

## Front policy

- Address known → UI shows status “paper until CODEHASH_OK”
- `canRentVenueOnChain()` = address + CODEHASH_OK only
- Paper fail-closed remains default for money path

## Next SC

1. nft-marketplace wasm pack (0.66) → CI deploy
2. agents-marketplace same
3. Never set marketplace CODEHASH_OK without verify
