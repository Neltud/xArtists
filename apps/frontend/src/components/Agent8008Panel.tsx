/** MX-8008 Execution Sentinel — pairs with MX-8004 identity */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import SupernovaStatusBadge from './SupernovaStatusBadge'

type Agent8008 = {
  id?: string
  name?: string
  codename?: string
  mode?: string
  role?: string
  status?: string
  note?: string
  capabilities?: string[]
}

export default function Agent8008Panel() {
  const [agent, setAgent] = useState<Agent8008 | null>(null)

  useEffect(() => {
    let c = false
    const urls = [
      `${import.meta.env.BASE_URL}data/mx8008_agent.json`,
      '/xArtists/data/mx8008_agent.json',
    ]
    ;(async () => {
      for (const u of urls) {
        try {
          const r = await fetch(u, { cache: 'no-store' })
          if (!r.ok) continue
          const j = await r.json()
          if (!c) setAgent(j)
          return
        } catch {
          /* next */
        }
      }
    })()
    return () => {
      c = true
    }
  }, [])

  return (
    <section className="rounded-2xl border border-sky-500/25 bg-gradient-to-br from-zinc-950 to-sky-950/25 p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300/80">
            Agent MX-8008
          </p>
          <h2 className="text-lg font-semibold text-white mt-0.5">
            {agent?.codename || 'Execution Sentinel'}
          </h2>
          <p className="text-[12px] text-zinc-500 mt-1 max-w-md">
            {agent?.role ||
              'Guardian + settle mirror for Vellum legs · PEM Vellum only'}
          </p>
        </div>
        <SupernovaStatusBadge />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(agent?.capabilities || ['watch_intents', 'guardian_caps', 'journal_settle']).map(cap => (
          <span
            key={cap}
            className="rounded-full border border-white/10 bg-black/40 px-2 py-0.5 text-[10px] text-zinc-400"
          >
            {cap}
          </span>
        ))}
      </div>

      <p className="text-[11px] text-zinc-600">
        Status: <span className="text-zinc-400">{agent?.status || 'scaffolded'}</span>
        {' · '}
        Mode: <span className="text-zinc-400">{agent?.mode || 'paper'}</span>
      </p>

      <div className="flex flex-wrap gap-3 text-[11px]">
        <Link to="/lia" className="text-sky-300 hover:text-sky-200 underline-offset-2 hover:underline">
          LIA performance
        </Link>
        <Link to="/go-live" className="text-zinc-400 hover:text-white underline-offset-2 hover:underline">
          GO_LIVE
        </Link>
        <Link to="/agents" className="text-zinc-400 hover:text-white underline-offset-2 hover:underline">
          Packs
        </Link>
      </div>
    </section>
  )
}
