/**
 * Marché public — A + B corr · C funding · D brief Vellum · E events.
 */
import { parseFreshMarketAssets, parseFreshFearGreed, parseFundingRate } from './marketEvidence.mjs'

export type FearGreed = {
  value: number
  classification: string
  timestamp?: string
}

export type MarketAsset = {
  id: string
  symbol: string
  name: string
  price: number
  change24h: number
  sourceUpdatedAt?: string
  marketCap?: number
  volume24h?: number
}

export type MarketNews = {
  id: string
  title: string
  url?: string
  source: string
  publishedAt?: string
  tags?: string[]
}

export type MarketEvent = {
  id: string
  title: string
  kind: 'legal' | 'delist' | 'halt' | 'macro' | 'protocol' | 'other'
  severity: 'low' | 'med' | 'high'
  url?: string
  source: string
}

export type FundingRow = {
  symbol: string
  rate: number
  source: string
}

export type MarketRegime = 'risk_on' | 'neutral' | 'risk_off'

export type MarketSnapshot = {
  fearGreed: FearGreed
  regime: MarketRegime
  regimeLabel: string
  btcDominance?: number
  assets: MarketAsset[]
  news: MarketNews[]
  correlation: { symbols: string[]; matrix: number[][] }
  funding: FundingRow[]
  events: MarketEvent[]
  liaBrief: string[]
  vellumBrief: string[]
  updatedAt: string
  source: 'live' | 'cache' | 'fallback'
}

const CG_IDS = 'bitcoin,ethereum,solana,ripple,cardano,avalanche-2,chainlink,the-graph'
const CORR_IDS = ['bitcoin', 'ethereum', 'solana', 'ripple'] as const

function classifyFng(v: number): string {
  if (v <= 24) return 'Extreme Fear'
  if (v <= 44) return 'Fear'
  if (v <= 55) return 'Neutral'
  if (v <= 74) return 'Greed'
  return 'Extreme Greed'
}

function regimeFrom(fng: number, avgChange: number): { regime: MarketRegime; label: string } {
  if (fng >= 60 && avgChange > 1) return { regime: 'risk_on', label: 'Risk-on' }
  if (fng <= 35 || avgChange < -2) return { regime: 'risk_off', label: 'Risk-off' }
  return { regime: 'neutral', label: 'Neutre' }
}

function pearson(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length)
  if (n < 3) return 0
  let sx = 0,
    sy = 0,
    sxx = 0,
    syy = 0,
    sxy = 0
  for (let i = 0; i < n; i++) {
    sx += a[i]
    sy += b[i]
    sxx += a[i] * a[i]
    syy += b[i] * b[i]
    sxy += a[i] * b[i]
  }
  const num = n * sxy - sx * sy
  const den = Math.sqrt((n * sxx - sx * sx) * (n * syy - sy * sy))
  if (!den) return 0
  return Math.max(-1, Math.min(1, num / den))
}

function returnsFromPrices(prices: number[]): number[] {
  const out: number[] = []
  for (let i = 1; i < prices.length; i++) {
    if (prices[i - 1] > 0) out.push((prices[i] - prices[i - 1]) / prices[i - 1])
  }
  return out
}

async function fetchJson<T>(url: string, timeoutMs = 9000): Promise<T | null> {
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), timeoutMs)
    const r = await fetch(url, { signal: ctrl.signal, cache: 'no-store' })
    clearTimeout(t)
    if (!r.ok) return null
    return (await r.json()) as T
  } catch {
    return null
  }
}

async function loadFearGreed(): Promise<FearGreed | null> {
  const data = await fetchJson<unknown>('https://api.alternative.me/fng/?limit=1&format=json')
  return parseFreshFearGreed(data)
}

