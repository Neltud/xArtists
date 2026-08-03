/**
 * Live MultiversX counts for LIA protocol wallet — never trust stale JSON alone.
 */
import { useCallback, useEffect, useState } from 'react'
import { LIA_WALLET } from '../config/links'

const API = 'https://api.multiversx.com'

export type LiaOnchainLive = {
  nftInWallet: number
  egldBalance: number
  troBalance: number
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useLiaOnchainLive(): LiaOnchainLive {
  const [nftInWallet, setNft] = useState(0)
  const [egldBalance, setEgld] = useState(0)
  const [troBalance, setTro] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [nftRes, accRes, troRes] = await Promise.all([
        fetch(`${API}/accounts/${LIA_WALLET}/nfts/count`),
        fetch(`${API}/accounts/${LIA_WALLET}`),
        fetch(`${API}/accounts/${LIA_WALLET}/tokens/TRO-94c925`),
      ])
      if (nftRes.ok) {
        const n = await nftRes.json()
        setNft(typeof n === 'number' ? n : Number(n) || 0)
      }
      if (accRes.ok) {
        const a = await accRes.json()
        setEgld(Number(a.balance || 0) / 1e18)
      }
      if (troRes.ok) {
        const t = await troRes.json()
        const dec = t.decimals ?? 6
        setTro(Number(t.balance || 0) / 10 ** dec)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'live fetch failed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 60_000)
    return () => clearInterval(id)
  }, [refresh])

  return { nftInWallet, egldBalance, troBalance, loading, error, refresh }
}
