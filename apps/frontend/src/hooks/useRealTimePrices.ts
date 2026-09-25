import { useState, useEffect, useRef, useCallback } from 'react'
import {
  getLiveMarketSnapshot,
  type LiveMarketSnapshot,
  type LiveQuote,
} from '../services/priceService'

export type RealTimePricesState = {
  snapshot: LiveMarketSnapshot | null
  loading: boolean
  error: string | null
  lastUpdate: Date | null
  /** Flash direction vs previous tick */
  flash: Partial<Record<string, 'up' | 'down' | 'flat'>>
  refresh: () => void
}

const EMPTY_FLASH: RealTimePricesState['flash'] = {}

function flashDir(prev: number, next: number): 'up' | 'down' | 'flat' {
  if (!prev || !next) return 'flat'
  if (next > prev * 1.00005) return 'up'
  if (next < prev * 0.99995) return 'down'
  return 'flat'
}

/** Prix marché live — défaut 10 s (paper MTM). */
export function useRealTimePrices(refreshInterval = 10_000): RealTimePricesState {
  const [snapshot, setSnapshot] = useState<LiveMarketSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [flash, setFlash] = useState<RealTimePricesState['flash']>(EMPTY_FLASH)
  const prevRef = useRef<LiveMarketSnapshot | null>(null)

  const load = useCallback(async () => {
    try {
      const snap = await getLiveMarketSnapshot()
      const prev = prevRef.current
      if (prev) {
        setFlash({
          EGLD: flashDir(prev.egld.price, snap.egld.price),
          BTC: flashDir(prev.btc.price, snap.btc.price),
          ETH: flashDir(prev.eth.price, snap.eth.price),
          USDC: flashDir(prev.usdc.price, snap.usdc.price),
          TRO: flashDir(prev.tro.price, snap.tro.price),
        })
      }
      prevRef.current = snap
      setSnapshot(snap)
      setLastUpdate(new Date(snap.fetchedAt))
      setError(null)
      setLoading(false)
    } catch {
      setError('Flux prix indisponible')
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const id = window.setInterval(load, refreshInterval)
    const onVis = () => {
      if (document.visibilityState === 'visible') load()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [load, refreshInterval])

  return { snapshot, loading, error, lastUpdate, flash, refresh: load }
}

/** Compat anciens appels : egld / btc / tro numériques. */
export function useLegacyPriceNumbers(refreshInterval = 30_000) {
  const { snapshot, loading, error } = useRealTimePrices(refreshInterval)
  return {
    egld: snapshot?.egld.price ?? 0,
    btc: snapshot?.btc.price ?? 0,
    tro: snapshot?.tro.price ?? 0,
    troChange24h: 0,
    loading,
    error,
  }
}

export type { LiveQuote, LiveMarketSnapshot }