async function loadAssets(): Promise<MarketAsset[]> {
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${CG_IDS}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`
  const data = await fetchJson<unknown>(url)
  // CoinGecko's last_updated is a producer timestamp; the browser fetch time
  // alone is not evidence. Invalid, missing or stale assets are excluded.
  return parseFreshMarketAssets(data)
}

async function loadDominance(): Promise<number | undefined> {
  const j = await fetchJson<{ data?: { market_cap_percentage?: { btc?: number } } }>(
    'https://api.coingecko.com/api/v3/global'
  )
  return j?.data?.market_cap_percentage?.btc
}

async function loadNews(): Promise<MarketNews[]> {
  const j = await fetchJson<{ Data?: { id: string; title: string; url: string; source: string; published_on: number }[] }>(
    'https://min-api.cryptocompare.com/data/v2/news/?lang=EN&categories=BTC,ETH,Market&excludeCategories=Sponsored'
  )
  const rows = j?.Data || []
  return rows.slice(0, 10).map(n => ({
    id: String(n.id),
    title: n.title,
    url: n.url,
    source: n.source || 'News',
    publishedAt: n.published_on ? new Date(n.published_on * 1000).toISOString() : undefined,
    tags: tagHeadline(n.title),
  }))
}

function tagHeadline(title: string): string[] {
  const t = title.toLowerCase()
  const tags: string[] = []
  if (/sec|lawsuit|sued|court|legal|regulator/.test(t)) tags.push('legal')
  if (/delist|delisted|removed from/.test(t)) tags.push('delist')
  if (/halt|suspended|outage|exploit|hack/.test(t)) tags.push('halt')
  if (/fed|rate cut|inflation|cpi|macro|treasury/.test(t)) tags.push('macro')
  if (/etf|mainnet|upgrade|fork|airdrop/.test(t)) tags.push('protocol')
  return tags
}

function eventsFromNews(news: MarketNews[]): MarketEvent[] {
  const out: MarketEvent[] = []
  for (const n of news) {
    const tags = n.tags || tagHeadline(n.title)
    if (!tags.length) continue
    const kind = (tags[0] as MarketEvent['kind']) || 'other'
    const severity: MarketEvent['severity'] =
      kind === 'legal' || kind === 'halt' ? 'high' : kind === 'delist' ? 'med' : 'low'
    out.push({
      id: `ev-${n.id}`,
      title: n.title,
      kind,
      severity,
      url: n.url,
      source: n.source,
    })
  }
  return out.slice(0, 8)
}

/** B — corrélation 7j (retours journaliers CoinGecko) */
async function loadCorrelation(): Promise<{ symbols: string[]; matrix: number[][] }> {
  const series: { sym: string; rets: number[] }[] = []
  for (const id of CORR_IDS) {
    const j = await fetchJson<{ prices?: [number, number][] }>(
      `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=7`
    )
    const prices = (j?.prices || []).map(p => p[1])
    if (prices.length >= 4) {
      series.push({
        sym: id === 'bitcoin' ? 'BTC' : id === 'ethereum' ? 'ETH' : id === 'solana' ? 'SOL' : 'XRP',
        rets: returnsFromPrices(prices),
      })
    }
  }
  if (series.length < 2) {
    // No correlation estimate if the historical price API is missing.
    return { symbols: [], matrix: [] }
  }
  const symbols = series.map(s => s.sym)
  const matrix = series.map(a => series.map(b => Number(pearson(a.rets, b.rets).toFixed(2))))
  return { symbols, matrix }
}

/** C — funding perp (Binance public ; fallback neutre) */
async function loadFunding(): Promise<FundingRow[]> {
  const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT']
  const rows: FundingRow[] = []
  for (const s of symbols) {
    const j = await fetchJson<{ symbol?: string; lastFundingRate?: string }[]>(
      `https://fapi.binance.com/fapi/v1/fundingRate?symbol=${s}&limit=1`
    )
    const row = Array.isArray(j) ? j[0] : null
    const rate = parseFundingRate(row?.lastFundingRate)
    if (rate !== null) {
      rows.push({ symbol: s.replace('USDT', ''), rate, source: 'binance' })
    }
  }

  return rows
}

