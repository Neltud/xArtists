/**
 * Live MultiversX account for the connected USER wallet (never LIA ops).
 * Account + ESDT tokens + NFTs (NonFungible / SemiFungible).
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

export type UserToken = {
  identifier: string
  ticker: string
  name: string
  balance: number
  decimals: number
  valueUsd: number
}

export type UserAccount = {
  balanceEgld: number
  balanceAtomic: string
  nonce: number
  shard?: number
  nftCount: number
  nfts: UserNft[]
  tokens: UserToken[]
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

function mapToken(t: Record<string, unknown>): UserToken | null {
  const decimals = Number(t.decimals ?? 18)
  const raw = String(t.balance ?? '0')
  let balance = 0
  try {
    balance = Number(BigInt(raw)) / Math.pow(10, decimals)
  } catch {
    balance = Number(raw) / Math.pow(10, decimals)
  }
  if (!Number.isFinite(balance) || balance <= 0) return null
  const identifier = String(t.identifier || '')
  const ticker =
    String(t.ticker || '') ||
    (identifier.includes('-') ? identifier.split('-')[0] : identifier)
  const price = Number(t.price ?? 0)
  return {
    identifier,
    ticker,
    name: String(t.name || ticker),
    balance,
    decimals,
    valueUsd: price > 0 ? balance * price : 0,
  }
}

function mapNft(r: Record<string, unknown>): UserNft {
  return {
    identifier: String(r.identifier || ''),
    collection: String(r.collection || ''),
    name: String(r.name || r.identifier || ''),
    nonce: Number(r.nonce ?? 0),
    url: typeof r.url === 'string' ? r.url : undefined,
    media: Array.isArray(r.media) ? (r.media as UserNft['media']) : undefined,
    type: typeof r.type === 'string' ? r.type : undefined,
  }
}

export function useUserAccount(address: string | null | undefined): UserAccount {
  const [balanceAtomic, setBalanceAtomic] = useState('0')
  const [nonce, setNonce] = useState(0)
  const [shard, setShard] = useState<number | undefined>()
  const [nfts, setNfts] = useState<UserNft[]>([])
  const [tokens, setTokens] = useState<UserToken[]>([])
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
      setTokens([])
      setError(null)
      return
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const [accRes, nftRes, tokRes] = await Promise.all([
          fetch(`${API}/accounts/${address}`),
          fetch(
            `${API}/accounts/${address}/nfts?size=100&type=NonFungibleESDT,SemiFungibleESDT`
          ),
          fetch(`${API}/accounts/${address}/tokens?size=200`),
        ])
        if (!accRes.ok) throw new Error(`Account HTTP ${accRes.status}`)
        const acc = await accRes.json()
        if (cancelled) return
        setBalanceAtomic(String(acc.balance ?? '0'))
        setNonce(Number(acc.nonce ?? 0))
        setShard(typeof acc.shard === 'number' ? acc.shard : undefined)

        let nftList: UserNft[] = []
        if (nftRes.ok) {
          const rows = await nftRes.json()
          if (Array.isArray(rows)) nftList = rows.map(mapNft)
        }

        let tokList: UserToken[] = []
        if (tokRes.ok) {
          const rows = await tokRes.json()
          if (Array.isArray(rows)) {
            tokList = rows
              .map(mapToken)
              .filter((x): x is UserToken => x != null)
              .sort((a, b) => b.valueUsd - a.valueUsd || b.balance - a.balance)
          }
        }

        if (!cancelled) {
          setNfts(nftList)
          setTokens(tokList)
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
    tokens,
    loading,
    error,
    refreshedAt,
    refresh,
  }
}
