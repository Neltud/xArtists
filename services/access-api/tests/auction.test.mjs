import test from 'node:test'
import assert from 'node:assert/strict'
import {
  auctionConfig,
  createListing,
  placeBid,
  getListing,
  listListings,
  _resetAuctionMemory,
} from '../src/auction.mjs'

const SELLER = 'erd1kex0pvp9dng8j76sgsejkyx86nhxuqk24my6wnha8dga9mymvhxqvl8v0g'
const BIDDER = 'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6'

test('auction disabled by default', () => {
  assert.equal(auctionConfig({}).enabled, false)
  assert.equal(auctionConfig({ AUCTION_ENABLED: '1' }).enabled, true)
  assert.equal(auctionConfig({ AUCTION_ENABLED: '1' }).automatic_payout, false)
})

test('create listing and bid ladder', () => {
  _resetAuctionMemory()
  const listing = createListing(
    {
      listing_type: 'physical',
      title: 'Étude au fusain',
      start_bid_cents: 5000,
      start_at: new Date(Date.now() - 60_000).toISOString(),
      end_at: new Date(Date.now() + 3600_000).toISOString(),
    },
    SELLER,
  )
  assert.equal(listing.state, 'live')
  assert.equal(getListing(listing.id).title, 'Étude au fusain')
  assert.equal(listListings().length, 1)

  assert.throws(() => placeBid(listing.id, SELLER, 6000), /seller_cannot_bid/)
  assert.throws(() => placeBid(listing.id, BIDDER, 4000), /bid_too_low/)

  const { bid, listing: after } = placeBid(listing.id, BIDDER, 6000)
  assert.equal(bid.amount_cents, 6000)
  assert.equal(after.high_bidder, BIDDER)
  assert.equal(after.high_bid_cents, 6000)
})

test('rejects bid when not live', () => {
  _resetAuctionMemory()
  const listing = createListing(
    {
      listing_type: 'digital_nft',
      title: 'Genesis study',
      start_bid_cents: 1000,
      start_at: new Date(Date.now() + 864e5).toISOString(),
      end_at: new Date(Date.now() + 2 * 864e5).toISOString(),
    },
    SELLER,
  )
  assert.equal(listing.state, 'published')
  assert.throws(() => placeBid(listing.id, BIDDER, 2000), /auction_not_live/)
})
