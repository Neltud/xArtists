# Mission A — Empire store + LIVE SC wiring + TX overlay

**Date:** 2026-09-29  
**Scope:** Production mainnet frontend (fail-closed)

## Delivered

| File | Change |
|------|--------|
| `apps/frontend/src/config/scStatus.ts` | All LIVE addresses from contracts.json + per-SC CODEHASH_OK gates |
| `apps/frontend/src/store/empireStore.ts` | Empire store (useSyncExternalStore): SC snapshots, wallet, TX phase |
| `apps/frontend/src/providers/TxShell.tsx` | Transaction overlay + dynamic `__xartistsSendTx` bridge |
| `apps/frontend/src/hooks/useTroStakeTx.ts` | Stake/unstake TRO (ESDTTransfer) gated by `canStakeTro()` |
| `apps/frontend/src/pages/StakingPage.tsx` | TRO tab live UI (fail-closed banner until CODEHASH_OK) |
| `apps/frontend/src/context/WalletContext.tsx` | Sync wallet → empire store |
| `apps/frontend/src/main.tsx` | Wrap App in TxShell |
| `apps/frontend/src/lib/scStatus.ts` | Re-exports for all SC gates |
| `apps/frontend/.env.example` | Full address list; CODEHASH flags commented |
| `data/contracts.json` | codeHash map verified via MultiversX API |

## CODEHASH verification (API 2026-09-29)

| SC | Address | codeHash |
|----|---------|----------|
| venue_split | `…suq3vhxq2vje2y` | `SRrGio4iLmtQrb22JJhapwobNgavYsoQ52WmfT1owuY=` |
| nft_marketplace | `…h9lvhxqq8txmm` | `8TTszCmNyPZXjrzQ/fSKXX8+QzW7wFtCfdmiKsZBgFc=` |
| agents_marketplace | `…xcwvhxqgdqwsg` | `tDIcnNMbDG5E7tpb7NTeJDnT6JxKs7faN7hyCALFUWs=` |
| nft_staking | `…e7tvhxq4fgtgu` | `hXcRjpclnq0jsonSIemM17+tszcWpPjWKtCPUfnMuME=` |
| tro_staking | `…p7mvhxq9xvpwf` | `Kz0+zcj7w/3RuOl5m6dumxA9dhFOideb7jGKTam2VVA=` |
| tro_governance | `…4wcvhxq9e9euy` | `+9aNhboFyQuvteDzjkiQHdRTlXAtFyijK+iXV74UOsQ=` |
| agent_stake_escrow | `…37vvhxqndvzr3` | `Hs3AClbYzDpyZ6f/UjB9gBekiYKApXGxcVWy3mmlSnE=` |
| treasury_splitter | `…y6evhxq2nkezv` | `9pB9+UN372QxE77Nj8TUjWn6+Q6qtOPhmmXgUdLnpk8=` |
| slot_casino | — | NOT_DEPLOYED |

## Activation (ops only — GitHub Pages / Actions secrets)

Never commit `=1` into the repo. Set in **Settings → Secrets → Pages** (or env for build):

```
VITE_TRO_STAKING_CODEHASH_OK=1
VITE_MARKETPLACE_CODEHASH_OK=1
VITE_VENUE_CODEHASH_OK=1
VITE_AGENTS_CODEHASH_OK=1
VITE_NFT_STAKING_CODEHASH_OK=1
VITE_TRO_GOVERNANCE_CODEHASH_OK=1
VITE_AGENT_ESCROW_CODEHASH_OK=1
VITE_TREASURY_CODEHASH_OK=1
```

Recommended order: tro_staking → marketplace → venue → rest, after micro dust TX each.

## User flow

1. Connect xPortal (WC project allowlisted `neltud.github.io`)
2. `/staking` → tab TRO → Stake (enabled only if CODEHASH_OK)
3. TxShell overlay: preparing → signing → broadcast → success/error
