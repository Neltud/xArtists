/**
 * Market SC account payable probe (public API).
 * If isPayable=false, EGLD buyNft will VM-fail until upgrade.
 */

const API = 'https://api.multiversx.com'

export type MarketPayableStatus = {
  address: string
  isPayable: boolean | null
  isPayableBySmartContract: boolean | null
  codeHash: string | null
  error?: string
}

export async function fetchMarketPayable(address: string): Promise<MarketPayableStatus> {
  try {
    const r = await fetch(`${API}/accounts/${address}`, { cache: 'no-store' })
    if (!r.ok) {
      return {
        address,
        isPayable: null,
        isPayableBySmartContract: null,
        codeHash: null,
        error: `http_${r.status}`,
      }
    }
    const j = (await r.json()) as {
      isPayable?: boolean
      isPayableBySmartContract?: boolean
      codeHash?: string
    }
    return {
      address,
      isPayable: typeof j.isPayable === 'boolean' ? j.isPayable : null,
      isPayableBySmartContract:
        typeof j.isPayableBySmartContract === 'boolean' ? j.isPayableBySmartContract : null,
      codeHash: j.codeHash || null,
    }
  } catch (e) {
    return {
      address,
      isPayable: null,
      isPayableBySmartContract: null,
      codeHash: null,
      error: e instanceof Error ? e.message : 'fetch_failed',
    }
  }
}
