# Apply note

Auction routes are implemented in `auction.mjs`. Wire into `server.mjs`:

1. Import auction helpers from `./auction.mjs`
2. Health: `auction_enabled: auctionConfig().enabled`, `auction_settle: false`
3. Mount block before 404 (see branch tests + `docs/AUCTION_PHYSICAL_COLLECTIBLES.md`)

If this file is present without server.mjs change, complete wire in follow-up commit.
