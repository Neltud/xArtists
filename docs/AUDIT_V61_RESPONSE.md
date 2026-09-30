# Audit V6.1 response (Grok)

Auditor notes corrected against **current main** (2026-09-30).

## Status vs audit table

| Module | Audit said | Actual |
|--------|------------|--------|
| Raycaster / CommandWall | Pending | **Done** |
| Audio / Shader | Pending | **Done** (PulseAtmosphere + music cross-fade) |
| Real-world minting | Pending | Paper **Done** · on-chain gated CODEHASH |
| LIA Velum | Missing | Phase 6+ (after dust) |

## Critical gaps closed this commit

1. **TX watchdog 45s** — `empireTxStart` arms timer → forces `error` if stuck preparing/signing/broadcast.
2. **Mode lock** — `setModeLock` / `useModeLock` during paper mint & live mint.
3. **Agent pack TX** — `useAgentPackTx.mintOnChain` uses `useSendTransaction` → `__xartistsSendTx` (same as stake/slot).
4. **House emergency** — `slotHouseGuard.ts` blocks REAL spins if cached house < jackpot threshold.

## Still ops / Phase 5 (not pure front)

| Item | Owner |
|------|--------|
| `VITE_*_CODEHASH_OK` secrets | GH Pages secrets only |
| ABI verify agents `buyPack` | Ops bytecode vs front tag |
| Fund slot progressive + `setCachedHouseEgld` / API refresh | Ops |
| Dust loop mint / spin / treasury | Human + xPortal |
| Akash / LIA Velum | Phase 6–8 after dust green |

## Rules respected

- No `=1` CODEHASH in repo
- Paper mode remains always available
- Museum extension-only

## Recommended next human step

1. Rebuild Pages  
2. Optional secrets: already set TRO/MARKET/VENUE; add SLOT/AGENTS only after ABI + fund  
3. Dust spin + dust stake (already once) + listNft  
4. Only then Akash Shadow Engine
