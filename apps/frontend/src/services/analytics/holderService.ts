/**
 * Indexation holders $TRO + ranking NFT collections xArtists.
 * API MultiversX publique — lecture seule, paper-safe.
 */
const API = 'https://api.multiversx.com'

/** MultiversX bech32 — erd1 + 58 chars [a-z0-9] */
export const ERD_ADDRESS_RE = /^erd1[a-z0-9]{58}$/

export function isValidErdAddress(addr: string | undefined | null): addr is string {
  return typeof addr === 'string' && ERD_ADDRESS_RE.test(addr)
}

/**
 * Collections NFT xArtists réelles (public/data/xartists_collections.index.json).
 * VITE_XARTISTS_NFT_COLLECTIONS override ; fallback jamais vide / jamais *000000.
 */
const DEFAULT_NFT_COLLECTIONS = [
  'XAR-cee2e0',
  'AGR-9bd53e',
  'ALISTOR-a646bc',
  'ASFT-a6273a',
  'BGG-2b627c',
  'HP47X2-b71543',
  'MAS-5189b6',
  'NFTUDURI-2990b6',
  'XTR-e5072b',
  'XAUS-d9cf1f',
  'TRO-652d6d',
] as const

function resolveNftCollections(): string[] {
  const fromEnv =
    typeof import.meta !== 'undefined'
      ? (import.meta as ImportMeta & { env?: Record<string, string> }).env
          ?.VITE_XARTISTS_NFT_COLLECTIONS
      : undefined
  const parsed = (fromEnv || '')
    .split(',')
    .map(s => s.trim())
    .filter(s => s && !s.includes('000000'))
  return parsed.length > 0 ? parsed : [...DEFAULT_NFT_COLLECTIONS]
}

const XARTISTS_COLLECTIONS = resolveNftCollections()

/** Token $TRO principal + legacy (env override). */
const DEFAULT_TRO_IDS = ['TRO-94c925', 'TRO-3bc587'] as const

function resolveTroIds(): string[] {
  const fromEnv =
    typeof import.meta !== 'undefined'
      ? (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_TRO_TOKEN_ID
      : undefined
  if (fromEnv && /^TRO-[a-z0-9]+$/i.test(fromEnv.trim())) {
    return [fromEnv.trim(), ...DEFAULT_TRO_IDS.filter(id => id !== fromEnv.trim())]
  }
  return [...DEFAULT_TRO_IDS]
}

const TRO_IDS = resolveTroIds()

export type HolderKind = 'user' | 'sc-vault' | 'sc-pool' | 'exchange' | 'unknown'

export type TroHolder = {
  address: string
  balance: number
  balanceRaw: string
  kind: HolderKind
  rank: number
  sharePct: number
  /** Label court si SC connu */
  label?: string
}

export type NftHolderRow = {
  address: string
  count: number
  collection: string
  verified: boolean
  rank: number
}

export type HolderIndexSnapshot = {
  tokenId: string
  totalSupply: number | null
  accountsCount: number | null
  holders: TroHolder[]
  vaults: TroHolder[]
  topUsers: TroHolder[]
  nftLeaderboard: NftHolderRow[]
  fetchedAt: string
  notes: string[]
}

const KNOWN_SC: Record<string, { kind: HolderKind; label: string }> = {
  erd1qqqqqqqqqqqqqpgqmmvfh4anzayxwn3cfe23uw6lguu8synr2jpsu3l0am: {
    kind: 'sc-pool',
    label: 'xExchange TRO/WEGLD',
  },
  erd1qqqqqqqqqqqqqpgqqz6vp9y50ep867vnr296mqf3dduh6guvmvlsu3sujc: {
    kind: 'sc-pool',
    label: 'OneDex TRO/EGLD',
  },
  erd1qqqqqqqqqqqqqpgq9gcl9uldfrymtmj8vtkctrkmjdazw3nj2jpsd3nv2e: {
    kind: 'sc-pool',
    label: 'xExchange TRO/USDC',
  },
}

const TTL_MS = 60_000
const mem = new Map<string, { at: number; data: unknown }>()

async function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = mem.get(key)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data as T
  const data = await fn()
  mem.set(key, { at: Date.now(), data })
  return data
}

function classifyAddress(address: string): { kind: HolderKind; label?: string } {
  if (!isValidErdAddress(address)) return { kind: 'unknown', label: 'invalid' }
  const known = KNOWN_SC[address]
  if (known) return known
  if (/^erd1qqqqqqqqqqqqq/.test(address)) {
    return { kind: 'sc-vault', label: 'Smart Contract' }
  }
  return { kind: 'user' }
}

function toHumanBalance(raw: string, decimals = 18): number {
  const n = Number(raw)
  if (!Number.isFinite(n)) return 0
  return n / 10 ** decimals
}

