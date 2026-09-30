# PUBLIC GO LIVE — 2026-09-30

## Decision

- **Multisig:** not required (owner remains deployer until later).
- **House:** funded — first user spins authorized.
- **Scope:** full dapp mainnet (stake, market, venue, slot, packs paper/live per gate).

## Secrets (GitHub Pages / Actions) — required

```
VITE_LIVE_MODE=1
VITE_APP_MODE=live
VITE_TRO_STAKING_CODEHASH_OK=1
VITE_MARKETPLACE_CODEHASH_OK=1
VITE_VENUE_CODEHASH_OK=1
VITE_SLOT_CASINO_CODEHASH_OK=1
```

Never commit `=1` in the repo.

## User paths

| Flow | Route |
|------|-------|
| Connect xPortal | Header |
| Stake TRO | `/staking` |
| Marketplace | `/marketplace` |
| Slot spin | `/slot` |
| Museum 3D | `/museum` |
| Packs / rooms | `/my-packs` |
| Command Center | `/command-center` |
| Checklist | `/go-live` |

## Safety still on

- Circuit breaker: owner `setPaused` on Slot / Market
- Safety Switch → paper on hard TX fail
- `TransactionMonitor` + `txLog`
- Fail-closed if CODEHASH secret missing

## Post-launch

1. Rebuild Pages after secrets
2. Hard refresh site
3. First public spin / stake on explorer
4. Optional later: multisig ownership transfer
