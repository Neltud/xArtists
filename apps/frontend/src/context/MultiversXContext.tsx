import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

const MVX_API = 'https://api.multiversx.com'
const RAW_BASE = 'https://raw.githubusercontent.com/Neltud/xArtists/main'
const TRO_TOKEN = 'TRO-94c925'
const STALE_THRESHOLD_MS = 2 * 60 * 60 * 1000
const POLL_MS = 90_000

function checkStale(timestamp: string | undefined): boolean {
  if (!timestamp) return false
  const ms = new Date(timestamp).getTime()
  if (isNaN(ms)) return false
  return Date.now() - ms > STALE_THRESHOLD_MS
}

async function fetchJsonFirst(urls: string[]): Promise<unknown | null> {
  const t = Date.now()
  for (const base of urls) {
    try {
      const url = base.includes('?') ? base : `${base}?t=${t}`
      const r = await fetch(url, { cache: 'no-store' })
      if (!r.ok) continue
      return await r.json()
    } catch {
      /* next */
    }
  }
  return null
}

function dataCandidates(name: string): string[] {
  const base = import.meta.env.BASE_URL || '/'
  return [
    `${base}data/${name}`,
    `data/${name}`,
    `${RAW_BASE}/data/${name}`,
    `https://neltud.github.io/xArtists/data/${name}`,
  ]
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
  updated?: string
  portfolio: LIAPortfolio
  prices: { egld_usd: number; wbtc_usd: number }
  market: { fear_greed_index: number; guard_status: string }
  cycle: { report_sent: boolean; summary: string }
  orchestrator?: {
    live_trading?: boolean
    agent_action?: string
    guardian?: {
      allow?: boolean
      reason?: string
      spiral_score?: number
      max_notional?: number
      effective_leverage?: number
    }
  }
  LIA_LIVE_TRADING?: number | string
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
  const [prices, setPrices] = useState<Prices>({
    egld: 0,
    btc: 0,
    tro: 0,
    wtao: 0,
    fearGreed: 50,
    fearGreedLabel: 'Neutral',
  })
  const [liaStatus, setLiaStatus] = useState<LIAStatus | null>(null)
  const [xartists, setXartists] = useState<XArtistsData | null>(null)
  const [bonData, setBonData] = useState<BonData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isStale, setIsStale] = useState(false)

  const fetchAll = useCallback(async () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
    try {
      const [econRes, fgRes, liaJson, xaJson, bonJson] = await Promise.allSettled([
        fetch(`${MVX_API}/economics`).then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`)
          return r.json()
        }),
        fetch('https://api.alternative.me/fng/?limit=1').then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`)
          return r.json()
        }),
        fetchJsonFirst(dataCandidates('lia_v6_status.json')),
        fetchJsonFirst(dataCandidates('xartists_onchain.json')),
        fetchJsonFirst(dataCandidates('battle_of_nodes.json')),
      ])

      const egldPrice = econRes.status === 'fulfilled' ? (econRes.value?.price ?? 0) : 0
      const fg = fgRes.status === 'fulfilled' ? fgRes.value?.data?.[0] : null

      // TRO + BTC in parallel, non-blocking for main UI
      let troPrice = 0
      let btcPrice = 0
      await Promise.all([
        fetch(`${MVX_API}/tokens/${TRO_TOKEN}`)
          .then(r => (r.ok ? r.json() : null))
          .then(j => {
            troPrice = j?.price ?? 0
          })
          .catch(() => {}),
        fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd')
          .then(r => (r.ok ? r.json() : null))
          .then(j => {
            btcPrice = j?.bitcoin?.usd ?? 0
          })
          .catch(() => {}),
      ])

      setPrices({
        egld: egldPrice,
        btc: btcPrice,
        tro: troPrice,
        wtao: 0,
        fearGreed: fg ? parseInt(fg.value, 10) : 50,
        fearGreedLabel: fg?.value_classification ?? 'Neutral',
      })

      let stale = false
      if (liaJson.status === 'fulfilled' && liaJson.value) {
        const v = liaJson.value as LIAStatus
        setLiaStatus({
          version: v.version || '6',
          status: v.status,
          timestamp: v.timestamp || v.updated,
          updated: v.updated,
          portfolio: v.portfolio || { total_usd: 0, egld_balance: 0, hatom_health_factor: 0 },
          prices: v.prices || { egld_usd: egldPrice, wbtc_usd: btcPrice },
          market: v.market || { fear_greed_index: 50, guard_status: 'OK' },
          cycle: v.cycle || { report_sent: false, summary: '' },
          orchestrator: v.orchestrator,
          LIA_LIVE_TRADING: v.LIA_LIVE_TRADING,
        })
        if (checkStale(v.timestamp || v.updated)) stale = true
      }
      if (xaJson.status === 'fulfilled' && xaJson.value) {
        setXartists(xaJson.value as XArtistsData)
        if (checkStale((xaJson.value as XArtistsData).timestamp)) stale = true
      }
      if (bonJson.status === 'fulfilled' && bonJson.value) {
        setBonData(bonJson.value as BonData)
        if (checkStale((bonJson.value as BonData).timestamp)) stale = true
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
    const interval = setInterval(fetchAll, POLL_MS)
    const onVis = () => {
      if (document.visibilityState === 'visible') fetchAll()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [fetchAll])

  return (
    <MultiversXContext.Provider
      value={{ prices, liaStatus, xartists, bonData, loading, lastUpdate, isStale, refresh: fetchAll }}
    >
      {children}
    </MultiversXContext.Provider>
  )
}

export function useMultiversXContext(): MultiversXState {
  const ctx = useContext(MultiversXContext)
  if (!ctx) throw new Error('useMultiversXContext must be used inside MultiversXProvider')
  return ctx
}
