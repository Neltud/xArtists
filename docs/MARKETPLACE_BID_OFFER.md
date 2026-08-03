# Marketplace — Bid vs Offer

| Action | On-chain endpoint | Status |
|--------|-------------------|--------|
| **List / Sell** | `listNft` | Live (code) |
| **Buy** | `buyNft` | Live (code) |
| **Cancel** | `cancelListing` | Live (code) |
| **Bid** | `placeBid` / `acceptBid` / `withdrawBid` | **Implemented in SC** (needs redeploy) |
| **Offer** | — | **No endpoint** — not the same as Bid |

## Clarification

- **Bid** = escrow EGLD against an **existing listing** (auction-style highest bid).
- **Offer** = free-form price to owner **without** a listing. **Not supported** on the SC (no escrow without listing). UI may show “Offer” as disabled / “use Bid on a listing”.

## Bid flow

1. Seller `listNft`
2. Bidder `placeBid(listing_id)` + EGLD ≥ min (listing price or higher than current bid)
3. Seller `acceptBid(listing_id)` → NFT to bidder, payout seller/royalty/fee
4. Or bidder `withdrawBid` if not accepted (and not highest after outbid — previous bid refunded on outbid)

After deploy: set `VITE_MARKETPLACE_ADDRESS` and rebuild Pages.
