import { useState, useEffect, useCallback } from 'react'

const MVX_API = 'https://api.multiversx.com'
const WALLET = 'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6'
const RAW_BASE = 'https://raw.githubusercontent.com/Neltud/xArtists/main'
const TRO_TOKEN = 'TRO-94c925'

/** How old (ms) remote data can be before showing a stale warning (2 hours). */
const STALE_THRESHOLD_MS = 2 * 60 * 60 * 1000

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

/** Return true if an ISO timestamp string is older than STALE_THRESHOLD_MS. */
function checkStale(timestamp: string | undefined): boolean {
  if (!timestamp) return false
  try {
    return Date.now() - new Date(timestamp).getTime() > STALE_THRESHOLD_MS
  } catch {
    return false
  }
}

export function useMultiversX() {
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
        fetch(`${MVX_API}/economics`).then(r => r.json()),
        fetch('https://api.alternative.me/fng/?limit=1').then(r => r.json()),
        fetch(`${RAW_BASE}/data/lia_v6_status.json`).then(r => r.json()),
        fetch(`${RAW_BASE}/data/xartists_onchain.json`).then(r => r.json()),
        fetch(`${RAW_BASE}/data/battle_of_nodes.json`).then(r => r.json()),
      ])

      // Prices
      const egldPrice = econRes.status === 'fulfilled' ? (econRes.value?.price ?? 0) : 0
      const fg = fgRes.status === 'fulfilled' ? fgRes.value?.data?.[0] : null

      // TRO price from MultiversX API
      let troPrice = 0
      try {
        const mex = await fetch(`${MVX_API}/tokens/${TRO_TOKEN}`).then(r => r.json())
        troPrice = mex?.price ?? 0
      } catch { /* ignore */ }

      // BTC from CoinGecko (may fail due to CORS in browser)
      let btcPrice = 0
      try {
        const cg = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd').then(r => r.json())
        btcPrice = cg?.bitcoin?.usd ?? 0
      } catch { /* ignore */ }

      setPrices({
        egld: egldPrice,
        btc: btcPrice,
        tro: troPrice,
        wtao: 0,
        fearGreed: fg ? parseInt(fg.value) : 50,
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
      console.error('fetchAll error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 60_000) // refresh every 60s
    return () => clearInterval(interval)
  }, [fetchAll])

  return { prices, liaStatus, xartists, bonData, loading, lastUpdate, isStale, refresh: fetchAll }
}
