/**
 * Prix marché live — MultiversX + Binance public + CoinGecko fallback.
 * Utilisé pour simulation paper mark-to-market (pas d’exécution on-chain).
 */

export type LiveQuote = {
  symbol: string
  price: number
  change24hPct: number | null
  source: string
  ts: number
}

export type LiveMarketSnapshot = {
  egld: LiveQuote
  btc: LiveQuote
  eth: LiveQuote
  usdc: LiveQuote
  usdt: LiveQuote
  tro: LiveQuote
  fetchedAt: number
}

async function binance24h(symbol: string): Promise<{ price: number; change24hPct: number } | null> {
  try {
    const r = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`, {
      cache: 'no-store',
    })
    if (!r.ok) return null
    const j = await r.json()
    const price = Number(j.lastPrice)
    const change24hPct = Number(j.priceChangePercent)
    if (!Number.isFinite(price) || price <= 0) return null
    return {
      price,
      change24hPct: Number.isFinite(change24hPct) ? change24hPct : 0,
    }
  } catch {
    return null
  }
}

async function binancePrice(symbol: string): Promise<number | null> {
  try {
    const r = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`, {
      cache: 'no-store',
    })
    if (!r.ok) return null
    const j = await r.json()
    const price = Number(j.price)
    return Number.isFinite(price) && price > 0 ? price : null
  } catch {
    return null
  }
}

async function coingeckoSimple(
  ids: string,
): Promise<Record<string, { usd?: number; usd_24h_change?: number }>> {
  try {
    const r = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
      { cache: 'no-store' },
    )
    if (!r.ok) return {}
    return await r.json()
  } catch {
    return {}
  }
}

// ——— legacy helpers (compat) ———

export const getEgldPrice = async (): Promise<number> => {
  try {
    const res = await fetch('https://api.multiversx.com/economics', { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      if (data?.price) return Number(data.price)
    }
  } catch {
    /* fall */
  }
  const b = await binancePrice('EGLDUSDT')
  if (b) return b
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=multiversx&vs_currencies=usd',
      { cache: 'no-store' },
    )
    const data = await res.json()
    return data.multiversx?.usd || 0
  } catch {
    return 0
  }
}

const TRO_SUPPLY_FALLBACK = 476_223

export const getTroInfo = async () => {
  try {
    const res = await fetch('https://api.multiversx.com/tokens/TRO-94c925', { cache: 'no-store' })
    const data = await res.json()
    const decimals = data.decimals || 18
    const rawSupply = data.supply ? Number(data.supply) : 0
    const rawCirculating = data.circulatingSupply ? Number(data.circulatingSupply) : rawSupply
    let circulatingSupply = rawCirculating / Math.pow(10, decimals)
    let totalSupply = rawSupply / Math.pow(10, decimals)
    if (!Number.isFinite(circulatingSupply) || circulatingSupply <= 0) {
      circulatingSupply = TRO_SUPPLY_FALLBACK
    }
    if (!Number.isFinite(totalSupply) || totalSupply <= 0) {
      totalSupply = TRO_SUPPLY_FALLBACK
    }
    if (circulatingSupply < 1 && rawCirculating > 1000 && rawCirculating < 1e12) {
      circulatingSupply = rawCirculating
      totalSupply = rawSupply || rawCirculating
    }
    const price = Number(data.price) || 0
    const marketCap = Number(data.marketCap) || (price > 0 ? price * circulatingSupply : 0)
    return {
      price,
      marketCap,
      circulatingSupply,
      totalSupply,
      name: data.name || 'TUDURIORIGINAL',
      identifier: 'TRO-94c925',
      holders: data.accounts || data.holders || 0,
      transactions: data.transactions || 0,
      decimals,
    }
  } catch {
    return {
      price: 0,
      marketCap: 0,
      circulatingSupply: TRO_SUPPLY_FALLBACK,
      totalSupply: TRO_SUPPLY_FALLBACK,
      name: 'TUDURIORIGINAL',
      identifier: 'TRO-94c925',
      holders: 0,
      transactions: 0,
      decimals: 18,
    }
  }
}

export const getBtcPrice = async (): Promise<number> => {
  const b = await binancePrice('BTCUSDT')
  if (b) return b
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
      { cache: 'no-store' },
    )
    const data = await res.json()
    return data.bitcoin?.usd || 0
  } catch {
    return 0
  }
}

export const getAllPrices = async () => {
  const [egld, tro, btc] = await Promise.all([getEgldPrice(), getTroInfo(), getBtcPrice()])
  return { egld, tro, btc }
}

function q(
  symbol: string,
  price: number,
  change24hPct: number | null,
  source: string,
): LiveQuote {
  return { symbol, price, change24hPct, source, ts: Date.now() }
}

/** Snapshot multi-actifs pour le desk paper temps réel. */
export async function getLiveMarketSnapshot(): Promise<LiveMarketSnapshot> {
  const now = Date.now()
  const [egldB, btcB, ethB, usdcB, mvxEgld, troInfo, cg] = await Promise.all([
    binance24h('EGLDUSDT'),
    binance24h('BTCUSDT'),
    binance24h('ETHUSDT'),
    binance24h('USDCUSDT'),
    getEgldPrice(),
    getTroInfo(),
    coingeckoSimple('multiversx,bitcoin,ethereum,usd-coin,tether'),
  ])

  const egldPrice = egldB?.price || mvxEgld || cg.multiversx?.usd || 0
  const egldCh =
    egldB?.change24hPct ??
    (cg.multiversx?.usd_24h_change != null ? Number(cg.multiversx.usd_24h_change) : null)

  const btcPrice = btcB?.price || cg.bitcoin?.usd || 0
  const btcCh =
    btcB?.change24hPct ??
    (cg.bitcoin?.usd_24h_change != null ? Number(cg.bitcoin.usd_24h_change) : null)

  const ethPrice = ethB?.price || cg.ethereum?.usd || 0
  const ethCh =
    ethB?.change24hPct ??
    (cg.ethereum?.usd_24h_change != null ? Number(cg.ethereum.usd_24h_change) : null)

  const usdcPrice = usdcB?.price || cg['usd-coin']?.usd || 1
  const usdcCh =
    usdcB?.change24hPct ??
    (cg['usd-coin']?.usd_24h_change != null ? Number(cg['usd-coin'].usd_24h_change) : 0)

  const usdtPrice = 1
  const usdtCh = 0

  const troPrice = troInfo.price || 0

  return {
    egld: q('EGLD', egldPrice, egldCh, egldB ? 'binance' : mvxEgld ? 'multiversx' : 'coingecko'),
    btc: q('BTC', btcPrice, btcCh, btcB ? 'binance' : 'coingecko'),
    eth: q('ETH', ethPrice, ethCh, ethB ? 'binance' : 'coingecko'),
    usdc: q('USDC', usdcPrice, usdcCh, usdcB ? 'binance' : 'coingecko'),
    usdt: q('USDT', usdtPrice, usdtCh, 'peg'),
    tro: q('TRO', troPrice, null, 'multiversx'),
    fetchedAt: now,
  }
}
