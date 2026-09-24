/**
 * Historique paper — intents checkout + packs locaux (pas L402 mock).
 * Route: /payments
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AGENT_PACKS } from '../config/agentPacks'
import { loadOwnedPacks } from '../lib/nftPacks'

type Intent = {
  packId?: string
  provider?: string
  amount?: number | string
  currency?: string
  paper_only?: boolean
  ts?: number
  address?: string
  status?: string
}

function readIntent(): Intent | null {
  try {
    const raw = localStorage.getItem('xartists_access_checkout_intent')
    if (!raw) return null
    return JSON.parse(raw) as Intent
  } catch {
    return null
  }
}

function readIntentLog(): Intent[] {
  try {
    const raw = localStorage.getItem('xartists_access_checkout_log')
    if (!raw) return []
    const j = JSON.parse(raw)
    return Array.isArray(j) ? j : []
  } catch {
    return []
  }
}

export default function PaymentHistory() {
  const [intent] = useState(() => readIntent())
  const [log] = useState(() => readIntentLog())
  const owned = useMemo(() => loadOwnedPacks(), [])

  const rows: { when: string; label: string; detail: string; kind: string }[] = []

  if (intent) {
    const pack = AGENT_PACKS.find(p => p.id === intent.packId)
    rows.push({
      when: intent.ts ? new Date(intent.ts).toLocaleString() : '—',
      label: pack?.name || intent.packId || 'Pack',
      detail: `${intent.provider || 'paper'} · ${intent.amount ?? '—'} ${intent.currency || 'EUR'}`,
      kind: intent.paper_only ? 'paper intent' : 'checkout',
    })
  }
  for (const item of log.slice().reverse()) {
    const pack = AGENT_PACKS.find(p => p.id === item.packId)
    rows.push({
      when: item.ts ? new Date(item.ts).toLocaleString() : '—',
      label: pack?.name || item.packId || 'Pack',
      detail: `${item.provider || 'paper'} · ${item.amount ?? '—'}`,
      kind: item.status || 'log',
    })
  }
  for (const id of owned) {
    const pack = AGENT_PACKS.find(p => p.id === id)
    rows.push({
      when: 'local',
      label: pack?.name || id,
      detail: 'Pack marqué possédé (paper / device)',
      kind: 'owned',
    })
  }

  return (
    <div className="animate-fade-in max-w-xl mx-auto space-y-6 pb-12">
      <header className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Compte</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Paiements paper</h1>
        <p className="text-sm text-zinc-500">
          Intentions checkout et packs locaux sur cet appareil — pas un extrait bancaire on-chain.
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-zinc-950/50 px-4 py-8 text-center space-y-3">
          <p className="text-sm text-zinc-500">Aucun historique sur cet appareil.</p>
          <Link to="/agents" className="text-sm text-violet-300 underline">
            Voir les packs
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((r, i) => (
            <li
              key={`${r.label}-${i}`}
              className="rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-3 flex justify-between gap-3"
            >
              <div>
                <p className="text-sm font-medium text-white">{r.label}</p>
                <p className="text-[12px] text-zinc-500 mt-0.5">{r.detail}</p>
                <p className="text-[10px] text-zinc-600 mt-1">{r.when}</p>
              </div>
              <span className="text-[10px] uppercase tracking-wide text-zinc-500 shrink-0">{r.kind}</span>
            </li>
          ))}
        </ul>
      )}

      <p className="text-[12px] text-zinc-600">
        <Link to="/my-packs" className="text-zinc-400 hover:text-white underline">
          My Packs
        </Link>
        {' · '}
        <Link to="/ads" className="text-zinc-400 hover:text-white underline">
          Ads
        </Link>
        {' · '}
        <Link to="/tip" className="text-zinc-400 hover:text-white underline">
          Tip
        </Link>
      </p>
    </div>
  )
}
