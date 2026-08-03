/**
 * Index recent marketplace-related txs from MultiversX API.
 * Not a full on-chain listing store — best-effort until SC view pagination.
 */

import { MARKETPLACE_ADDRESS } from '../../../../packages/core/src/contracts/marketplaceAbi'

const API = 'https://api.multiversx.com'

export type IndexedListingHint = {
  txHash: string
  timestamp?: number
  function?: string
  status?: string
  sender?: string
}

export async function fetchMarketplaceActivity(
  scAddress: string = MARKETPLACE_ADDRESS,
  size = 25
): Promise<IndexedListingHint[]> {
  try {
    const url = `${API}/accounts/${scAddress}/transactions?size=${size}&status=success`
    const res = await fetch(url)
    if (!res.ok) return []
    const rows: any[] = await res.json()
    if (!Array.isArray(rows)) return []
    return rows.map(r => ({
      txHash: r.txHash || r.hash,
      timestamp: r.timestamp,
      function: r.function || r.action?.name,
      status: r.status,
      sender: r.sender,
    }))
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
      code: j.code || j.codeHash || null,
      balance: j.balance,
      explorer: `https://explorer.multiversx.com/accounts/${scAddress}`,
    }
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : 'fail' }
  }
}
