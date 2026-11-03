# Auction P1 implementation (feat/auction-p1-api-ui)

## Delivered

| Piece | Path |
|-------|------|
| Schema candidate | `services/access-api/migrations/candidate_auction_p1.sql` |
| Domain logic | `services/access-api/src/auction.mjs` |
| Tests | `services/access-api/tests/auction.test.mjs` |
| UI shell | `apps/frontend/src/pages/AuctionPage.tsx` |
| Route module | `/explore/auction` aliases `/auction`, `/encheres` |

## Flags

```env
AUCTION_ENABLED=0   # default — keep off in prod until recette
```

## API (when enabled)

- `GET /v1/auction/config` — always reachable when server includes routes (or 503 body)
- `GET /v1/auction/listings`
- `GET /v1/auction/listings/:id`
- `GET /v1/auction/listings/:id/bids`
- `POST /v1/auction/listings` — SIWX/JWT seller
- `POST /v1/auction/listings/:id/bids` — SIWX/JWT bidder

No settle checkout, no payout, no NFT transfer in P1 code.

## Storage

In-memory map for enablement testing. Postgres tables = candidate migration only.

## Next

1. Finish `server.mjs` mount if not in same PR
2. Persist to Postgres when `DATABASE_URL` + enabled
3. PayBox settle for winner (path B pattern)
4. Hook physical ladder post-paid for `physical`/`hybrid`
