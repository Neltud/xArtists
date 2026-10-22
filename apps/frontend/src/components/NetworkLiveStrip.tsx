import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
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
        <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">{xaRender("Mainnet probe")}</p>
        <span className={`text-[10px] ${snap.degraded ? 'text-amber-400/90' : 'text-zinc-600'}`}>
          {xaRender(status)}
        </span>
      </div>
      {xaRender(snap.degraded && (
        <p className="text-[11px] text-amber-200/80 leading-relaxed">
          {xaRender("Probe partiel — un endpoint API n’a pas répondu. Soldes et contrats = last-known. Pas de TX tant que /accounts est KO. ")}</p>
      ))}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[12px]">
        <div>
          <p className="text-zinc-600">{xaRender("Epoch")}</p>
          <p className="text-zinc-200">
            {xaRender(snap.epoch)} · J+{xaRender(supernovaAgeEpochs(snap.epoch))}
          </p>
        </div>
        <div>
          <p className="text-zinc-600">{xaRender("EGLD")}</p>
          <p className="text-zinc-200">
            ${xaRender(snap.egldPrice.toFixed(2))}
            {xaRender(!snap.api.economics ? <span className="text-zinc-600"> *</span> : null)}
          </p>
        </div>
        <div>
          <p className="text-zinc-600">{xaRender("LIA Ops")}</p>
          <p className={funded ? 'text-cyan-300' : 'text-amber-400'}>
            {xaRender(snap.liaOps.balanceEgld.toFixed(3))} {xaRender(" EGLD ")}{xaRender(snap.liaOps.stale ? ' *' : '')}
          </p>
        </div>
        <div>
          <p className="text-zinc-600">{xaRender("Market SC")}</p>
          <p
            className={
              snap.scStale
                ? 'text-zinc-500'
                : snap.sc.marketplace.codeEmpty
                  ? 'text-amber-400/90'
                  : 'text-emerald-400/90'
            }
          >
            {xaRender(snap.scStale ? 'unread' : snap.sc.marketplace.codeEmpty ? 'empty' : 'ouvert')}
          </p>
        </div>
      </div>
      <Link to="/demo" className="text-[11px] text-zinc-500 hover:text-white">
        {xaRender("Tour + gates → ")}</Link>
    </div>
  )
}
