import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FALLBACK_SNAPSHOT,
  liaOpsFunded,
  probeNetwork,
  supernovaAgeEpochs,
  type NetworkSnapshot,
} from '../lib/networkProbe'

export default function NetworkLiveStrip() {
  const [snap, setSnap] = useState<NetworkSnapshot>(FALLBACK_SNAPSHOT)

  useEffect(() => {
    let cancel = false
    probeNetwork().then(s => {
      if (!cancel) setSnap(s)
    })
    return () => {
      cancel = true
    }
  }, [])

  const funded = liaOpsFunded(snap.liaOps.balanceEgld)
  const status = !snap.ok ? 'cache' : snap.degraded ? 'dégradé' : 'live'

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Mainnet probe</p>
        <span className={`text-[10px] ${snap.degraded ? 'text-amber-400/90' : 'text-zinc-600'}`}>
          {status}
        </span>
      </div>
      {snap.degraded && (
        <p className="text-[11px] text-amber-200/80 leading-relaxed">
          Indexer partiel post hardfork v2.1.3.0 — /stats OK, /economics et /accounts KO. Soldes LIA
          et codeHash = last-known. Pas de deploy tant que accounts ne répondent pas.
        </p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[12px]">
        <div>
          <p className="text-zinc-600">Epoch</p>
          <p className="text-zinc-200">
            {snap.epoch} · J+{supernovaAgeEpochs(snap.epoch)}
          </p>
        </div>
        <div>
          <p className="text-zinc-600">EGLD</p>
          <p className="text-zinc-200">
            ${snap.egldPrice.toFixed(2)}
            {!snap.api.economics ? <span className="text-zinc-600"> *</span> : null}
          </p>
        </div>
        <div>
          <p className="text-zinc-600">LIA Ops</p>
          <p className={funded ? 'text-cyan-300' : 'text-amber-400'}>
            {snap.liaOps.balanceEgld.toFixed(3)} EGLD
            {snap.liaOps.stale ? ' *' : ''}
          </p>
        </div>
        <div>
          <p className="text-zinc-600">Market SC</p>
          <p className="text-amber-400/90">
            {snap.scStale ? 'unread' : snap.sc.marketplace.codeEmpty ? 'empty' : 'codeHash'}
          </p>
        </div>
      </div>
      <Link to="/demo" className="text-[11px] text-zinc-500 hover:text-white">
        Tour + gates →
      </Link>
    </div>
  )
}
