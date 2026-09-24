/**
 * Board LIA — paper + 10 colonnes compounding visibles.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import InfoTip from '../components/InfoTip'
import LiaBoardPanel from '../components/LiaBoardPanel'
import CompoundingPanel from '../components/CompoundingPanel'
import AnnualYieldPanel from '../components/AnnualYieldPanel'
import CrossAgentPanel from '../components/CrossAgentPanel'
import { useLIA } from '../hooks/useLIA'
import TransactionOverlay, { lifecycleToPhase } from '../components/ui/TransactionOverlay'

export default function Trading() {
  const { lifecycle, lastResult, error, runNatural } = useLIA()
  const [overlayClosed, setOverlayClosed] = useState(false)
  const [cmd, setCmd] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const onIntent = (e: Event) => {
      const d = (e as CustomEvent).detail
      if (d?.lip?.raw) setCmd(String(d.lip.raw))
    }
    window.addEventListener('lia-intent', onIntent)
    return () => window.removeEventListener('lia-intent', onIntent)
  }, [])

  const run = async () => {
    if (!cmd.trim()) return
    setBusy(true)
    setOverlayClosed(false)
    try {
      await runNatural(cmd.trim(), true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="animate-fade-in space-y-6 pb-10 max-w-4xl">
      <TransactionOverlay
        phase={
          overlayClosed &&
          (lifecycle === 'success' || lifecycle === 'error' || lifecycle === 'rejected')
            ? 'IDLE'
            : lifecycleToPhase(lifecycle, error)
        }
        detail={error || lastResult?.message}
        txHash={lastResult?.txHash}
        onClose={() => setOverlayClosed(true)}
      />

      <header className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Board</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Trading</h1>
        <p className="text-sm text-zinc-400 inline-flex flex-wrap items-center gap-1 max-w-xl">
          Simulation paper — 10 colonnes compounding · aucune exécution live dans cette démo
          <InfoTip>
            <strong className="text-white block mb-1">Mode paper</strong>
            <span className="text-zinc-400">
              Les commandes alimentent le board LIA en simulation. Live uniquement avec PEM ops +
              Guardian + flag explicite.
            </span>
          </InfoTip>
        </p>
      </header>

      <section className="rounded-2xl border border-violet-500/25 bg-violet-950/20 p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-white">10 colonnes · compounding</h2>
            <p className="text-[12px] text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Chaque colonne = un échelon paper indépendant (paires distinctes). Capital simulé, pas
              les fonds users.
            </p>
          </div>
          <span className="rounded-full bg-violet-500/20 border border-violet-400/30 px-2.5 py-1 text-[10px] font-mono text-violet-200">
            paper · S1 core
          </span>
        </div>
        <div className="grid sm:grid-cols-3 gap-2 text-[11px]">
          <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2">
            <p className="text-zinc-500 uppercase tracking-wider text-[9px]">S1 core (~70 %)</p>
            <p className="text-zinc-200 mt-0.5 font-medium">TP +1 % · SL −0,5 %</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2">
            <p className="text-zinc-500 uppercase tracking-wider text-[9px]">S05 satellite (~15 %)</p>
            <p className="text-zinc-200 mt-0.5 font-medium">TP +0,5 % · SL −0,35 %</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2">
            <p className="text-zinc-500 uppercase tracking-wider text-[9px]">S2 satellite (~15 %)</p>
            <p className="text-zinc-200 mt-0.5 font-medium">TP +2 % · SL −1 %</p>
          </div>
        </div>
        <ul className="text-[11px] text-zinc-500 space-y-1 list-disc list-inside">
          <li>Fees ~30 bps round-trip · gas ~0,04 $ / leg (hypothèses paper)</li>
          <li>Sink profits simulé en USDC · cible trésorerie 1 M$ (roadmap, pas une promesse)</li>
          <li>
            Data : <code className="text-zinc-400">compounding_echelons.json</code>
          </li>
        </ul>
      </section>

      <CompoundingPanel />
      <AnnualYieldPanel />

      <div className="rounded-2xl border border-white/10 bg-zinc-950/50 p-4 space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          Commande paper
        </p>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600"
            placeholder="ex. momentum TRO paper"
            value={cmd}
            onChange={e => setCmd(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && run()}
          />
          <button
            type="button"
            className="btn-primary text-sm shrink-0"
            disabled={busy || !cmd.trim()}
            onClick={run}
          >
            {busy ? '…' : 'Envoyer'}
          </button>
        </div>
      </div>

      <LiaBoardPanel />
      <CrossAgentPanel />

      <p className="text-[11px] text-zinc-600 leading-relaxed">
        <Link to="/agents" className="text-zinc-400 hover:text-white underline-offset-2 hover:underline">
          Packs agents
        </Link>
        {' · '}
        <Link to="/slot" className="text-zinc-400 hover:text-white underline-offset-2 hover:underline">
          Slot 3×3
        </Link>
        {' · '}
        <Link to="/museum" className="text-zinc-400 hover:text-white underline-offset-2 hover:underline">
          Musée
        </Link>
      </p>
    </div>
  )
}
