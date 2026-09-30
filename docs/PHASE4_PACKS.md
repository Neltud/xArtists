# Phase 4 — Agent IA mint + revenue splitter

## Status

| Piece | State |
|-------|--------|
| Paper mint (local ownership) | **LIVE** — `/agents` · PackCheckout |
| `agents_marketplace` address | mainnet in `contracts.json` |
| On-chain mint TX | Gated `VITE_AGENTS_CODEHASH_OK` + ABI confirm |
| `treasury_splitter` | Address LIVE · ratios paper until CODEHASH |
| `Phase4ReadinessBanner` | Mounted on `/agents` |

## Split (paper + future SC)

| Destination | BPS |
|-------------|-----|
| Artists / creators | 4500 |
| Protocol / LIA ops | 2500 |
| Treasury DAO | 1500 |
| Pack signal pool | 1000 |
| Burn / buyback buffer | 500 |

Pack pool internal weights: Pulse 40% · Yield 35% · Sentinel 25% (`shareOfPackPoolBps`).

## Ops secrets (Pages only — never commit `=1`)

```
VITE_AGENTS_CODEHASH_OK=1
VITE_TREASURY_CODEHASH_OK=1
```

Optional:

```
VITE_AGENT_PACK_COLLECTIONS=TICKER-xxxxxx
VITE_AGENTS_MARKETPLACE_ADDRESS=erd1...
```

## On-chain mint caution

`useAgentPackTx.mintOnChain` sends provisional `buyPack@0x0N` to agents marketplace.
**Verify endpoint name + args against deployed bytecode before enabling CODEHASH for public users.**
Until then: paper checkout only.

## User flow

1. `/agents` → select Pulse/Yield/Sentinel
2. PackCheckout → terms → paper (or Stripe/Paybox if configured)
3. `markPackOwned` → theater → `/my-packs` → room
4. Command Center gate via `hasAgentAccess`
