/** MX-8008 Execution Sentinel — bridge lia-intent → Vellum journal */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import SupernovaStatusBadge from './SupernovaStatusBadge'
import { AGENT_8008, dispatch8008 } from '../config/agent8008'
import { get8008Journal, type IntentJournalEntry } from '../lib/agent8008Bridge'

type Agent8008Meta = {
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
  const [agent, setAgent] = useState<Agent8008Meta | null>(null)
  const [journal, setJournal] = useState<IntentJournalEntry[]>(() => get8008Journal())

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
    const onJ = () => setJournal(get8008Journal())
    window.addEventListener('xartists:8008-journal', onJ)
    return () => {
      c = true
      window.removeEventListener('xartists:8008-journal', onJ)
    }
  }, [])

  const webhook =
    typeof import.meta.env.VITE_VELLUM_8008_WEBHOOK === 'string' &&
    import.meta.env.VITE_VELLUM_8008_WEBHOOK.length > 0

  return (
    <section className="rounded-2xl border border-sky-500/25 bg-gradient-to-br from-zinc-950 to-sky-950/25 p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300/80">
            Agent MX-8008
          </p>
          <h2 className="text-lg font-semibold text-white mt-0.5">
            {agent?.codename || AGENT_8008.codename}
          </h2>
          <p className="text-[12px] text-zinc-500 mt-1 max-w-md">
            {agent?.role ||
              'Route lia-intent → journal + workflow Vellum xartists-8008-intents · PEM Vellum only'}
          </p>
        </div>
        <SupernovaStatusBadge />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(agent?.capabilities || AGENT_8008.intents.slice(0, 6)).map(cap => (
          <span
            key={cap}
            className="rounded-full border border-white/10 bg-black/40 px-2 py-0.5 text-[10px] text-zinc-400"
          >
            {cap}
          </span>
        ))}
      </div>

      <p className="text-[11px] text-zinc-600">
        Status: <span className="text-zinc-400">{agent?.status || 'bridge_live'}</span>
        {' · '}
        Mode: <span className="text-zinc-400">{agent?.mode || 'paper'}</span>
        {' · '}
        Vellum webhook:{' '}
        <span className={webhook ? 'text-emerald-400' : 'text-amber-400/90'}>
          {webhook ? 'configuré' : 'local journal only'}
        </span>
      </p>

      <div className="rounded-xl border border-white/10 bg-black/30 p-2.5 space-y-1.5">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500">Derniers intents</p>
        {journal.length === 0 ? (
          <p className="text-[11px] text-zinc-600">Aucun encore — achat musée, location, tip…</p>
        ) : (
          <ul className="space-y-1 max-h-28 overflow-y-auto">
            {journal.slice(0, 6).map((j, i) => (
              <li key={i} className="text-[11px] text-zinc-400 flex justify-between gap-2">
                <span className="text-zinc-200 truncate">{j.type}</span>
                <span className="shrink-0 text-zinc-600">{j.vellum}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-secondary text-xs"
          onClick={() => dispatch8008('TIP_LIA', { raw: 'ping 8008 tip paper' })}
        >
          Ping intent test
        </button>
        <Link to="/go-live" className="text-[11px] text-sky-300 hover:text-sky-200 underline-offset-2 hover:underline self-center">
          GO_LIVE checklist
        </Link>
        <Link to="/trading" className="text-[11px] text-zinc-500 hover:text-zinc-300 self-center">
          Trade desk
        </Link>
      </div>
    </section>
  )
}
