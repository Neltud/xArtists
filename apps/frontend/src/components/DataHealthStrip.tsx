import { useEffect, useState } from 'react'
import { MARKETPLACE_LIVE, AGENTS_LIVE } from '../config/scStatus'

const BOARD_URLS = [
  `${import.meta.env.BASE_URL}data/lia_board.json`,
  'https://raw.githubusercontent.com/Neltud/xArtists/main/data/lia_board.json',
]

type Health = {
  board: boolean
  boardUpdated?: string
  oracle: boolean
}

/** Compact health: board JSON + oracle + SC flags (build-time). */
export default function DataHealthStrip() {
  const [h, setH] = useState<Health>({ board: false, oracle: false })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const t = Date.now()
      let boardOk = false
      let boardUpdated: string | undefined
      for (const u of BOARD_URLS) {
        try {
          const r = await fetch(`${u}?t=${t}`, { cache: 'no-store' })
          if (!r.ok) continue
          const j = await r.json()
          boardOk = true
          boardUpdated = j.updated || j.timestamp
          break
        } catch {
          /* try next */
        }
      }

      let oracleOk = false
      try {
        const o = await fetch(`${import.meta.env.BASE_URL}data/oracle_prices.json?t=${t}`, {
          cache: 'no-store',
        })
        oracleOk = o.ok
      } catch {
        /* ignore */
      }

      if (!cancelled) {
        setH({ board: boardOk, boardUpdated, oracle: oracleOk })
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
      {pill(h.oracle, h.oracle ? 'Oracle OK' : 'Oracle…')}
      {pill(MARKETPLACE_LIVE, MARKETPLACE_LIVE ? 'NFT SC live' : 'NFT SC pending')}
      {pill(AGENTS_LIVE, AGENTS_LIVE ? 'Agents SC live' : 'Agents SC pending')}
      {h.boardUpdated && (
        <span className="text-gray-600">
          board {new Date(h.boardUpdated).toLocaleString('fr-FR')}
        </span>
      )}
    </div>
  )
}
