/**
 * Resolve listing_id for an NFT from published listings_index.json.
 * Removes manual ID when indexer has catalogued the listing.
 */
import { fetchListingsIndex, type CatalogListing } from './listingsIndex'

export async function resolveListingIdForNft(
  collection: string,
  nonce: number
): Promise<{ listingId: number; priceEgld?: string; listing: CatalogListing } | null> {
  const idx = await fetchListingsIndex()
  if (!idx?.listings?.length) return null
  const hit = idx.listings.find(
    l =>
      l.active !== false &&
      l.token_id === collection &&
      Number(l.nonce) === Number(nonce)
  )
  if (!hit) return null
  return {
    listingId: hit.listing_id,
    priceEgld: hit.price_egld,
    listing: hit,
  }
}
