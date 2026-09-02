/**
 * Marketplace activity + listing id index (P1).
 * Static JSON: data/listings_index.json (Vellum / indexer).
 * Live fallback: recent SC txs on explorer API.
 */

import { MARKETPLACE_ADDRESS } from '../../../../packages/core/src/contracts/marketplaceAbi'

const API = 'https://api.multiversx.com'
const RAW_INDEX =
  'https://raw.githubusercontent.com/Neltud/xArtists/main/data/listings_index.json'

export type IndexedListingHint = {
  txHash: string
  timestamp?: number
  function?: string
  status?: string
  sender?: string
  listingIdHint?: number | null
}

export type CatalogListing = {
  listing_id: number
  token_id: string
  nonce: number
  price_egld: string
  seller: string
  active: boolean
  tx_list?: string
}

export type ListingsIndexFile = {
  version: number
  network: string
  updated: string | null
  marketplace_address: string | null
  codehash_ok: boolean
  listings: CatalogListing[]
  note?: string
}

function parseListingIdFromData(data?: string): number | null {
  if (!data || typeof data !== 'string') return null
  const parts = data.split('@')
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i]
    if (!p) continue
    let fn = p
    try {
      if (/^[0-9a-fA-F]+$/.test(p) && p.length % 2 === 0) {
        fn = Array.from(new Uint8Array(p.match(/.{1,2}/g)!.map(h => parseInt(h, 16))))
          .map(b => String.fromCharCode(b))
          .join('')
      }
    } catch {
      /* keep p */
    }
    if (['buyNft', 'placeBid', 'acceptBid', 'cancelListing', 'withdrawBid', 'listNft'].includes(fn)) {
      const next = parts[i + 1]
      if (next && /^[0-9a-fA-F]+$/.test(next)) {
        try {
          return parseInt(next, 16)
        } catch {
          return null
        }
      }
    }
  }
  return null
}

/** Published index (empty until deploy + indexer). */
export async function fetchListingsIndex(): Promise<ListingsIndexFile | null> {
  try {
    const res = await fetch(`${RAW_INDEX}?t=${Date.now()}`, { cache: 'no-store' })
    if (!res.ok) return null
    return (await res.json()) as ListingsIndexFile
  } catch {
    return null
  }
}

export async function fetchMarketplaceActivity(
  scAddress: string = MARKETPLACE_ADDRESS,
  size = 40
): Promise<IndexedListingHint[]> {
  try {
    const url = `${API}/accounts/${scAddress}/transactions?size=${size}&status=success`
    const res = await fetch(url)
    if (!res.ok) return []
    const rows: any[] = await res.json()
    if (!Array.isArray(rows)) return []
    return rows.map(r => {
      const fn = r.function || r.action?.name
      let listingIdHint: number | null = parseListingIdFromData(r.data)
      if (listingIdHint == null && Array.isArray(r.arguments) && r.arguments[0] != null) {
        const n = Number(r.arguments[0])
        if (!Number.isNaN(n)) listingIdHint = n
      }
      return {
        txHash: r.txHash || r.hash,
        timestamp: r.timestamp,
        function: fn,
        status: r.status,
        sender: r.sender,
        listingIdHint,
      }
    })
  } catch {
    return []
  }
}

export async function verifyScOnExplorer(scAddress: string = MARKETPLACE_ADDRESS) {
  try {
    const res = await fetch(`${API}/accounts/${scAddress}`)
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` }
    const j = await res.json()
    return {
      ok: true,
      address: scAddress,
      codeHash: j.codeHash || j.code || null,
      balance: j.balance,
      explorer: `https://explorer.multiversx.com/accounts/${scAddress}`,
    }
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : 'fail' }
  }
}
