# Seed House Protocol — Slot Casino

## Status (2026-09-30)

| Item | Value |
|------|--------|
| Slot SC | `erd1qqqqqqqqqqqqqpgquf3cuv2zsfsahy7ypvter3qcep4ptthsvhxqs4g34f` |
| Explorer | https://explorer.multiversx.com/accounts/erd1qqqqqqqqqqqqqpgquf3cuv2zsfsahy7ypvter3qcep4ptthsvhxqs4g34f |
| Balance API | **0 EGLD** (seed required) |
| codeHash | `UZ0nX6dWsSgkVqjnFnR5zPNPk1UrNtR5SsrYf96VJCs=` |

## How to fund (CEO / deployer wallet)

### Option A — Native transfer (house liquid)

1. Open xPortal / Web Wallet with **deployer** (or treasury ops wallet).
2. Send **EGLD** to the Slot address above (simple transfer, no data).
3. Recommended seed: **5–10 EGLD** (covers jackpot threshold ~5 EGLD + buffer).
4. Min for UI “REAL open”: **0.5 EGLD** (`MIN_HOUSE_OPEN_EGLD`).

### Option B — Progressive pot

Call endpoint `fundProgressiveEgld` with EGLD value (payable) from owner if you want the progressive pool topped up separately.

## Verify

```bash
curl -s https://api.multiversx.com/accounts/erd1qqqqqqqqqqqqqpgquf3cuv2zsfsahy7ypvter3qcep4ptthsvhxqs4g34f | jq .balance
```

Balance is atomic (1e18 = 1 EGLD).

## Front behaviour

1. `/slot` calls `refreshHouseFromApi` on mount.
2. If balance **&lt; 0.5 EGLD** → REAL spins blocked, simulation available.
3. After seed TX confirms → refresh → **On-chain ouvert** when CODEHASH secret also set.
4. House amount shown on Slot page.

## Genesis spin checklist

1. Seed ≥ 0.5 EGLD (prefer 5+)
2. Secrets `VITE_SLOT_CASINO_CODEHASH_OK=1` + rebuild Pages
3. Dust `spinEgld` + `resolveSpin`
4. Confirm SC balance decreased on win
5. Optional: progressive / treasury views

## Important

Grok **cannot** sign the seed transfer — only the wallet holding EGLD can.
After you send, hard-refresh `/slot` to sync house.
