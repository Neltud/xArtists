import { useEffect, useState } from 'react'
import { MARKETPLACE_LIVE, AGENTS_LIVE } from '../config/scStatus'

const RAW = 'https://raw.githubusercontent.com/Neltud/xArtists/main'

const CANDIDATES = {
  board: [`${import.meta.env.BASE_URL}data/lia_board.json`, `${RAW}/data/lia_board.json`],
  status: [`${import.meta.env.BASE_URL}data/lia_v6_status.json`, `${RAW}/data/lia_v6_status.json`],
  oracle: [`${import.meta.env.BASE_URL}data/oracle_prices.json`, `${RAW}/data/oracle_prices.json`],
  brain: [`${import.meta.env.BASE_URL}data/lia_brain_cycle.json`, `${RAW}/data/lia_brain_cycle.json`],
  fusion: [`${import.meta.env.BASE_URL}data/lia_signal_fusion.json`, `${RAW}/data/lia_signal_fusion.json`],
  legs: [`${import.meta.env.BASE_URL}data/lia_paper_legs.json`, `${RAW}/data/lia_paper_legs.json`],
  compound: [
    `${import.meta.env.BASE_URL}data/compounding_echelons.json`,
    `${RAW}/data/compounding_echelons.json`,
  ],
}

type Health = {
  board: boolean
  status: boolean
  oracle: boolean
  brain: boolean
  fusion: boolean
  legs: boolean
  compound: boolean
  boardUpdated?: string
}

async function firstOk(urls: string[]): Promise<{ ok: boolean; updated?: string }> {
  const t = Date.now()
  for (const u of urls) {
    try {
      const r = await fetch(`${u}${u.includes('?') ? '&' : '?'}t=${t}`, { cache: 'no-store' })
      if (!r.ok) continue
      const j = await r.json().catch(() => ({}))
      return {
        ok: true,
        updated:
          (j as { updated?: string; timestamp?: string; ts?: string }).updated ||
          (j as { timestamp?: string }).timestamp ||
          (j as { ts?: string }).ts,
      }
    } catch {
      /* next */
    }
  }
  return { ok: false }
}

/** Compact health: board · status · oracle · brain · fusion · legs · SC flags. */
export default function DataHealthStrip() {
  const [h, setH] = useState<Health>({
    board: false,
    status: false,
    oracle: false,
    brain: false,
    fusion: false,
    legs: false,
    compound: false,
  })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [board, status, oracle, brain, fusion, legs, compound] = await Promise.all([
        firstOk(CANDIDATES.board),
        firstOk(CANDIDATES.status),
        firstOk(CANDIDATES.oracle),
        firstOk(CANDIDATES.brain),
        firstOk(CANDIDATES.fusion),
        firstOk(CANDIDATES.legs),
        firstOk(CANDIDATES.compound),
      ])
      if (!cancelled) {
        setH({
          board: board.ok,
          status: status.ok,
          oracle: oracle.ok,
          brain: brain.ok,
          fusion: fusion.ok,
          legs: legs.ok,
          compound: compound.ok,
          boardUpdated:
            board.updated || status.updated || brain.updated || fusion.updated,
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
      {pill(h.board, h.board ? 'Board' : 'Board…')}
      {pill(h.status, h.status ? 'Status' : 'Status…')}
      {pill(h.oracle, h.oracle ? 'Oracle' : 'Oracle…')}
      {pill(h.brain, h.brain ? 'Brain' : 'Brain…')}
      {pill(h.fusion, h.fusion ? 'Fusion' : 'Fusion…')}
      {pill(h.legs, h.legs ? 'Legs' : 'Legs…')}
      {pill(h.compound, h.compound ? '10-col' : '10-col…')}
      {pill(MARKETPLACE_LIVE, MARKETPLACE_LIVE ? 'NFT SC' : 'NFT SC pending')}
      {pill(AGENTS_LIVE, AGENTS_LIVE ? 'Agents SC' : 'Agents SC pending')}
      {h.boardUpdated && (
        <span className="text-gray-600">
          data {new Date(h.boardUpdated).toLocaleString('fr-FR')}
        </span>
      )}
    </div>
  )
}
