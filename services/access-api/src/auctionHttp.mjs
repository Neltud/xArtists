/** HTTP adapter for auction P1 — used by server.mjs tryHandleAuction. */
import {
  auctionConfig,
  createListing,
  listListings,
  getListing,
  placeBid,
  listBids,
} from './auction.mjs'

export function auctionPublicConfig(env = process.env) {
  return auctionConfig(env)
}

/**
 * @returns {Promise<boolean>} true if request was handled
 */
export async function tryHandleAuction(req, res, ctx) {
  const { path: pth, url: u, json, readRawAndBody, resolveAuthenticatedBuyer, jwtSecret } = ctx
  if (pth !== '/v1/auction' && !pth.startsWith('/v1/auction/')) return false

  if (req.method === 'GET' && pth === '/v1/auction/config') {
    json(res, 200, { ok: true, ...auctionConfig() })
    return true
  }

  if (!auctionConfig().enabled) {
    json(res, 503, { ok: false, error: 'auction_not_enabled' })
    return true
  }

  // P1 contains no durable bid ledger or settlement. Two independent
  // environment gates are required before *demo* POST mutations are allowed.
  if (req.method === 'POST' && !auctionConfig().demo_writes_enabled) {
    json(res, 503, { ok: false, error: 'auction_demo_writes_disabled' })
    return true
  }

  if (req.method === 'GET' && pth === '/v1/auction/listings') {
    const state = u.searchParams.get('state') || undefined
    json(res, 200, { ok: true, listings: listListings({ state }) })
    return true
  }

  if (req.method === 'GET' && pth.startsWith('/v1/auction/listings/')) {
    const rest = pth.slice('/v1/auction/listings/'.length).split('/').filter(Boolean)
    const id = rest[0]
    if (rest.length === 1) {
      const listing = getListing(id)
      json(res, listing ? 200 : 404, listing ? { ok: true, listing } : { ok: false, error: 'not_found' })
      return true
    }
    if (rest[1] === 'bids' && rest.length === 2) {
      json(res, 200, { ok: true, bids: listBids(id) })
      return true
    }
  }

  if (req.method === 'POST' && pth === '/v1/auction/listings') {
    const { body } = await readRawAndBody(req)
    const auth = resolveAuthenticatedBuyer({ headers: req.headers, body, jwtSecret })
    if (!auth.ok) {
      json(res, auth.statusCode, { ok: false, error: auth.error })
      return true
    }
    try {
      const listing = createListing(body, auth.buyer)
      json(res, 201, { ok: true, listing })
    } catch (e) {
      json(res, e.statusCode || 400, {
        ok: false,
        error: e.message,
        min_cents: e.min_cents,
        state: e.state,
      })
    }
    return true
  }

  if (req.method === 'POST' && /^\/v1\/auction\/listings\/[^/]+\/bids$/.test(pth)) {
    const id = pth.split('/')[4]
    const { body } = await readRawAndBody(req)
    const auth = resolveAuthenticatedBuyer({ headers: req.headers, body, jwtSecret })
    if (!auth.ok) {
      json(res, auth.statusCode, { ok: false, error: auth.error })
      return true
    }
    try {
      const out = placeBid(id, auth.buyer, Number(body.amount_cents))
      json(res, 201, { ok: true, ...out })
    } catch (e) {
      json(res, e.statusCode || 400, {
        ok: false,
        error: e.message,
        min_cents: e.min_cents,
        state: e.state,
      })
    }
    return true
  }

  json(res, 404, { ok: false, error: 'auction_route_not_found' })
  return true
}
