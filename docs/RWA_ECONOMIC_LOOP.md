# Phase 5.5 — Mint-to-Burn economic loop

```
User mints RWA NFT  →  ledger +1 TRO (reward)
LIA trades          →  EGLD / USDC / TRO only  (never NFT)
NFT sold + shipped  →  ledger −1 TRO (burn)
```

## Commands

```bash
PYTHONPATH=. python -m lia.guardian.rwa_minter --work rwa_001 --confirm-mint
PYTHONPATH=. python -m lia.guardian.fulfillment --sell rwa_001 --buyer erd1... --ship
PYTHONPATH=. python -m lia.utils.economic_validator
```

## Integrity

`total_minted - total_burned == circulating` → `data/economic_integrity.json`

Paper until on-chain TRO transfer + Burnify TX are wired.
