/**
 * Auction P1 — English lots (physical / digital_nft / hybrid).
 * Default OFF. No automatic payout, NFT transfer, or PayBox session in this module yet.
 */
import crypto from 'node:crypto'

const TYPES = new Set(['physical', 'digital_nft', 'hybrid'])
const ERD = /^erd1[a-z0-9]{58}$/

export function auctionConfig(env = process.env) {
  const enabled = String(env.AUCTION_ENABLED || '').trim() === '1'
  // The P1 implementation is *always* volatile in-memory storage, even when
  // DATABASE_URL is present. Demo bids must never be marketed as real offers.
  // Two independent explicit switches plus isolated PSP/mint state are needed
  // to test POST routes on a sandbox, not a public production service.
  const sandbox = String(env.AUCTION_ENV || '').trim() === 'sandbox'
  const paymentMode = String(env.PAYBOX_MODE || env.PAYBOX_ENV || '').trim().toLowerCase()
  const demoWritesEnabled = enabled && sandbox &&
    String(env.AUCTION_DEMO_WRITES_ENABLED || '').trim() === '1' &&
    !['prod', 'production'].includes(paymentMode) &&
    String(env.PAYBOX_CHECKOUT_ENABLED || '') !== '1' &&
    String(env.MINT_LIVE_ENABLED || '') !== '1' &&
    String(env.LIA_LIVE_TRADING || '') !== '1'
  return {
    enabled,
    demo_only: true,
    demo_writes_enabled: demoWritesEnabled,
    storage: 'volatile_memory',
    persistent: false,
    currency: 'EUR',
    min_increment_cents: 1000,
    settle_checkout: false, // P1.1 — not wired
    automatic_payout: false,
    automatic_nft_transfer: false,
  }
}

/** @type {Map<string, object>} */
const memListings = new Map()
/** @type {Map<string, object[]>} */
const memBids = new Map()

function newId(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`
}

function publicListing(row) {
  if (!row) return null
  return {
    id: row.id,
    seller_address: row.seller_address,
    listing_type: row.listing_type,
    title: row.title,
    description: row.description || null,
    condition_sha256: row.condition_sha256 || null,
    nft_identifier: row.nft_identifier || null,
    start_bid_cents: row.start_bid_cents,
    reserve_cents: row.reserve_cents ?? null,
    bid_increment_cents: row.bid_increment_cents,
    currency: row.currency || 'EUR',
    start_at: row.start_at,
    end_at: row.end_at,
    state: deriveState(row),
    high_bid_cents: row.high_bid_cents ?? null,
    high_bidder: row.high_bidder || null,
    winner_address: row.winner_address || null,
  }
}

function deriveState(row) {
  const now = Date.now()
  const start = Date.parse(row.start_at)
  const end = Date.parse(row.end_at)
  if (row.state === 'cancelled' || row.state === 'completed' || row.state === 'draft') return row.state
  if (Number.isFinite(start) && now < start) return 'published'
  if (Number.isFinite(end) && now >= end) {
    if (row.high_bid_cents != null && (row.reserve_cents == null || row.high_bid_cents >= row.reserve_cents)) {
      return 'ended'
    }
    return 'ended_no_sale'
  }
  if (Number.isFinite(start) && now >= start) return 'live'
  return row.state || 'draft'
}

export function createListing(body, sellerAddress) {
  if (!ERD.test(sellerAddress)) {
    throw Object.assign(new Error('invalid_seller'), { statusCode: 400 })
  }
  const listing_type = String(body.listing_type || '').trim()
  if (!TYPES.has(listing_type)) {
    throw Object.assign(new Error('invalid_listing_type'), { statusCode: 400 })
  }
  const title = String(body.title || '').trim().slice(0, 200)
  if (title.length < 3) {
    throw Object.assign(new Error('title_required'), { statusCode: 400 })
  }
  const start_bid_cents = Number(body.start_bid_cents)
  if (!Number.isInteger(start_bid_cents) || start_bid_cents < 100) {
    throw Object.assign(new Error('invalid_start_bid'), { statusCode: 400 })
  }
  const reserve_cents =
    body.reserve_cents == null || body.reserve_cents === ''
      ? null
      : Number(body.reserve_cents)
  if (reserve_cents != null && (!Number.isInteger(reserve_cents) || reserve_cents < start_bid_cents)) {
    throw Object.assign(new Error('invalid_reserve'), { statusCode: 400 })
  }
  const start_at = body.start_at ? new Date(body.start_at).toISOString() : new Date().toISOString()
  const end_at = body.end_at
    ? new Date(body.end_at).toISOString()
    : new Date(Date.now() + 7 * 864e5).toISOString()
  if (!(Date.parse(end_at) > Date.parse(start_at))) {
    throw Object.assign(new Error('invalid_auction_window'), { statusCode: 400 })
  }
  const row = {
    id: newId('auc'),
    seller_address: sellerAddress,
    listing_type,
    title,
    description: String(body.description || '').slice(0, 4000),
    condition_sha256: body.condition_sha256 ? String(body.condition_sha256).slice(0, 64) : null,
    nft_identifier: body.nft_identifier ? String(body.nft_identifier).slice(0, 128) : null,
    start_bid_cents,
    reserve_cents,
    bid_increment_cents: Number(body.bid_increment_cents) > 0 ? Number(body.bid_increment_cents) : 1000,
    currency: 'EUR',
    start_at,
    end_at,
    state: 'published',
    high_bid_cents: null,
    high_bidder: null,
    winner_address: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  memListings.set(row.id, row)
  memBids.set(row.id, [])
  return publicListing(row)
}

export function listListings({ state } = {}) {
  const all = [...memListings.values()].map(publicListing)
  if (!state) return all.sort((a, b) => String(b.end_at).localeCompare(String(a.end_at)))
  return all.filter((l) => l.state === state)
}

export function getListing(id) {
  return publicListing(memListings.get(id))
}

export function placeBid(listingId, bidder, amount_cents) {
  if (!ERD.test(bidder)) {
    throw Object.assign(new Error('invalid_bidder'), { statusCode: 400 })
  }
  if (!Number.isInteger(amount_cents) || amount_cents <= 0) {
    throw Object.assign(new Error('invalid_bid_amount'), { statusCode: 400 })
  }
  const row = memListings.get(listingId)
  if (!row) throw Object.assign(new Error('listing_not_found'), { statusCode: 404 })
  const state = deriveState(row)
  if (state !== 'live') {
    throw Object.assign(new Error('auction_not_live'), { statusCode: 409, state })
  }
  if (bidder === row.seller_address) {
    throw Object.assign(new Error('seller_cannot_bid'), { statusCode: 403 })
  }
  const minNext =
    row.high_bid_cents != null
      ? row.high_bid_cents + row.bid_increment_cents
      : row.start_bid_cents
  if (amount_cents < minNext) {
    throw Object.assign(new Error('bid_too_low'), { statusCode: 400, min_cents: minNext })
  }
  const bid = {
    id: newId('bid'),
    listing_id: listingId,
    bidder_address: bidder,
    amount_cents,
    created_at: new Date().toISOString(),
  }
  const bids = memBids.get(listingId) || []
  bids.push(bid)
  memBids.set(listingId, bids)
  row.high_bid_cents = amount_cents
  row.high_bidder = bidder
  row.updated_at = new Date().toISOString()
  return { listing: publicListing(row), bid }
}

export function listBids(listingId) {
  return [...(memBids.get(listingId) || [])].reverse()
}

/** Test helper */
export function _resetAuctionMemory() {
  memListings.clear()
  memBids.clear()
}
