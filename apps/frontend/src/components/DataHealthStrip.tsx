import { useEffect, useState } from 'react'
import { MARKETPLACE_LIVE, AGENTS_LIVE } from '../config/scStatus'

const CANDIDATES = {
  board: [
    `${import.meta.env.BASE_URL}data/lia_board.json`,
    'https://raw.githubusercontent.com/Neltud/xArtists/main/data/lia_board.json',
  ],
  status: [
    `${import.meta.env.BASE_URL}data/lia_v6_status.json`,
    'https://raw.githubusercontent.com/Neltud/xArtists/main/data/lia_v6_status.json',
  ],
  oracle: [`${import.meta.env.BASE_URL}data/oracle_prices.json`],
}

type Health = {
  board: boolean
  status: boolean
  boardUpdated?: string
  oracle: boolean
}

async function firstOk(
  urls: string[]
): Promise<{ ok: boolean; updated?: string }> {
  const t = Date.now()
  for (const u of urls) {
    try {
      const r = await fetch(`${u}${u.includes('?') ? '&' : '?'}t=${t}`, { cache: 'no-store' })
      if (!r.ok) continue
      const j = await r.json().catch(() => ({}))
      return {
        ok: true,
        updated: (j as { updated?: string; timestamp?: string }).updated || (j as { timestamp?: string }).timestamp,
      }
    } catch {
      /* next */
    }
  }
  return { ok: false }
}

/** Compact health: board JSON + status + oracle + SC flags. */
export default function DataHealthStrip() {
  const [h, setH] = useState<Health>({ board: false, status: false, oracle: false })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [board, status, oracle] = await Promise.all([
        firstOk(CANDIDATES.board),
        firstOk(CANDIDATES.status),
        firstOk(CANDIDATES.oracle),
      ])
      if (!cancelled) {
        setH({
          board: board.ok,
          status: status.ok,
          boardUpdated: board.updated || status.updated,
          oracle: oracle.ok,
        })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const pill = (ok: boolean, label: string) => (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
        ok ? 'bg-green-500/15 text-green-400' : 'bg-amber-500/15 text-amber-300'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? 'bg-green-400' : 'bg-amber-400'}`} />
      {label}
    </span>
  )

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 text-[10px] text-gray-500">
      {pill(h.board, h.board ? 'Board OK' : 'Board…')}
      {pill(h.status, h.status ? 'Status OK' : 'Status…')}
      {pill(h.oracle, h.oracle ? 'Oracle OK' : 'Oracle…')}
      {pill(MARKETPLACE_LIVE, MARKETPLACE_LIVE ? 'NFT SC live' : 'NFT SC pending')}
      {pill(AGENTS_LIVE, AGENTS_LIVE ? 'Agents SC live' : 'Agents SC pending')}
      {h.boardUpdated && (
        <span className="text-gray-600">
          data {new Date(h.boardUpdated).toLocaleString('fr-FR')}
        </span>
      )}
    </div>
  )
}
