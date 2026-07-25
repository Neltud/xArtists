import { useState, useEffect } from 'react'
import { getEgldPrice, getTroInfo, getBtcPrice } from '../services/priceService'

interface RealTimePrices {
  egld: number
  btc: number
  tro: number
  troChange24h: number
  loading: boolean
  error: string | null
}

export const useRealTimePrices = (refreshInterval = 30000) => {
  const [prices, setPrices] = useState<RealTimePrices>({
    egld: 0, btc: 0, tro: 0, troChange24h: 0, loading: true, error: null,
  })

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const [egld, troInfo, btc] = await Promise.all([getEgldPrice(), getTroInfo(), getBtcPrice()])
        setPrices({ egld, btc, tro: troInfo.price, troChange24h: 0, loading: false, error: null })
      } catch {
        setPrices(prev => ({ ...prev, loading: false, error: 'Erreur de chargement des prix' }))
      }
    }
    fetchPrices()
    const interval = setInterval(fetchPrices, refreshInterval)
    return () => clearInterval(interval)
  }, [refreshInterval])

  return prices
}