export async function fetchTroHolders(opts?: {
  size?: number
  tokenId?: string
}): Promise<{ holders: TroHolder[]; tokenId: string; totalSupply: number | null; accountsCount: number | null }> {
  const tokenId = opts?.tokenId || TRO_IDS[0]
  const size = Math.min(100, Math.max(10, opts?.size ?? 50))

  return cached(`tro-holders-${tokenId}-${size}`, async () => {
    let accounts: Array<{ address: string; balance: string }> = []
    let totalSupply: number | null = null
    let accountsCount: number | null = null
    let decimals = 18

    try {
      const metaR = await fetch(`${API}/tokens/${tokenId}`, { cache: 'no-store' })
      if (metaR.ok) {
        const meta = (await metaR.json()) as {
          supply?: string
          circulatingSupply?: string
          accounts?: number
          decimals?: number
        }
        decimals = typeof meta.decimals === 'number' ? meta.decimals : 18
        const supplyRaw = meta.circulatingSupply || meta.supply
        if (supplyRaw) totalSupply = toHumanBalance(String(supplyRaw), decimals)
        if (typeof meta.accounts === 'number') accountsCount = meta.accounts
      }
    } catch {
      /* continue */
    }

    try {
      const r = await fetch(
        `${API}/tokens/${tokenId}/accounts?size=${size}&from=0`,
        { cache: 'no-store' },
      )
      if (r.ok) {
        const list = (await r.json()) as Array<{ address?: string; balance?: string }>
        accounts = (Array.isArray(list) ? list : [])
          .filter(a => a.address && isValidErdAddress(a.address) && a.balance)
          .map(a => ({ address: a.address!, balance: String(a.balance) }))
      }
    } catch {
      /* empty */
    }

    const sumBal = accounts.reduce((s, a) => s + toHumanBalance(a.balance, decimals), 0)
    const denom = totalSupply && totalSupply > 0 ? totalSupply : sumBal || 1

    const holders: TroHolder[] = accounts.map((a, i) => {
      const balance = toHumanBalance(a.balance, decimals)
      const { kind, label } = classifyAddress(a.address)
      return {
        address: a.address,
        balance,
        balanceRaw: a.balance,
        kind,
        rank: i + 1,
        sharePct: (balance / denom) * 100,
        label,
      }
    })

    return { holders, tokenId, totalSupply, accountsCount }
  })
}

export async function fetchNftLeaderboard(
  collections: string[] = XARTISTS_COLLECTIONS,
  size = 25,
): Promise<NftHolderRow[]> {
  return cached(`nft-lb-${collections.join(',')}-${size}`, async () => {
    const rows: NftHolderRow[] = []
    for (const collection of collections) {
      if (!collection || collection.includes('000000')) continue
      try {
        const r = await fetch(
          `${API}/collections/${collection}/accounts?size=${size}&from=0`,
          { cache: 'no-store' },
        )
        if (!r.ok) continue
        const list = (await r.json()) as Array<{ address?: string; balance?: string | number }>
        ;(Array.isArray(list) ? list : []).forEach((a, i) => {
          if (!a.address || !isValidErdAddress(a.address)) return
          const count = Number(a.balance) || 0
          if (count <= 0) return
          rows.push({
            address: a.address,
            count,
            collection,
            verified: true,
            rank: i + 1,
          })
        })
      } catch {
        /* skip collection */
      }
    }
    rows.sort((a, b) => b.count - a.count)
    return rows.map((r, i) => ({ ...r, rank: i + 1 }))
  })
}

export async function fetchHolderIndex(opts?: {
  size?: number
  tokenId?: string
}): Promise<HolderIndexSnapshot> {
  const notes: string[] = []
  let holdersResult = await fetchTroHolders(opts)
  if (holdersResult.holders.length === 0 && !opts?.tokenId) {
    for (const alt of TRO_IDS.slice(1)) {
      const altRes = await fetchTroHolders({ ...opts, tokenId: alt })
      if (altRes.holders.length > 0) {
        holdersResult = altRes
        notes.push(`Token fallback ${alt}`)
        break
      }
    }
  }
  const { holders, tokenId, totalSupply, accountsCount } = holdersResult

  const vaults = holders.filter(h => h.kind === 'sc-vault' || h.kind === 'sc-pool')
  const topUsers = holders
    .filter(h => h.kind === 'user')
    .map((h, i) => ({ ...h, rank: i + 1 }))

  let nftLeaderboard: NftHolderRow[] = []
  try {
    nftLeaderboard = await fetchNftLeaderboard()
    if (nftLeaderboard.length === 0) {
      notes.push('NFT leaderboard vide (API / collections sans holders publics)')
    }
  } catch {
    notes.push('NFT leaderboard indisponible')
  }

  if (vaults.length) {
    notes.push(`${vaults.length} SC vaults/pools isolés du ranking users`)
  }

  return {
    tokenId,
    totalSupply,
    accountsCount,
    holders,
    vaults,
    topUsers,
    nftLeaderboard,
    fetchedAt: new Date().toISOString(),
    notes,
  }
}

export function shortAddr(a: string, n = 6): string {
  if (!a || a.length < 12) return a || '—'
  return `${a.slice(0, n)}…${a.slice(-n)}`
}

export function formatBalance(v: number): string {
  if (!Number.isFinite(v)) return '—'
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(2)}k`
  if (v >= 1) return v.toFixed(2)
  return v.toFixed(4)
}
