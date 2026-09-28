# venue-split — MAINNET LIVE

| Field | Value |
|-------|--------|
| **SC address** | `erd1qqqqqqqqqqqqqpgqvy4qejg6lds00hy829nwmyxktrdqsuq3vhxq2vje2y` |
| **Explorer** | https://explorer.multiversx.com/accounts/erd1qqqqqqqqqqqqqpgqvy4qejg6lds00hy829nwmyxktrdqsuq3vhxq2vje2y |
| **Deploy tx** | `fd0668a81c78fc569c481a8e107887040e0ed2238f471a2b28ec12ef9acd0465` |
| **codeHash** | `SRrGio4iLmtQrb22JJhapwobNgavYsoQ52WmfT1owuY=` |
| **Owner** | `erd1kex0pvp9dng8j76sgsejkyx86nhxuqk24my6wnha8dga9mymvhxqvl8v0g` |
| **Chain** | mainnet (`1`) |
| **CI run** | https://github.com/Neltud/xArtists/actions/runs/36452702473 |

## Buckets (immutable at init)

| Role | % | Address |
|------|---|---------|
| Institution | 40 | `erd1hurlzgn2sq8sswdksv7ewtp6vs9umdakcpef5nfxkmt7mpxsyumsywtva6` |
| Associations | 20 | `erd1cwp2m53pnem5p35vsdc2mcry6779eawq9h4ty2a4nnsp8ewknrjs55yxcd` |
| LIA treasury | 25 | `erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6` |
| Holders pool | 15 | `erd1qpvy7z9jchrvxcu0c9z3w083am6n5j7nae8u0cvaanesa36a839qcgj5fz` |

## On-chain verify (2026-09-28)

- `getSplitBps` → **4000 / 2000 / 2500 / 1500** ✅
- `getPaused` → ok (not paused)
- Account flags: `isUpgradeable=true` (policy: do not upgrade), `isPayable=false` (monitor rentPay — may need metadata if plain transfer rejected)

## Front flags (ordered)

1. Set Pages secret `VITE_VENUE_SC_ADDRESS=erd1qqqqqqqqqqqqqpgqvy4qejg6lds00hy829nwmyxktrdqsuq3vhxq2vje2y`
2. Micro `rentPay` dust test from a real wallet
3. **Only then** `VITE_VENUE_CODEHASH_OK=1` if explorer codeHash matches build artifact
4. Public announcement

**Do not** set `CODEHASH_OK` before step 3.
