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
  balance?: string
  uris?: string[]
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
    balance: r.balance === undefined || r.balance === null ? undefined : String(r.balance),
    uris: Array.isArray(r.uris) ? r.uris.filter((u): u is string => typeof u === 'string') : undefined,
  }
}

const EMPTY_ACCOUNT = {
  balanceAtomic: '0', nonce: 0, shard: undefined as number | undefined,
  nfts: [] as UserNft[], tokens: [] as UserToken[],
  loading: false, error: null as string | null, refreshedAt: null as number | null,
}

export function useUserAccount(address: string | null | undefined): UserAccount {
  const owner = address && /^erd1[a-z0-9]{58}$/.test(address) ? address : ''
  const [snapshot, setSnapshot] = useState({ ...EMPTY_ACCOUNT, owner: '' })
  const [tick, setTick] = useState(0)
  const refresh = useCallback(() => setTick(t => t + 1), [])

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    setSnapshot({ ...EMPTY_ACCOUNT, owner, loading: Boolean(owner) })
    if (!owner) return () => { active = false; controller.abort() }
    const timeout = setTimeout(() => controller.abort(), 12000)
    const read = async (path: string) => {
      const response = await fetch(`${API}/accounts/${owner}${path}`, {
        signal: controller.signal, cache: 'no-store',
      })
      if (!response.ok) throw new Error(`Account HTTP ${response.status}`)
      return response.json()
    }
    void (async () => {
      try {
        const [acc, nftRows, tokenRows] = await Promise.all([
          read(''), read('/nfts?size=100&type=NonFungibleESDT,SemiFungibleESDT'),
          read('/tokens?size=200'),
        ])
        if (!acc || !/^[0-9]+$/.test(String(acc.balance)) ||
            !Array.isArray(nftRows) || !Array.isArray(tokenRows)) throw new Error('Réponse wallet invalide')
        const nfts = nftRows.map(mapNft)
        const tokens = tokenRows.map(mapToken).filter((x): x is UserToken => x != null)
          .sort((a, b) => b.valueUsd - a.valueUsd || b.balance - a.balance)
        if (active && !controller.signal.aborted) setSnapshot({
          owner, balanceAtomic: String(acc.balance), nonce: Number(acc.nonce ?? 0),
          shard: typeof acc.shard === 'number' ? acc.shard : undefined,
          nfts, tokens, loading: false, error: null, refreshedAt: Date.now(),
        })
      } catch (e) {
        if (active) setSnapshot({ ...EMPTY_ACCOUNT, owner,
          error: controller.signal.aborted ? 'Lecture wallet expirée. Réessaie.' :
            e instanceof Error ? e.message : 'Lecture wallet indisponible',
        })
      } finally { clearTimeout(timeout) }
    })()
    return () => { active = false; clearTimeout(timeout); controller.abort() }
  }, [owner, tick])

  // Hide the previous owner's data during render, before effect cleanup runs.
  const data = snapshot.owner === owner ? snapshot : { ...EMPTY_ACCOUNT, loading: Boolean(owner) }
  return { ...data, balanceEgld: atomicToEgld(data.balanceAtomic),
    nftCount: data.nfts.length, refresh }
}
