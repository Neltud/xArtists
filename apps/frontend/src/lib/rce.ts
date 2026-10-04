/**
 * Real Capital Engaged — soldes EGLD on-chain des SC (API publique MultiversX).
 * Ne mélange jamais localStorage / pots Fun.
 */

import { MAINNET_ADDRESSES } from '../config/contracts'
import { getCachedHouseEgld, setCachedHouseEgld } from './slotHouseGuard'

const API = 'https://api.multiversx.com'

export type RceLine = {
  id: string
  label: string
  address: string
  egld: number | null
  error?: string
}

export type RceSnapshot = {
  at: number
  lines: RceLine[]
  totalEgld: number
  known: number
  loading?: boolean
}

function addr(key: keyof typeof MAINNET_ADDRESSES): string {
  const a = MAINNET_ADDRESSES[key] as string | undefined
  return a && a.startsWith('erd1') ? a : ''
}

const TRACK: { id: string; label: string; key: keyof typeof MAINNET_ADDRESSES }[] = [
  { id: 'marketplace', label: 'Marketplace', key: 'nft_marketplace' },
  { id: 'tro_staking', label: 'Staking TRO', key: 'tro_staking' },
  { id: 'slot', label: 'Slot house', key: 'slot_casino' },
  { id: 'venue', label: 'Venue', key: 'venue_split' },
  { id: 'treasury', label: 'Treasury', key: 'treasury_splitter' },
  { id: 'agents', label: 'Agents SC', key: 'agents_marketplace' },
]

async function fetchEgldBalance(address: string): Promise<number> {
  const r = await fetch(`${API}/accounts/${address}`, {
    headers: { Accept: 'application/json' },
  })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  const j = (await r.json()) as { balance?: string }
  const raw = j.balance || '0'
  return Number(BigInt(raw)) / 1e18
}

let cache: RceSnapshot | null = null
let inflight: Promise<RceSnapshot> | null = null

export async function loadRce(force = false): Promise<RceSnapshot> {
  if (!force && cache && Date.now() - cache.at < 45_000) return cache
  if (inflight) return inflight

  inflight = (async () => {
    const lines: RceLine[] = []
    for (const t of TRACK) {
      const address = addr(t.key)
      if (!address) {
        lines.push({ id: t.id, label: t.label, address: '', egld: null, error: 'adresse absente' })
        continue
      }
      try {
        const egld = await fetchEgldBalance(address)
        lines.push({ id: t.id, label: t.label, address, egld })
        if (t.id === 'slot') setCachedHouseEgld(egld)
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'erreur lecture'
        lines.push({
          id: t.id,
          label: t.label,
          address,
          egld: t.id === 'slot' ? getCachedHouseEgld() : null,
          error: typeof msg === 'string' ? msg : 'erreur',
        })
      }
    }
    const known = lines.filter(l => l.egld != null).length
    const totalEgld = lines.reduce((s, l) => s + (l.egld ?? 0), 0)
    cache = { at: Date.now(), lines, totalEgld, known }
    inflight = null
    return cache
  })()

  return inflight
}

export function formatEgld(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—'
  if (n >= 100) return n.toFixed(2)
  if (n >= 1) return n.toFixed(4)
  if (n >= 0.0001) return n.toFixed(6)
  return n.toExponential(2)
}
