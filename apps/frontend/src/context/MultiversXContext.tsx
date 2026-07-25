import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

const MVX_API = 'https://api.multiversx.com'
const RAW_BASE = 'https://raw.githubusercontent.com/Neltud/xArtists/main'
const TRO_TOKEN = 'TRO-94c925'
const STALE_THRESHOLD_MS = 2 * 60 * 60 * 1000

function checkStale(timestamp: string | undefined): boolean {
  if (!timestamp) return false
  const ms = new Date(timestamp).getTime()
  if (isNaN(ms)) return false
  return Date.now() - ms > STALE_THRESHOLD_MS
}

export interface Prices {
  egld: number
  btc: number
  tro: number
  wtao: number
  fearGreed: number
  fearGreedLabel: string
}

export interface LIAPortfolio {
  total_usd: number
  egld_balance: number
  hatom_health_factor: number
}

export interface LIAStatus {
  version: string
  status?: string
  timestamp?: string
  portfolio: LIAPortfolio
  prices: { egld_usd: number; wbtc_usd: number }
  market: { fear_greed_index: number; guard_status: string }
  cycle: { report_sent: boolean; summary: string }
}

export interface XArtistsData {
  health: string
  timestamp?: string
  collections: { total_mainnet: number; nfts_in_wallet: number }
  tro_token: { balance_wallet: number; value_usd: number; price_usd?: number }
  staking: { nft_staking_active: boolean; tro_staking_active: boolean; nft_staked_count: number }
  battle_of_nodes: { score: number; rank_estimate: string }
}

export interface VoteOption {
  votes: number
  description: string
  risk: string
}

export interface XExchangePool {
  pair_name: string
  tvl_usd: number
}

export interface BonData {
  score: number
  rank_estimate: string
  dao_active: boolean
  current_proposal_title?: string
  vote_results: Record<string, VoteOption>
  winning_pair: string
  total_votes_cast: number
  recommended_pair: string
  xexchange_pools?: XExchangePool[]
  timestamp?: string
}

export interface MultiversXState {
  prices: Prices
  liaStatus: LIAStatus | null
  xartists: XArtistsData | null
  bonData: BonData | null
  loading: boolean
  lastUpdate: Date | null
  isStale: boolean
  refresh: () => Promise<void>
}

const MultiversXContext = createContext<MultiversXState | null>(null)

export function MultiversXProvider({ children }: { children: ReactNode }) {
  const [prices, setPrices] = useState<Prices>({ egld: 0, btc: 0, tro: 0, wtao: 0, fearGreed: 50, fearGreedLabel: 'Neutral' })
  const [liaStatus, setLiaStatus] = useState<LIAStatus | null>(null)
  const [xartists, setXartists] = useState<XArtistsData | null>(null)
  const [bonData, setBonData] = useState<BonData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isStale, setIsStale] = useState(false)

  const fetchAll = useCallback(async () => {
    try {
      const [econRes, fgRes, liaRes, xaRes, bonRes] = await Promise.allSettled([
        fetch(`${MVX_API}/economics`).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() }),
        fetch('https://api.alternative.me/fng/?limit=1').then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() }),
        fetch(`${RAW_BASE}/data/lia_v6_status.json`).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() }),
        fetch(`${RAW_BASE}/data/xartists_onchain.json`).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() }),
        fetch(`${RAW_BASE}/data/battle_of_nodes.json`).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() }),
      ])

      const egldPrice = econRes.status === 'fulfilled' ? (econRes.value?.price ?? 0) : 0
      const fg = fgRes.status === 'fulfilled' ? fgRes.value?.data?.[0] : null

      let troPrice = 0
      try {
        const mex = await fetch(`${MVX_API}/tokens/${TRO_TOKEN}`).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
        troPrice = mex?.price ?? 0
      } catch (e) {
        console.debug('[MultiversX] TRO price fetch failed:', e)
      }

      let btcPrice = 0
      try {
        const cg = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd').then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
        btcPrice = cg?.bitcoin?.usd ?? 0
      } catch (e) {
        console.debug('[MultiversX] BTC price fetch failed:', e)
      }

      setPrices({
        egld: egldPrice,
        btc: btcPrice,
        tro: troPrice,
        wtao: 0,
        fearGreed: fg ? parseInt(fg.value, 10) : 50,
        fearGreedLabel: fg?.value_classification ?? 'Neutral',
      })

      let stale = false
      if (liaRes.status === 'fulfilled') {
        setLiaStatus(liaRes.value as LIAStatus)
        if (checkStale((liaRes.value as LIAStatus).timestamp)) stale = true
      }
      if (xaRes.status === 'fulfilled') {
        setXartists(xaRes.value as XArtistsData)
        if (checkStale((xaRes.value as XArtistsData).timestamp)) stale = true
      }
      if (bonRes.status === 'fulfilled') {
        setBonData(bonRes.value as BonData)
        if (checkStale((bonRes.value as BonData).timestamp)) stale = true
      }

      setIsStale(stale)
      setLastUpdate(new Date())
    } catch (e) {
      console.error('MultiversX fetchAll error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 60_000)
    return () => clearInterval(interval)
  }, [fetchAll])

  return (
    <MultiversXContext.Provider value={{ prices, liaStatus, xartists, bonData, loading, lastUpdate, isStale, refresh: fetchAll }}>
      {children}
    </MultiversXContext.Provider>
  )
}

export function useMultiversXContext(): MultiversXState {
  const ctx = useContext(MultiversXContext)
  if (!ctx) throw new Error('useMultiversXContext must be used inside MultiversXProvider')
  return ctx
}
