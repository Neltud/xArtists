# Symbiosis board — 2026-11-03 afternoon

## On main (already)
- Auction P1: `auction.mjs` + `auctionHttp` + server hook + dual env gates
- AuctionPage + explore route
- #310 live mint lock

## Open
| PR | Agent | Action |
|----|-------|--------|
| #312 draft | ChatGPT | Merge when human OK — claim eligibility phase 0 |
| codec/revoke/compose branch | Grok | Merge **after** #312 (base is claim branch) |
| #311 | ChatGPT | Marketing truth-aligned |
| #283 | bot | release-please |

## Grok compose API (this branch)
`composeClaimGate({ order, ordersSnapshot, ttl_sec? })` →
- eligibility (#312)
- issuance/revoke policy
- `order_hash_hex` + TTL window
- **`signed: false` always**

## ChatGPT next
1. Merge #312
2. SC claimPack testnet + shared hex vectors with `claimDomainCodec`
3. Confirm Render DB vs Neon sandbox `mint_jobs`

## Shared NO-GO
Checkout public · live mint · LIA trade · bridge SOL · claim HTTP issuer
