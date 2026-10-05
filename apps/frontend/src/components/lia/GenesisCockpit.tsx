/** Unified cockpit — Trading / RWA / Economy / Audit tabs. Paper-default. */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { asText } from '../../lib/safeRender'
import HolderTerminal from './HolderTerminal'
import EconomicPulse from './EconomicPulse'
import PendingActions from './PendingActions'

type Tab = 'trading' | 'rwa' | 'economy' | 'audit'

async function loadJson(name: string): Promise<Record<string, unknown> | null> {
  const bases = [
    `${import.meta.env.BASE_URL || '/'}data/`,
    'https://neltud.github.io/xArtists/data/',
  ]
  for (const b of bases) {
    try {
      const r = await fetch(`${b}${name}`, { cache: 'no-store' })
      if (!r.ok) continue
      return (await r.json()) as Record<string, unknown>
    } catch {
      /* */
    }
  }
  return null
}

export default function GenesisCockpit() {
  const [tab, setTab] = useState<Tab>('trading')
  const [tick, setTick] = useState<Record<string, unknown> | null>(null)
  const [rwa, setRwa] = useState<{ items?: Record<string, unknown>[] } | null>(null)

  useEffect(() => {
    let c = false
    ;(async () => {
      const [t, cat] = await Promise.all([
        loadJson('genesis_tick.json'),
        loadJson('rwa_catalog.json'),
      ])
      if (c) return
      setTick(t)
      setRwa(cat as { items?: Record<string, unknown>[] } | null)
    })()
    return () => {
      c = true
    }
  }, [])

  const tabs: { id: Tab; label: string }[] = [
    { id: 'trading', label: 'Trading' },
    { id: 'rwa', label: 'RWA' },
    { id: 'economy', label: 'Economy' },
    { id: 'audit', label: 'Audit' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-medium">
          Genesis cockpit
        </p>
        <span className="text-[10px] text-zinc-600">
          Shadow default · HITL for chain · LIA_LIVE_TRADING=0
        </span>
      </div>

      <div className="flex gap-1 p-0.5 rounded-full border border-white/10 w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold uppercase ${
              tab === t.id ? 'bg-white/10 text-white' : 'text-zinc-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'trading' && (
        <div className="space-y-3">
          <PendingActions />
          <HolderTerminal />
        </div>
      )}

      {tab === 'rwa' && (
        <div className="space-y-3">
          <p className="text-[12px] text-zinc-400">
            Avg AI score: {asText(tick?.rwa_avg_score)} · momentum{' '}
            {asText(tick?.rwa_momentum_hint)}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {(rwa?.items || []).slice(0, 4).map(it => (
              <div
                key={String(it.id)}
                className="rounded-xl border border-white/10 bg-black/30 p-3 text-[12px]"
              >
                <p className="font-medium text-white">{asText(it.title)}</p>
                <p className="text-zinc-500">{asText(it.artist)}</p>
                <p className="tabular-nums text-cyan-300 mt-1">
                  {asText((it.valuation as { score?: number } | undefined)?.score)} / 100
                </p>
                <p className="text-[10px] text-zinc-600">{asText(it.shipment_status || it.status)}</p>
              </div>
            ))}
          </div>
          <Link to="/rwa" className="btn-secondary text-sm">
            Full catalog
          </Link>
        </div>
      )}

      {tab === 'economy' && (
        <div className="space-y-3">
          <EconomicPulse />
          <p className="text-[11px] text-zinc-500">
            Ledger paper until TRO reward/burn TX marked on-chain. Plans:{" '"}
            <code className="text-zinc-400">lia.calldata.tro_economic</code>
          </p>
        </div>
      )}

      {tab === 'audit' && (
        <div className="space-y-2 text-[12px]">
          <Link to="/history" className="btn-secondary text-sm">
            History table
          </Link>
          <pre className="rounded-xl bg-black/40 border border-white/5 p-3 overflow-x-auto text-[10px] text-zinc-400 max-h-48">
            {tick ? JSON.stringify(tick, null, 2).slice(0, 1200) : 'No genesis_tick.json yet'}
          </pre>
        </div>
      )}
    </div>
  )
}