function liaBriefFrom(
  fng: FearGreed,
  regime: MarketRegime,
  assets: MarketAsset[],
  funding: FundingRow[]
): string[] {
  const top = [...assets].sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))[0]
  const avgFund =
    funding.length > 0 ? funding.reduce((s, f) => s + f.rate, 0) / funding.length : null
  const lines = [
    `Sentiment agrégé : ${fng.value} · ${fng.classification}.`,
    `Régime affiché : ${regime === 'risk_on' ? 'appétit pour le risque' : regime === 'risk_off' ? 'aversion' : 'transition'}.`,
  ]
  if (top) {
    lines.push(
      `Mouvement marquant 24h : ${top.symbol} ${top.change24h >= 0 ? '+' : ''}${top.change24h.toFixed(1)}%.`
    )
  }
  lines.push(avgFund === null
    ? 'Funding perp : indisponible — aucun taux de remplacement.'
    : `Funding moyen (perp) : ${avgFund >= 0 ? '+' : ''}${avgFund.toFixed(4)}% — indicateur de positionnement, pas un ordre.`)
  lines.push('Synthèse de marché xOrus · observations non éligibles au trading automatique.')
  return lines
}

/** D — xOrus public summary, no speculative legacy allocation. */
function vellumPublicBrief(
  fng: FearGreed,
  regime: MarketRegime,
  corr: { symbols: string[]; matrix: number[][] },
  events: MarketEvent[]
): string[] {
  let maxOff = 0
  let pair = ''
  for (let i = 0; i < corr.matrix.length; i++) {
    for (let j = i + 1; j < corr.matrix.length; j++) {
      const v = Math.abs(corr.matrix[i][j])
      if (v > maxOff) {
        maxOff = v
        pair = `${corr.symbols[i]}–${corr.symbols[j]}`
      }
    }
  }
  const highEv = events.filter(e => e.severity === 'high').length
  return [
    `Contexte marché xOrus : régime ${regime} · F&G ${fng.value}.`,
    pair
      ? `Corrélation 7j la plus forte (hors diag.) : ${pair} ≈ ${maxOff.toFixed(2)} — association, pas causalité.`
      : 'Corrélation 7j en cours de calcul.',
    highEv
      ? `${highEv} événement(s) à sévérité haute dans le fil (légal / halt).`
      : 'Aucun event haute sévérité taggé dans le fil courant.',
    'Aucune allocation automatique ni décision xOrus dérivée de ce tableau.',
  ]
}

export async function loadMarketSnapshot(): Promise<MarketSnapshot> {
  const [fng, assets, dom, news, corr, funding] = await Promise.all([
    loadFearGreed(), loadAssets(), loadDominance(), loadNews(),
    loadCorrelation(), loadFunding(),
  ])
  if (!fng || assets.length === 0) {
    // Do not turn a partial network outage into a plausible market report.
    throw new Error('Sources de marché horodatées indisponibles. Aucun cours de démonstration affiché.')
  }
  const avgChange = assets.reduce((total, asset) => total + asset.change24h, 0) / assets.length
  const { regime, label } = regimeFrom(fng.value, avgChange)
  const events = eventsFromNews(news)
  // Oldest observed asset time, not the browser's request date.
  const observedTimes = assets
    .map(asset => Date.parse(asset.sourceUpdatedAt || ''))
    .filter(Number.isFinite)
  if (observedTimes.length !== assets.length) {
    throw new Error('Horodatage des actifs absent.')
  }
  return {
    fearGreed: fng,
    regime,
    regimeLabel: label,
    btcDominance: dom,
    assets,
    news: news.slice(0, 6),
    correlation: corr,
    funding,
    events,
    liaBrief: liaBriefFrom(fng, regime, assets, funding),
    vellumBrief: vellumPublicBrief(fng, regime, corr, events),
    updatedAt: new Date(Math.min(...observedTimes)).toISOString(),
    source: 'live',
  }
}

export function formatUsd(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  if (n >= 1000) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  if (n >= 1) return `$${n.toFixed(2)}`
  return `$${n.toPrecision(3)}`
}

export function corrColor(v: number): string {
  // -1 red · 0 zinc · +1 emerald
  const t = (v + 1) / 2
  const r = Math.round(248 * (1 - t) + 52 * t)
  const g = Math.round(113 * (1 - t) + 211 * t)
  const b = Math.round(113 * (1 - t) + 153 * t)
  return `rgb(${r},${g},${b})`
}
