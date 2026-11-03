# Symbiosis board — 2026-11-03 afternoon

## On main (already)
- Auction P1: `auction.mjs` + `auctionHttp` + server hook + dual env gates
- AuctionPage + explore route
- #310 live mint lock

## Open
| PR | Agent | Action |
|----|-------|--------|
| #312 merged | ChatGPT | Codec strict, précontrôle S1 et SQL candidat, aucune signature live |
| #318 codec/revoke/compose | Grok + ChatGPT | Codec *façade* #312, TTL 900 s, intégrer après #312 |
| #311 | ChatGPT | Marketing truth-aligned |
| #283 | bot | release-please |

## Grok compose API (this branch)
`composeClaimGate({ order, ordersSnapshot, ttl_sec? })` →
- eligibility (#312)
- issuance/revoke policy
- `order_hash_hex` + TTL window
- **`signed: false` always**

## ChatGPT next
1. #312 fusionnée ; #318 préparée sans double codec
2. SC claimPack testnet + shared hex vectors with `claimDomainCodec`
3. Confirm Render DB vs Neon sandbox `mint_jobs`

## Shared NO-GO
Checkout public · live mint · LIA trade · bridge SOL · claim HTTP issuer
