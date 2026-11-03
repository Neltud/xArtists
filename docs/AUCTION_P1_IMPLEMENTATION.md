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

## Safety addendum (3 Nov 2026)

The API is mounted in `server.mjs`, but auctions are **demo-only**.
`auctionConfig` now correctly reports `storage=volatile_memory`,
`persistent=false` even when `DATABASE_URL` is configured.
Bids disappear after restart. They are not binding, paid, settled, or
proof of artwork/NFT ownership. The SQL schema stays *candidate only*.

Default: `AUCTION_ENABLED=0`, `AUCTION_DEMO_WRITES_ENABLED=0`.
`AUCTION_ENABLED=1` opens **read endpoints only**: demo POST returns
503 `auction_demo_writes_disabled`. To test POST in a *separate*
sandbox, explicitly set `AUCTION_ENV=sandbox`,
`AUCTION_DEMO_WRITES_ENABLED=1`, `PAYBOX_ENV=preprod`,
`PAYBOX_CHECKOUT_ENABLED=0`, `MINT_LIVE_ENABLED=0`,
`LIA_LIVE_TRADING=0`. Never enable those demo-write flags in public
production. PayBox production mode blocks writes.

Run `node --test services/access-api/tests/auction.test.mjs
services/access-api/tests/auctionHttp.test.mjs` plus existing API and
frontend CI. Check that `/health` exposes `auction_enabled`,
`auction_demo_writes_enabled` and `auction_settle=false`.
A sandbox offer does not select a payable winner.

Before a commercial pilot: implement durable Postgres bids with
concurrency/idempotency, independent seller ownership validation,
auction settlement and refund/dispute handling, then a *separate*
post-paid B-style voucher for the exact RWA/NFT item, with S2 receipts.
Keep checkout, payouts, transfer and mainnet mint disabled pending GO.
