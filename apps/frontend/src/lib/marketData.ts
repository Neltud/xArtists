/**
 * Données marché publiques — Fear & Greed, assets, news.
 * Synthèses LIA / Vellum = agrégats seulement (pas de modèle exposé).
 */

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
  marketCap?: number
  volume24h?: number
}

export type MarketNews = {
  id: string
  title: string
  url?: string
  source: string
  publishedAt?: string
}

export type MarketRegime = 'risk_on' | 'neutral' | 'risk_off'

export type MarketSnapshot = {
  fearGreed: FearGreed
  regime: MarketRegime
  regimeLabel: string
  btcDominance?: number
  assets: MarketAsset[]
  news: MarketNews[]
  liaBrief: string[]
  updatedAt: string
  source: 'live' | 'cache' | 'fallback'
}

const CG_IDS = 'bitcoin,ethereum,solana,ripple,cardano,avalanche-2,chainlink,the-graph'

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

function liaBriefFrom(fng: FearGreed, regime: MarketRegime, assets: MarketAsset[]): string[] {
  const top = [...assets].sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))[0]
  const lines = [
    `Sentiment agrégé : ${fng.value} · ${fng.classification}.`,
    `Régime affiché : ${regime === 'risk_on' ? 'appétit pour le risque' : regime === 'risk_off' ? 'aversion' : 'transition'}.`,
  ]
  if (top) {
    lines.push(
      `Mouvement marquant 24h : ${top.symbol} ${top.change24h >= 0 ? '+' : ''}${top.change24h.toFixed(1)}%.`
    )
  }
  lines.push('Synthèse publique — détail modèle LIA / Vellum non exposé.')
  return lines
}

async function fetchJson<T>(url: string, timeoutMs = 8000): Promise<T | null> {
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
  const urls = [
    'https://api.alternative.me/fng/?limit=1&format=json',
    'https://api.coin-stats.com/v2/fear-greed', // may fail
  ]
  for (const u of urls) {
    const j = await fetchJson<{
      data?: { value?: string; value_classification?: string; timestamp?: string }[]
      now?: { value?: number; value_classification?: string }
    }>(u)
    if (!j) continue
    if (j.data?.[0]?.value != null) {
      const v = Number(j.data[0].value)
      return {
        value: v,
        classification: j.data[0].value_classification || classifyFng(v),
        timestamp: j.data[0].timestamp,
      }
    }
    if (j.now?.value != null) {
      return {
        value: j.now.value,
        classification: j.now.value_classification || classifyFng(j.now.value),
      }
    }
  }
  return null
}

async function loadAssets(): Promise<MarketAsset[]> {
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${CG_IDS}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`
  const j = await fetchJson<
    {
      id: string
      symbol: string
      name: string
      current_price: number
      price_change_percentage_24h: number
      market_cap: number
      total_volume: number
    }[]
  >(url)
  if (!Array.isArray(j) || !j.length) return []
  return j.map(c => ({
    id: c.id,
    symbol: (c.symbol || '').toUpperCase(),
    name: c.name,
    price: c.current_price,
    change24h: c.price_change_percentage_24h ?? 0,
    marketCap: c.market_cap,
    volume24h: c.total_volume,
  }))
}

async function loadDominance(): Promise<number | undefined> {
  const j = await fetchJson<{ data?: { market_cap_percentage?: { btc?: number } } }>(
    'https://api.coingecko.com/api/v3/global'
  )
  return j?.data?.market_cap_percentage?.btc
}

async function loadNews(): Promise<MarketNews[]> {
  // CryptoCompare social news — often CORS-ok; fallback empty
  const j = await fetchJson<{ Data?: { id: string; title: string; url: string; source: string; published_on: number }[] }>(
    'https://min-api.cryptocompare.com/data/v2/news/?lang=EN&categories=BTC,ETH,Market&excludeCategories=Sponsored'
  )
  const rows = j?.Data || []
  return rows.slice(0, 6).map(n => ({
    id: String(n.id),
    title: n.title,
    url: n.url,
    source: n.source || 'News',
    publishedAt: n.published_on ? new Date(n.published_on * 1000).toISOString() : undefined,
  }))
}

async function loadFallback(): Promise<MarketSnapshot | null> {
  const base = import.meta.env.BASE_URL || '/'
  const j = await fetchJson<MarketSnapshot>(`${base}data/market_snapshot.json`)
  if (!j?.fearGreed) return null
  return { ...j, source: 'fallback' }
}

export async function loadMarketSnapshot(): Promise<MarketSnapshot> {
  const [fng, assets, dom, news] = await Promise.all([
    loadFearGreed(),
    loadAssets(),
    loadDominance(),
    loadNews(),
  ])

  if (!fng && !assets.length) {
    const fb = await loadFallback()
    if (fb) return fb
  }

  const fearGreed: FearGreed = fng || { value: 50, classification: 'Neutral' }
  const list = assets.length
    ? assets
    : (
        await loadFallback()
      )?.assets || []

  const avgChange =
    list.length > 0 ? list.reduce((s, a) => s + a.change24h, 0) / list.length : 0
  const { regime, label } = regimeFrom(fearGreed.value, avgChange)

  const newsList =
    news.length > 0 ? news : (await loadFallback())?.news || []

  return {
    fearGreed,
    regime,
    regimeLabel: label,
    btcDominance: dom,
    assets: list,
    news: newsList.slice(0, 6),
    liaBrief: liaBriefFrom(fearGreed, regime, list),
    updatedAt: new Date().toISOString(),
    source: fng || assets.length ? 'live' : 'fallback',
  }
}

export function formatUsd(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  if (n >= 1000) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  if (n >= 1) return `$${n.toFixed(2)}`
  return `$${n.toPrecision(3)}`
}
