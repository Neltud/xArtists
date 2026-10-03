/**
 * Price tick for matrix — public APIs only, no TX.
 */

export type PriceTick = {
  assetId: string
  priceUsd: number
  source: string
  at: number
}

let cache: PriceTick | null = null

/** EGLD/USD via CoinGecko (paper matrix input). */
export async function fetchEgldPrice(force = false): Promise<PriceTick> {
  if (!force && cache && Date.now() - cache.at < 60_000) return cache
  try {
    const r = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=elrond-erd-2&vs_currencies=usd',
      { headers: { Accept: 'application/json' } },
    )
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const j = (await r.json()) as { 'elrond-erd-2'?: { usd?: number } }
    const priceUsd = Number(j['elrond-erd-2']?.usd)
    if (!Number.isFinite(priceUsd) || priceUsd <= 0) throw new Error('bad price')
    cache = { assetId: 'EGLD', priceUsd, source: 'coingecko', at: Date.now() }
    return cache
  } catch {
    // fallback last cache or neutral
    if (cache) return cache
    return { assetId: 'EGLD', priceUsd: 0, source: 'unavailable', at: Date.now() }
  }
}
