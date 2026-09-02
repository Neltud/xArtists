/**
 * LIA run strip — paper status from published JSON (board + v6).
 * Never implies live trading.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

type V6 = {
  updated?: string
  status?: string
  LIA_LIVE_TRADING?: number
  orchestrator?: {
    agent_action?: string
    live_trading?: boolean
    guardian?: { allow?: boolean; reason?: string; spiral_score?: number }
  }
  sc?: { marketplace_codeHash?: string | null; note?: string }
}

type Board = {
  updated?: string
  arb?: { actionable?: boolean; note?: string }
  series?: { series?: unknown[]; horizon_days?: number }
  trading_stack?: { LIA_LIVE_TRADING?: number }
}

const V6_URLS = [
  `${import.meta.env.BASE_URL}data/lia_v6_status.json`,
  'https://raw.githubusercontent.com/Neltud/xArtists/main/data/lia_v6_status.json',
]
const BOARD_URLS = [
  `${import.meta.env.BASE_URL}data/lia_board.json`,
  'https://raw.githubusercontent.com/Neltud/xArtists/main/data/lia_board.json',
]

async function fetchFirst<T>(urls: string[]): Promise<T | null> {
  const t = Date.now()
  for (const u of urls) {
    try {
      const r = await fetch(`${u}${u.includes('?') ? '&' : '?'}t=${t}`, { cache: 'no-store' })
      if (r.ok) return (await r.json()) as T
    } catch {
      /* next */
    }
  }
  return null
}

export default function LiaRunStrip() {
  const [v6, setV6] = useState<V6 | null>(null)
  const [board, setBoard] = useState<Board | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let c = false
    ;(async () => {
      const [a, b] = await Promise.all([fetchFirst<V6>(V6_URLS), fetchFirst<Board>(BOARD_URLS)])
      if (c) return
      if (!a && !b) setErr('board offline')
      else {
        setV6(a)
        setBoard(b)
        setErr(null)
      }
    })()
    const id = window.setInterval(async () => {
      const [a, b] = await Promise.all([fetchFirst<V6>(V6_URLS), fetchFirst<Board>(BOARD_URLS)])
      if (!c) {
        if (a) setV6(a)
        if (b) setBoard(b)
      }
    }, 60_000)
    return () => {
      c = true
      clearInterval(id)
    }
  }, [])

  const live = v6?.LIA_LIVE_TRADING === 1 || v6?.orchestrator?.live_trading === true
  const action = v6?.orchestrator?.agent_action || 'WAIT'
  const gAllow = v6?.orchestrator?.guardian?.allow
  const seriesN = board?.series?.series?.length ?? 0
  const updated = v6?.updated || board?.updated

  return (
    <div className="rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-cyan-500/10 via-transparent to-violet-500/10 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/90 font-semibold">
          LIA run
        </p>
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
            live
              ? 'border-rose-400/40 bg-rose-500/15 text-rose-200'
              : 'border-amber-400/40 bg-amber-500/15 text-amber-100'
          }`}
        >
          {live ? 'LIVE' : 'PAPER'}
        </span>
      </div>

      {err && <p className="text-xs text-zinc-500">{err}</p>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="rounded-lg border border-white/10 bg-black/25 px-2.5 py-2">
          <p className="text-[9px] uppercase text-zinc-500">Action</p>
          <p className="text-white font-semibold mono">{action}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/25 px-2.5 py-2">
          <p className="text-[9px] uppercase text-zinc-500">Guardian</p>
          <p className={gAllow === false ? 'text-rose-300 font-semibold' : 'text-emerald-300 font-semibold'}>
            {gAllow === false ? 'BLOCK' : 'OK'}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/25 px-2.5 py-2">
          <p className="text-[9px] uppercase text-zinc-500">Séries paper</p>
          <p className="text-white font-semibold">{seriesN || '—'}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/25 px-2.5 py-2">
          <p className="text-[9px] uppercase text-zinc-500">Arb</p>
          <p className="text-zinc-300">{board?.arb?.actionable ? 'signal' : 'idle'}</p>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] text-zinc-600">
          {updated ? `maj ${updated.slice(0, 16).replace('T', ' ')}` : '—'}
          {' · '}packs Pulse·Yield·Sentinel · SC mint pending
        </p>
        <div className="flex gap-2">
          <Link to="/trading" className="text-[11px] text-cyan-300 hover:text-cyan-200 underline underline-offset-2">
            Board
          </Link>
          <Link to="/portfolio" className="text-[11px] text-zinc-400 hover:text-white underline underline-offset-2">
            Portfolio LIA
          </Link>
        </div>
      </div>
    </div>
  )
}
