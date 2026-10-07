/**
 * Live EGLD (+ optional TRO) series from MultiversX economics / gateway.
 * Used by CommandWall bars — fail soft to synthetic if offline.
 */

export type PricePoint = { t: number; egld: number }

const CACHE_KEY = 'xartists_egld_series_v1'

export async function fetchEgldSeries(limit = 24): Promise<number[]> {
  try {
    // Public economics endpoint — last price samples via stats if available
    const r = await fetch('https://api.multiversx.com/economics', {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    })
    if (!r.ok) throw new Error(`http_${r.status}`)
    const j = (await r.json()) as { price?: number; marketCap?: number }
    const price = Number(j.price)
    if (!Number.isFinite(price) || price <= 0) throw new Error('bad_price')

    // Build short series from cache + latest tick (honest: not full OHLCV)
    let prev: number[] = []
    try {
      const raw = sessionStorage.getItem(CACHE_KEY)
      if (raw) prev = JSON.parse(raw) as number[]
    } catch {
      /* */
    }
    prev = [...prev, price].slice(-limit)
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(prev))
    } catch {
      /* */
    }
    // If only one point, synthesize mild variation around live price for bars
    if (prev.length < 4) {
      const out: number[] = []
      for (let i = 0; i < limit; i++) {
        const wobble = 1 + Math.sin(i * 0.7) * 0.012 + (i / limit) * 0.004
        out.push(price * wobble)
      }
      out[out.length - 1] = price
      return out
    }
    while (prev.length < limit) prev.unshift(prev[0])
    return prev.slice(-limit)
  } catch {
    // offline synthetic (clearly not marketed as live in UI badge)
    const base = 12
    return Array.from({ length: limit }, (_, i) => base * (1 + Math.sin(i * 0.55) * 0.04))
  }
}

export function seriesToBarHeights(series: number[], maxH = 0.85): number[] {
  if (!series.length) return []
  const min = Math.min(...series)
  const max = Math.max(...series)
  const span = max - min || 1
  return series.map(v => 0.12 + ((v - min) / span) * (maxH - 0.12))
}
