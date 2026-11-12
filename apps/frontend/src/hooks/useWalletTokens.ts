import { useState, useEffect, useCallback, useRef } from 'react'
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

async function fetchAllTokens(address: string, signal: AbortSignal): Promise<WalletToken[]> {
  const results: WalletToken[] = []
  let from = 0
  const size = 250
  while (true) {
    const res = await fetch(`${MVX_API}/accounts/${address}/tokens?size=${size}&from=${from}`, { signal, cache: 'no-store' })
    if (!res.ok) throw new Error(`Tokens HTTP ${res.status}`)
    const batch: any[] = await res.json()
    if (!Array.isArray(batch)) throw new Error('Réponse tokens invalide')
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
    if (from >= 5000) throw new Error('Trop de tokens : lecture incomplète')
  }
  return results
}

async function fetchHatomPosition(address: string, signal: AbortSignal): Promise<HatomPosition | null> {
  try {
    const res = await fetch(`${HATOM_API}/lend/v2/userPosition/${address}`, {
      headers: { Accept: 'application/json' }, signal,
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
    const res = await fetch(`${MVX_API}/accounts/${address}/tokens?size=250`, { signal, cache: 'no-store' })
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

/**
 * address omitted / undefined → LIA protocol (Hatom, LP pages)
 * address null → skip fetch (user Wallet when disconnected)
 * address string → that account
 */
export function useWalletTokens(address?: string | null): WalletData {
  const resolved =
    address === null ? '' : typeof address === 'string' && address.trim() ? address.trim() : LIA_WALLET

  const [snapshot, setSnapshot] = useState({ ...EMPTY })
  const activeRequest = useRef<AbortController | null>(null)
  const latestOwner = useRef(resolved)
  latestOwner.current = resolved
  const isLia = resolved.length > 0 && resolved.toLowerCase() === LIA_WALLET.toLowerCase()

  const fetchAll = useCallback(async () => {
    if (latestOwner.current !== resolved) return
    activeRequest.current?.abort()
    const controller = new AbortController()
    activeRequest.current = controller
    const current = () => activeRequest.current === controller && latestOwner.current === resolved
    setSnapshot({ ...EMPTY, address: resolved, isLia, loading: Boolean(resolved) })
    if (!resolved) return
    const timeout = setTimeout(() => controller.abort(), 12000)
    const read = async (url: string) => {
      const response = await fetch(url, { signal: controller.signal, cache: 'no-store' })
      if (!response.ok) throw new Error(`Wallet HTTP ${response.status}`)
      return response.json()
    }
    try {
      const [account, economics, tokens, hatomPosition] = await Promise.all([
        read(`${MVX_API}/accounts/${resolved}`), read(`${MVX_API}/economics`),
        fetchAllTokens(resolved, controller.signal), fetchHatomPosition(resolved, controller.signal),
      ])
      const egldBalance = Number(account.balance) / 1e18
      const price = Number(economics.price)
      if (!Number.isFinite(egldBalance) || egldBalance < 0 || !Number.isFinite(price) || price < 0)
        throw new Error('Réponse wallet invalide')
      const sorted = tokens.sort((a, b) => b.valueUsd - a.valueUsd)
      if (current() && !controller.signal.aborted) setSnapshot({
        address: resolved, isLia, egldBalance, egldValueUsd: egldBalance * price,
        tokens: sorted,
        hatomTokens: sorted.filter(t => t.category === 'hatom'),
        lpTokens: sorted.filter(t => t.category === 'lp'),
        farmTokens: sorted.filter(t => t.category === 'farm'),
        standardTokens: sorted.filter(t => t.category === 'esdt'),
        totalEsdtUsd: sorted.reduce((sum, t) => sum + t.valueUsd, 0) + egldBalance * price,
        hatomPosition, loading: false, error: null,
      })
    } catch (e) {
      if (current()) setSnapshot({ ...EMPTY, address: resolved, isLia,
        error: controller.signal.aborted ? 'Lecture wallet expirée. Réessaie.' : String(e) })
    } finally { clearTimeout(timeout) }
  }, [resolved, isLia])

  useEffect(() => {
    void fetchAll()
    return () => {
      activeRequest.current?.abort()
      activeRequest.current = null
    }
  }, [fetchAll])

  const data = snapshot.address === resolved ? snapshot : {
    ...EMPTY, address: resolved, isLia, loading: Boolean(resolved),
  }
  return { ...data, refresh: fetchAll }
}
