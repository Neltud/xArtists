import { useState, useEffect, useCallback } from 'react'

const MVX_API = 'https://api.multiversx.com'
const WALLET = 'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6'
const HATOM_API = 'https://mainnet-api.hatom.com'

/** Token tickers known to be issued by Hatom (H-prefix supply tokens). */
const HATOM_TICKERS = new Set([
  'HEGLD', 'HUSDC', 'HUSDT', 'HWBTC', 'HMEX', 'HWTAO',
  'HBUSD', 'HSEGLD', 'HUSD', 'HWETH', 'HHTM', 'HUTCHR',
])

/** Identifiers (prefix) known to be xExchange LP or Farm MetaESDTs. */
const XEXCHANGE_LP_PREFIXES = [
  'EGLDMEX', 'WEGLDUSDC', 'WEGLDUSDT', 'EGLDWBTC', 'EGLDWTAO',
  'TROEGLD', 'TROWEGLD', 'TROUSDC',
]

export interface WalletToken {
  identifier: string
  name: string
  ticker: string
  balance: number
  decimals: number
  price: number
  valueUsd: number
  type: string
  category: 'hatom' | 'lp' | 'farm' | 'esdt'
}

export interface HatomMarket {
  label: string
  identifier: string
  supplied: number
  borrowed: number
  valueSuppliedUsd: number
  valueBorrowedUsd: number
  rewardsHtm: number
}

export interface HatomPosition {
  healthFactor: number
  totalSuppliedUsd: number
  totalBorrowedUsd: number
  netValueUsd: number
  markets: HatomMarket[]
  claimableHtm: number
  claimableHtmUsd: number
  source: 'api' | 'wallet'
}

export interface WalletData {
  egldBalance: number
  egldValueUsd: number
  tokens: WalletToken[]
  hatomTokens: WalletToken[]
  lpTokens: WalletToken[]
  farmTokens: WalletToken[]
  standardTokens: WalletToken[]
  totalEsdtUsd: number
  hatomPosition: HatomPosition | null
  loading: boolean
  error: string | null
  refresh: () => void
}

function categoriseToken(ticker: string, tokenName: string, identifier: string): WalletToken['category'] {
  const upperTicker = ticker.toUpperCase()
  const upperName = tokenName.toUpperCase()

  if (HATOM_TICKERS.has(upperTicker) || upperName.includes('HATOM') || upperName.startsWith('H') && upperTicker.startsWith('H')) {
    return 'hatom'
  }
  if (
    XEXCHANGE_LP_PREFIXES.some(p => upperTicker.startsWith(p)) ||
    upperName.includes(' LP') ||
    upperName.includes('LPTOKEN') ||
    upperName.includes('LKLP') ||
    identifier.toLowerCase().includes('lklp')
  ) {
    return 'lp'
  }
  if (
    upperName.includes('FARM') ||
    upperName.includes('LKFARM') ||
    identifier.toLowerCase().includes('lkfarm') ||
    identifier.toLowerCase().includes('lkmex')
  ) {
    return 'farm'
  }
  return 'esdt'
}

async function fetchAllTokens(): Promise<WalletToken[]> {
  // Fetch in batches of 250 until we get all tokens
  const results: WalletToken[] = []
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
      const price = t.price ?? 0
      const ticker = t.ticker || t.identifier?.split('-')[0] || ''
      const name = t.name || ticker
      results.push({
        identifier: t.identifier || ticker,
        name,
        ticker,
        balance,
        decimals,
        price,
        valueUsd: balance * price,
        type: t.type || 'FungibleESDT',
        category: categoriseToken(ticker, name, t.identifier || ''),
      })
    }

    if (batch.length < size) break
    from += size
  }

  return results
}

