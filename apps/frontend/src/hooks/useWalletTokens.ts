import { useState, useEffect, useCallback } from 'react'
import { LIA_WALLET } from '../config/links'

const MVX_API = 'https://api.multiversx.com'
const HATOM_API = 'https://mainnet-api.hatom.com'

const HATOM_TICKERS = new Set([
  'HEGLD', 'HUSDC', 'HUSDT', 'HWBTC', 'HMEX', 'HWTAO',
  'HBUSD', 'HSEGLD', 'HUSD', 'HWETH', 'HHTM', 'HUTCHR',
])

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
  address: string
  isLia: boolean
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

function categoriseToken(ticker: string, tokenName: string, _identifier: string): WalletToken['category'] {
  const upperTicker = ticker.toUpperCase()
  const upperName = tokenName.toUpperCase()
  if (HATOM_TICKERS.has(upperTicker) || upperName.includes('HATOM')) return 'hatom'
  if (
    XEXCHANGE_LP_PREFIXES.some(p => upperTicker.startsWith(p)) ||
    upperName.includes(' LP') ||
    upperName.includes('LPTOKEN')
  )
    return 'lp'
  if (upperName.includes('FARM') || upperName.includes('LKFARM')) return 'farm'
  return 'esdt'
}

async function fetchAllTokens(address: string): Promise<WalletToken[]> {
  const results: WalletToken[] = []
  let from = 0
  const size = 250
  while (true) {
    const res = await fetch(`${MVX_API}/accounts/${address}/tokens?size=${size}&from=${from}`)
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

async function fetchHatomPosition(address: string): Promise<HatomPosition | null> {
  try {
    const res = await fetch(`${HATOM_API}/lend/v2/userPosition/${address}`, {
      headers: { Accept: 'application/json' },
    })
    if (res.ok) {
      const data = await res.json()
      const markets: HatomMarket[] = (data.markets ?? []).map((m: any) => ({
        label: m.asset ?? m.label ?? '?',
        identifier: m.hTokenIdentifier ?? '',
        supplied: m.supplyAmount ?? 0,
        borrowed: m.borrowAmount ?? 0,
        valueSuppliedUsd: m.supplyValueUSD ?? 0,
        valueBorrowedUsd: m.borrowValueUSD ?? 0,
        rewardsHtm: m.pendingRewards ?? 0,
      }))
      return {
        healthFactor: data.healthFactor ?? 999,
        totalSuppliedUsd: data.totalSupplyUSD ?? 0,
        totalBorrowedUsd: data.totalBorrowUSD ?? 0,
        netValueUsd: (data.totalSupplyUSD ?? 0) - (data.totalBorrowUSD ?? 0),
        markets,
        claimableHtm: data.pendingRewards ?? 0,
        claimableHtmUsd: data.pendingRewardsUSD ?? 0,
        source: 'api',
      }
    }
  } catch {
    /* fallback */
  }
  try {
    const res = await fetch(`${MVX_API}/accounts/${address}/tokens?size=250`)
    if (!res.ok) return null
    const allTokens: any[] = await res.json()
    const hTokens = allTokens.filter((t: any) => HATOM_TICKERS.has((t.ticker || '').toUpperCase()))
    if (!hTokens.length) return null
    const markets: HatomMarket[] = hTokens.map((t: any) => {
      const dec = t.decimals ?? 18
      const bal = Number(t.balance ?? 0) / Math.pow(10, dec)
      return {
        label: (t.ticker || '').replace(/^H/, ''),
        identifier: t.identifier || '',
        supplied: bal,
        borrowed: 0,
        valueSuppliedUsd: bal * (t.price ?? 0),
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

const EMPTY: Omit<WalletData, 'refresh'> = {
  address: '',
  isLia: false,
  egldBalance: 0,
  egldValueUsd: 0,
  tokens: [],
  hatomTokens: [],
  lpTokens: [],
  farmTokens: [],
  standardTokens: [],
  totalEsdtUsd: 0,
  hatomPosition: null,
  loading: false,
  error: null,
}

/** Pass null/undefined to skip fetch (user wallet page when disconnected). */
export function useWalletTokens(address: string | null | undefined): WalletData {
  const [egldBalance, setEgldBalance] = useState(0)
  const [egldPrice, setEgldPrice] = useState(0)
  const [tokens, setTokens] = useState<WalletToken[]>([])
  const [hatomPosition, setHatomPosition] = useState<HatomPosition | null>(null)
  const [loading, setLoading] = useState(Boolean(address?.trim()))
  const [error, setError] = useState<string | null>(null)

  const addr = address?.trim() || ''
  const isLia = addr.length > 0 && addr.toLowerCase() === LIA_WALLET.toLowerCase()

  const fetchAll = useCallback(async () => {
    if (!addr) {
      setEgldBalance(0)
      setTokens([])
      setHatomPosition(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [accountRes, econRes] = await Promise.all([
        fetch(`${MVX_API}/accounts/${addr}`).then(r => r.json()),
        fetch(`${MVX_API}/economics`).then(r => r.json()),
      ])
      const egld = Number(accountRes.balance ?? 0) / 1e18
      const price = econRes.price ?? 0
      setEgldBalance(egld)
      setEgldPrice(price)
      const [allTokens, hatom] = await Promise.all([fetchAllTokens(addr), fetchHatomPosition(addr)])
      setTokens(allTokens.sort((a, b) => b.valueUsd - a.valueUsd))
      setHatomPosition(hatom)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [addr])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  if (!addr) {
    return { ...EMPTY, refresh: fetchAll }
  }

  const hatomTokens = tokens.filter(t => t.category === 'hatom')
  const lpTokens = tokens.filter(t => t.category === 'lp')
  const farmTokens = tokens.filter(t => t.category === 'farm')
  const standardTokens = tokens.filter(t => t.category === 'esdt')
  const totalEsdtUsd = tokens.reduce((s, t) => s + t.valueUsd, 0) + egldBalance * egldPrice

  return {
    address: addr,
    isLia,
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
