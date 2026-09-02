import { useState, useEffect, useCallback, useRef } from 'react'

const MVX_API = 'https://api.multiversx.com'
const WALLET = 'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6'
const EGLD_USDC_PAIR = 'EGLDUSDC-594e5e'
/** Cap network chatter — N+1 /tokens/{id} was killing TTI on Portfolio/Dashboard */
const MAX_TOKEN_PAGES = 2
const TOKEN_PAGE_SIZE = 100
const MAX_NFT_PAGES = 2
const NFT_PAGE_SIZE = 50
const POLL_MS = 90_000

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

async function fetchEgldPrice(): Promise<number> {
  try {
    const res = await fetch(`${MVX_API}/mex/pairs/${EGLD_USDC_PAIR}`)
    if (res.ok) {
      const j = await res.json()
      if (j?.basePrice && j.basePrice > 0) return Number(j.basePrice)
    }
  } catch {
    /* fall through */
  }
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

/** Use only prices already on the account-token payload — no per-token follow-up. */
async function fetchAllTokens(): Promise<PortfolioToken[]> {
  const results: PortfolioToken[] = []
  let from = 0

  for (let page = 0; page < MAX_TOKEN_PAGES; page++) {
    const res = await fetch(
      `${MVX_API}/accounts/${WALLET}/tokens?size=${TOKEN_PAGE_SIZE}&from=${from}`
    )
    if (!res.ok) break
    const batch: any[] = await res.json()
    if (!batch.length) break

    for (const t of batch) {
      const decimals = t.decimals ?? 18
      const balance = Number(t.balance ?? 0) / Math.pow(10, decimals)
      if (balance <= 0) continue
      const ticker = t.ticker || (t.identifier ? String(t.identifier).split('-')[0] : '')
      const price = Number(t.price ?? 0)
      results.push({
        identifier: t.identifier || ticker,
        name: t.name || ticker,
        ticker,
        balance,
        decimals,
        price,
        valueUsd: balance * price,
      })
    }

    if (batch.length < TOKEN_PAGE_SIZE) break
    from += TOKEN_PAGE_SIZE
  }

  return results.sort((a, b) => b.valueUsd - a.valueUsd)
}

async function fetchAllNfts(): Promise<PortfolioNft[]> {
  const results: PortfolioNft[] = []
  let from = 0

  for (let page = 0; page < MAX_NFT_PAGES; page++) {
    const res = await fetch(
      `${MVX_API}/accounts/${WALLET}/nfts?size=${NFT_PAGE_SIZE}&from=${from}`
    )
    if (!res.ok) break
    const batch: any[] = await res.json()
    if (!batch.length) break

    for (const n of batch) {
      const decimals = n.decimals ?? 0
      const balance = n.balance ? Number(n.balance) / Math.pow(10, decimals) : 1
      const price = Number(n.price ?? 0)
      const valueUsd = Number(n.valueUsd ?? balance * price)
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

    if (batch.length < NFT_PAGE_SIZE) break
    from += NFT_PAGE_SIZE
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
  const busy = useRef(false)

  const fetchAll = useCallback(async () => {
    if (busy.current) return
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
    busy.current = true
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

      const [allTokens, allNfts] = await Promise.all([fetchAllTokens(), fetchAllNfts()])
      setTokens(allTokens)
      setNfts(allNfts)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
      busy.current = false
    }
  }, [])

  useEffect(() => {
    fetchAll()
    const id = setInterval(fetchAll, POLL_MS)
    const onVis = () => {
      if (document.visibilityState === 'visible') fetchAll()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
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
