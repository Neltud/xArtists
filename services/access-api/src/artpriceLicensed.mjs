/**
 * Artprice by Artmarket.com — OFFICIAL DATA LICENSING BOUNDARY (2026-11-10).
 *
 * Artprice's published terms prohibit automated extraction and AI/TDM
 * processing without prior express written permission. The indexed-artist
 * B2B API and auction/price datasets have separate licensing scopes.
 *
 * No credentials, third-party Artprice endpoint, paid price, artist index,
 * CSV import, scraping, cache, training data, image or valuation is present.
 * Not a licensed partnership and not an Artprice endorsement of xArtists.
 */
export const ARTPRICE_SOURCE = Object.freeze({
  provider: 'Artprice by Artmarket.com',
  official_site: 'https://fr.artprice.com/',
  terms: 'https://fr.artprice.com/block/cgv?modal=true',
  contemporary_report_2026: 'https://fr.artprice.com/artprice-reports/le-marche-de-lart-contemporain-2026',
  market_report_2025:
    'https://fr.artprice.com/artprice-news/13751/le-rapport-mondial-du-marche-de-l-art-2025-par-artprice-la-reprise-tant-attendue-semble-avoir-commence',
})

/** Neither process.env nor query parameters can certify a data license. */
export function artpriceReadiness() {
  return {
    ok: true,
    provider: ARTPRICE_SOURCE.provider,
    integration: 'pending_written_license',
    access: 'no_licensed_data',
    licensed: false,
    records_available: false,
    record_count: 0,
    scraped: false,
    auto_import: false,
    artprice_partner: false,
    data: [],
    official_source: ARTPRICE_SOURCE.official_site,
    official_report: ARTPRICE_SOURCE.contemporary_report_2026,
    official_report_2025: ARTPRICE_SOURCE.market_report_2025,
    authorization_required: 'signed_artprice_data_license_with_explicit_api_and_redistribution_scope',
    disclaimer: 'Market report link only. No official Artprice price, auction result, appraisal or resale license is claimed.',
  }
}

/**
 * PRIVATE FORMAT-ONLY preparatory validation of a future licensed export.
 * Never exposed through the HTTP API, never authenticates a grant, and never
 * fetches or stores source records. A future dedicated adapter must validate
 * written contract scope with the issuer before calling this function.
 */
export function validatePotentialArtpriceRecord(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const str = (v, max) => typeof v === 'string' && v.length > 0 && v.length <= max ? v.trim() : ''
  const artist = str(raw.artist, 180)
  const sourceRecordId = str(raw.source_record_id, 128)
  const auctionDate = str(raw.auction_date, 10)
  const currency = str(raw.currency, 3)
  if (!artist || !sourceRecordId || !/^\d{4}-\d{2}-\d{2}$/.test(auctionDate) ||
      !['EUR', 'USD', 'GBP', 'CHF'].includes(currency)) return null
  const amount = Number(raw.hammer_price)
  if (!Number.isFinite(amount) || amount < 0 || amount > 1e12) return null
  // Source method must be explicitly stated to avoid comparing hammer
  // results with estimates, premium-inclusive figures, NFT asks, or fiat.
  if (raw.price_basis !== 'hammer_excluding_fees') return null
  return Object.freeze({
    source: 'Artprice by Artmarket.com',
    source_record_id: sourceRecordId,
    artist,
    auction_date: auctionDate,
    currency,
    hammer_price: amount,
    price_basis: 'hammer_excluding_fees',
  })
}
