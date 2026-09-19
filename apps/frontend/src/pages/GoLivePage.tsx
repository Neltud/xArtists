import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FALLBACK_SNAPSHOT,
  liaOpsFunded,
  probeNetwork,
  type NetworkSnapshot,
} from '../lib/networkProbe'

type Row = { ok: boolean; label: string; value: string; next?: string }

export default function GoLivePage() {
  const [snap, setSnap] = useState<NetworkSnapshot>(FALLBACK_SNAPSHOT)

  useEffect(() => {
    let c = false
    probeNetwork().then(s => {
      if (!c) setSnap(s)
    })
    return () => {
      c = true
    }
  }, [])

  const rows: Row[] = [
    { ok: true, label: 'Paper LIA default', value: 'LIA_LIVE_TRADING=0' },
    { ok: true, label: 'UI fail-closed', value: 'List/Buy/Bid gated' },
    {
      ok: liaOpsFunded(snap.liaOps.balanceEgld),
      label: 'LIA Ops funded',
      value: `${snap.liaOps.balanceEgld.toFixed(4)} EGLD · nonce ${snap.liaOps.nonce}`,
      next: 'PEM local only — never git',
    },
    {
      ok: false,
      label: 'Treasury dest wallets',
      value: 'mission / reserve / reward / ops = null',
      next: 'Remplir data/contracts.json wallets.*',
    },
    {
      ok: !snap.sc.marketplace.codeEmpty,
      label: 'Deploy marketplace',
      value: snap.sc.marketplace.codeEmpty ? 'codeHash null' : 'live',
      next: './scripts/runbook_deploy.sh dry → deploy → verify',
    },
    {
      ok: false,
      label: 'Deploy agents-marketplace',
      value: 'address null',
      next: 'deploy + post_deploy_contracts.py',
    },
    {
      ok: false,
      label: 'VITE_*_CODEHASH_OK',
      value: 'flags OFF until hash non-null',
    },
    { ok: true, label: 'Supernova 600 ms', value: `epoch ${snap.epoch}` },
  ]

  return (
    <div className="page-wrap py-10 space-y-8 max-w-2xl">
      <header className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-400/80">Suite logique</p>
        <h1 className="display text-3xl text-white">GO_LIVE checklist</h1>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Chemin paper → live. Rien n’est allumé. PEM jamais dans le chat, git, ou logs Vellum.
        </p>
      </header>
      <ul className="space-y-2">
        {rows.map(r => (
          <li
            key={r.label}
            className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-white">{r.label}</p>
                <p className="text-[12px] text-zinc-500 mt-0.5">{r.value}</p>
                {r.next && <p className="text-[11px] text-zinc-600 mt-1">next: {r.next}</p>}
              </div>
              <span className={r.ok ? 'text-cyan-400 text-[11px]' : 'text-amber-400 text-[11px]'}>
                {r.ok ? 'OK' : 'OPEN'}
              </span>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-[12px] text-zinc-500">
        Recap : <Link to="/demo">/demo</Link> · docs/ANALYSE_DAPP_COMPLETE.md
      </p>
    </div>
  )
}