async function fetchHatomPosition(egldPrice: number): Promise<HatomPosition | null> {
  // 1. Try official Hatom API
  try {
    const res = await fetch(`${HATOM_API}/lend/v2/userPosition/${WALLET}`, {
      headers: { Accept: 'application/json' },
    })
    if (res.ok) {
      const data = await res.json()
      const markets: HatomMarket[] = (data.markets ?? []).map((m: any) => ({
        label: m.asset ?? m.label ?? m.symbol ?? '?',
        identifier: m.hTokenIdentifier ?? m.identifier ?? '',
        supplied: m.supplyAmount ?? m.supplied ?? 0,
        borrowed: m.borrowAmount ?? m.borrowed ?? 0,
        valueSuppliedUsd: m.supplyValueUSD ?? m.valueSuppliedUsd ?? 0,
        valueBorrowedUsd: m.borrowValueUSD ?? m.valueBorrowedUsd ?? 0,
        rewardsHtm: m.pendingRewards ?? m.rewardsHtm ?? 0,
      }))
      return {
        healthFactor: data.healthFactor ?? data.health_factor ?? 999,
        totalSuppliedUsd: data.totalSupplyUSD ?? data.totalSuppliedUsd ?? 0,
        totalBorrowedUsd: data.totalBorrowUSD ?? data.totalBorrowedUsd ?? 0,
        netValueUsd: (data.totalSupplyUSD ?? 0) - (data.totalBorrowUSD ?? 0),
        markets,
        claimableHtm: data.pendingRewards ?? 0,
        claimableHtmUsd: data.pendingRewardsUSD ?? 0,
        source: 'api',
      }
    }
  } catch {
    // API unreachable — fall back to wallet scan
  }

  // 2. Fallback: detect H-tokens in wallet to estimate Hatom position
  try {
    const res = await fetch(`${MVX_API}/accounts/${WALLET}/tokens?size=250&from=0`)
    if (!res.ok) return null
    const allTokens: any[] = await res.json()
    const hTokens = allTokens.filter(t => {
      const tk = (t.ticker || '').toUpperCase()
      return HATOM_TICKERS.has(tk) || (tk.startsWith('H') && (t.name || '').toLowerCase().includes('hatom'))
    })
    if (!hTokens.length) return null

    const markets: HatomMarket[] = hTokens.map(t => {
      const dec = t.decimals ?? 18
      const bal = Number(t.balance ?? 0) / Math.pow(10, dec)
      const usd = bal * (t.price ?? 0)
      return {
        label: (t.ticker || '').replace(/^H/, '') || t.name || t.identifier,
        identifier: t.identifier || '',
        supplied: bal,
        borrowed: 0,
        valueSuppliedUsd: usd,
        valueBorrowedUsd: 0,
        rewardsHtm: 0,
      }
    })

    const totalSupplied = markets.reduce((s, m) => s + m.valueSuppliedUsd, 0)
    return {
      healthFactor: 999,
      totalSuppliedUsd: totalSupplied,
      totalBorrowedUsd: 0,
      netValueUsd: totalSupplied,
      markets,
      claimableHtm: 0,
      claimableHtmUsd: 0,
      source: 'wallet',
    }
  } catch {
    return null
  }
}

export function useWalletTokens(): WalletData {
  const [egldBalance, setEgldBalance] = useState(0)
  const [egldPrice, setEgldPrice] = useState(0)
  const [tokens, setTokens] = useState<WalletToken[]>([])
  const [hatomPosition, setHatomPosition] = useState<HatomPosition | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [accountRes, econRes] = await Promise.all([
        fetch(`${MVX_API}/accounts/${WALLET}`).then(r => r.json()),
        fetch(`${MVX_API}/economics`).then(r => r.json()),
      ])

      const egld = Number(accountRes.balance ?? 0) / 1e18
      const price = econRes.price ?? 0
      setEgldBalance(egld)
      setEgldPrice(price)

      const [allTokens, hatom] = await Promise.all([
        fetchAllTokens(),
        fetchHatomPosition(price),
      ])

      setTokens(allTokens.sort((a, b) => b.valueUsd - a.valueUsd))
      setHatomPosition(hatom)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const hatomTokens = tokens.filter(t => t.category === 'hatom')
  const lpTokens = tokens.filter(t => t.category === 'lp')
  const farmTokens = tokens.filter(t => t.category === 'farm')
  const standardTokens = tokens.filter(t => t.category === 'esdt')
  const totalEsdtUsd = tokens.reduce((s, t) => s + t.valueUsd, 0) + egldBalance * egldPrice

  return {
    egldBalance,
    egldValueUsd: egldBalance * egldPrice,
    tokens,
    hatomTokens,
    lpTokens,
    farmTokens,
    standardTokens,
    totalEsdtUsd,
    hatomPosition,
    loading,
    error,
    refresh: fetchAll,
  }
}
