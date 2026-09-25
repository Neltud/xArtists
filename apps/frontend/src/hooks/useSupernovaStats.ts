import { useCallback, useEffect, useState } from 'react'
import {
  fetchNetworkStats,
  isSupernovaCadence,
  supernovaLabel,
  type NetworkStats,
} from '../services/supernovaApi'

export function useSupernovaStats(pollMs = 30_000) {
  const [stats, setStats] = useState<NetworkStats | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const s = await fetchNetworkStats(true)
    setStats(s)
    setLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
    const id = window.setInterval(() => void fetchNetworkStats(true).then(setStats), pollMs)
    return () => window.clearInterval(id)
  }, [pollMs, refresh])

  return {
    stats,
    loading,
    refresh,
    isSupernova: isSupernovaCadence(stats),
    label: supernovaLabel(stats),
  }
}
