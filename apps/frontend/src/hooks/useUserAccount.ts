/**
 * Live MultiversX account for the connected USER wallet (never LIA ops).
 */
import { useCallback, useEffect, useState } from 'react'

const API = 'https://api.multiversx.com'

export type UserNft = {
  identifier: string
  collection: string
  name: string
  nonce: number
  url?: string
  media?: { url?: string }[]
  type?: string
}

export type UserAccount = {
  balanceEgld: number
  balanceAtomic: string
  nonce: number
  shard?: number
  nftCount: number
  nfts: UserNft[]
  loading: boolean
  error: string | null
  refreshedAt: number | null
  refresh: () => void
}

function atomicToEgld(atomic: string): number {
  try {
    return Number(BigInt(atomic)) / 1e18
  } catch {
    return 0
  }
}

export function useUserAccount(address: string | null | undefined): UserAccount {
  const [balanceAtomic, setBalanceAtomic] = useState('0')
  const [nonce, setNonce] = useState(0)
  const [shard, setShard] = useState<number | undefined>()
  const [nfts, setNfts] = useState<UserNft[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshedAt, setRefreshedAt] = useState<number | null>(null)
  const [tick, setTick] = useState(0)

  const refresh = useCallback(() => setTick(t => t + 1), [])

  useEffect(() => {
    if (!address || !/^erd1[a-z0-9]{58}$/i.test(address)) {
      setBalanceAtomic('0')
      setNonce(0)
      setNfts([])
      setError(null)
      return
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const [accRes, nftRes] = await Promise.all([
          fetch(`${API}/accounts/${address}`),
          fetch(`${API}/accounts/${address}/nfts?size=100&type=NonFungibleESDT,SemiFungibleESDT`),
        ])
        if (!accRes.ok) throw new Error(`Account HTTP ${accRes.status}`)
        const acc = await accRes.json()
        if (cancelled) return
        setBalanceAtomic(String(acc.balance ?? '0'))
        setNonce(Number(acc.nonce ?? 0))
        setShard(typeof acc.shard === 'number' ? acc.shard : undefined)

        let list: UserNft[] = []
        if (nftRes.ok) {
          const rows: any[] = await nftRes.json()
          if (Array.isArray(rows)) {
            list = rows.map(r => ({
              identifier: r.identifier,
              collection: r.collection,
              name: r.name || r.identifier,
              nonce: r.nonce,
              url: r.url,
              media: r.media,
              type: r.type,
            }))
          }
        }
        if (!cancelled) {
          setNfts(list)
          setRefreshedAt(Date.now())
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'fetch failed')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [address, tick])

  return {
    balanceEgld: atomicToEgld(balanceAtomic),
    balanceAtomic,
    nonce,
    shard,
    nftCount: nfts.length,
    nfts,
    loading,
    error,
    refreshedAt,
    refresh,
  }
}
