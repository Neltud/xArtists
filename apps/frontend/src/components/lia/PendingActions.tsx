/** Pending HITL proposals — WAITING FOR SIGNATURE (static Pages: approve = local + CLI). */
import { useEffect, useState } from 'react'
import { asText } from '../../lib/safeRender'

type Prop = {
  id?: string
  slot?: number
  status?: string
  action?: string
  size_egld?: number
  pair?: string
  tx_hash?: string
  note?: string
}

async function loadProposals(): Promise<Prop[]> {
  const bases = [
    `${import.meta.env.BASE_URL || '/'}data/`,
    'https://neltud.github.io/xArtists/data/',
  ]
  for (const b of bases) {
    try {
      const r = await fetch(`${b}strike_proposals.json`, { cache: 'no-store' })
      if (!r.ok) continue
      const j = await r.json()
      return Array.isArray(j.proposals) ? j.proposals : []
    } catch {
      /* */
    }
  }
  return []
}

function uiApproved(): Set<string> {
  try {
    const raw = localStorage.getItem('xartists_ui_approvals') || '[]'
    return new Set(JSON.parse(raw))
  } catch {
    return new Set()
  }
}

function markUiApproved(id: string) {
  const s = uiApproved()
  s.add(id)
  localStorage.setItem('xartists_ui_approvals', JSON.stringify([...s]))
}

export default function PendingActions() {
  const [items, setItems] = useState<Prop[]>([])
  const [approved, setApproved] = useState<Set<string>>(() => uiApproved())

  useEffect(() => {
    let c = false
    const tick = async () => {
      const p = await loadProposals()
      if (!c) setItems(p)
    }
    void tick()
    const id = window.setInterval(() => void tick(), 20_000)
    return () => {
      c = true
      window.clearInterval(id)
    }
  }, [])

  const pending = items.filter(x => x.status === 'pending_human')

  if (!pending.length) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2 text-[11px] text-zinc-500">
        No pending HITL proposals
      </div>
    )
  }

  return (
    <section className="rounded-xl border border-amber-500/25 bg-amber-500/[0.05] p-3 space-y-2">
      <p className="text-[10px] uppercase tracking-wider text-amber-200/90 font-semibold">
        Pending actions
      </p>
      {pending.map(p => {
        const id = String(p.id || '')
        const localOk = approved.has(id)
        const cmd = `LIA_LIVE_TRADING=1 PYTHONPATH=. python -m lia.guardian.strike_deployer --execute-proposal ${id}`
        return (
          <div key={id} className="rounded-lg bg-black/40 border border-white/5 p-2 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-500/40 text-amber-200 animate-pulse">
                WAITING FOR SIGNATURE
              </span>
              <span className="text-[11px] text-zinc-300">
                Slot {asText(p.slot)} · {asText(p.action)} · {asText(p.size_egld)} EGLD
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 mono break-all">{asText(id)}</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-primary text-[11px] !py-1"
                onClick={() => {
                  markUiApproved(id)
                  setApproved(new Set(uiApproved()))
                  void navigator.clipboard?.writeText(cmd)
                }}
              >
                {localOk ? 'UI approved · CLI copied' : 'Approve (copy CLI)'}
              </button>
            </div>
            <p className="text-[9px] text-zinc-600">
              Pages is static — UI approval records intent + copies ops command. Broadcast still needs
              LIA_LIVE_TRADING=1 + executor.
            </p>
          </div>
        )
      })}
    </section>
  )
}
