import { useState, useEffect, useCallback } from 'react'

const MVX_API = 'https://api.multiversx.com'
const WALLET = 'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6'
const EGLD_USDC_PAIR = 'EGLDUSDC-594e5e'

export interface PortfolioToken {
  identifier: string
  name: string
  ticker: string
  balance: number
  decimals: number
  price: number
  valueUsd: number
}

export interface PortfolioNft {
  identifier: string
  name: string
  collection: string
  nonce: number
  type: string
  ticker: string
  balance: number
  decimals: number
  price: number
  valueUsd: number
  mediaUrl?: string
}

export interface PortfolioValue {
  egldBalance: number
  egldPrice: number
  egldValueUsd: number
  tokens: PortfolioToken[]
  nfts: PortfolioNft[]
  totalUsd: number
  tokensValueUsd: number
  nftsValueUsd: number
  loading: boolean
  error: string | null
  refresh: () => void
}

/**
 * Fetch EGLD price from the EGLD/USDC MEX pair (basePrice), with a fallback
 * to the /economics endpoint price.
 */
async function fetchEgldPrice(): Promise<number> {
  // 1. Try the single-pair endpoint as specified.
  try {
    const res = await fetch(`${MVX_API}/mex/pairs/${EGLD_USDC_PAIR}`)
    if (res.ok) {
      const j = await res.json()
      if (j?.basePrice && j.basePrice > 0) return Number(j.basePrice)
    }
  } catch {
    /* fall through */
  }

  // 2. Fallback: list all pairs and find ours by id.
  try {
    const res = await fetch(`${MVX_API}/mex/pairs`)
    if (res.ok) {
      const pairs: any[] = await res.json()
      const pair = pairs.find(p => p?.id === EGLD_USDC_PAIR)
      if (pair?.basePrice && pair.basePrice > 0) return Number(pair.basePrice)
    }
  } catch {
    /* fall through */
  }

  // 3. Last resort: /economics price.
  try {
    const res = await fetch(`${MVX_API}/economics`)
    if (res.ok) {
      const j = await res.json()
      return Number(j?.price ?? 0)
    }
  } catch {
    /* ignore */
  }

  return 0
}

async function fetchAllTokens(egldPrice: number): Promise<PortfolioToken[]> {
  const results: PortfolioToken[] = []
  let from = 0
  const size = 250

  while (true) {
    const res = await fetch(`${MVX_API}/accounts/${WALLET}/tokens?size=${size}&from=${from}`)
    if (!res.ok) break
    const batch: any[] = await res.json()
    if (!batch.length) break

    for (const t of batch) {
      const decimals = t.decimals ?? 18
      const balance = Number(t.balance ?? 0) / Math.pow(10, decimals)
      if (balance <= 0) continue
      const ticker = t.ticker || (t.identifier ? t.identifier.split('-')[0] : '')
      const name = t.name || ticker

      let price = t.price ?? 0
      // For tokens without a price in the account-token listing, fetch the
      // token definition which exposes a `price` field.
      if (!price || price <= 0) {
        try {
          const tRes = await fetch(`${MVX_API}/tokens/${t.identifier}`)
          if (tRes.ok) {
            const tDef = await tRes.json()
            price = tDef?.price ?? 0
          }
        } catch {
          /* keep price = 0 */
        }
      }

      results.push({
        identifier: t.identifier || ticker,
        name,
        ticker,
        balance,
        decimals,
        price,
        valueUsd: balance * price,
      })
    }

    if (batch.length < size) break
    from += size
  }

  return results.sort((a, b) => b.valueUsd - a.valueUsd)
}

async function fetchAllNfts(): Promise<PortfolioNft[]> {
  const results: PortfolioNft[] = []
  let from = 0
  const size = 100

  while (true) {
    const res = await fetch(`${MVX_API}/accounts/${WALLET}/nfts?size=${size}&from=${from}`)
    if (!res.ok) break
    const batch: any[] = await res.json()
    if (!batch.length) break

    for (const n of batch) {
      const decimals = n.decimals ?? 0
      const balance = n.balance ? Number(n.balance) / Math.pow(10, decimals) : 1
      const price = n.price ?? 0
      const valueUsd = n.valueUsd ?? balance * price
      results.push({
        identifier: n.identifier || `${n.collection}-${n.nonce}`,
        name: n.name || n.collection || '',
        collection: n.collection || '',
        nonce: n.nonce ?? 0,
        type: n.type || 'NonFungibleESDT',
        ticker: n.ticker || '',
        balance,
        decimals,
        price,
        valueUsd,
        mediaUrl: n.assets?.pngUrl || n.assets?.url,
      })
    }

    if (batch.length < size) break
    from += size
  }

  return results.sort((a, b) => b.valueUsd - a.valueUsd)
}

export function usePortfolioValue(): PortfolioValue {
  const [egldBalance, setEgldBalance] = useState(0)
  const [egldPrice, setEgldPrice] = useState(0)
  const [tokens, setTokens] = useState<PortfolioToken[]>([])
  const [nfts, setNfts] = useState<PortfolioNft[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [accountRes, price] = await Promise.all([
        fetch(`${MVX_API}/accounts/${WALLET}`).then(r => r.json()),
        fetchEgldPrice(),
      ])

      const egld = Number(accountRes.balance ?? 0) / 1e18
      setEgldBalance(egld)
      setEgldPrice(price)

      const [allTokens, allNfts] = await Promise.all([
        fetchAllTokens(price),
        fetchAllNfts(),
      ])

      setTokens(allTokens)
      setNfts(allNfts)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
    const id = setInterval(fetchAll, 60_000)
    return () => clearInterval(id)
  }, [fetchAll])

  const egldValueUsd = egldBalance * egldPrice
  const tokensValueUsd = tokens.reduce((s, t) => s + t.valueUsd, 0)
  const nftsValueUsd = nfts.reduce((s, n) => s + n.valueUsd, 0)
  const totalUsd = egldValueUsd + tokensValueUsd + nftsValueUsd

  return {
    egldBalance,
    egldPrice,
    egldValueUsd,
    tokens,
    nfts,
    totalUsd,
    tokensValueUsd,
    nftsValueUsd,
    loading,
    error,
    refresh: fetchAll,
  }
}
