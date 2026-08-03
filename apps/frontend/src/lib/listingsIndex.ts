/**
 * Marketplace activity + best-effort listing id hints from recent SC txs.
 */

import { MARKETPLACE_ADDRESS } from '../../../../packages/core/src/contracts/marketplaceAbi'

const API = 'https://api.multiversx.com'

export type IndexedListingHint = {
  txHash: string
  timestamp?: number
  function?: string
  status?: string
  sender?: string
  /** Parsed from data hex when possible */
  listingIdHint?: number | null
}

function parseListingIdFromData(data?: string): number | null {
  if (!data || typeof data !== 'string') return null
  // common: function@hexId or ESDTNFTTransfer@...@listNft@...
  const parts = data.split('@')
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i]
    if (!p) continue
    const fn = Buffer.from(p, 'hex').toString('utf8')
    if (['buyNft', 'placeBid', 'acceptBid', 'cancelListing', 'withdrawBid'].includes(fn)) {
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
  // sometimes function name is plain in API `function` field only
  return null
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
      // API may expose arguments
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
