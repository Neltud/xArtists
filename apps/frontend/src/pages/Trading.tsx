/**
 * Board LIA — paper, présentation grand public.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import InfoTip from '../components/InfoTip'
import LiaBoardPanel from '../components/LiaBoardPanel'
import { useLIA } from '../hooks/useLIA'
import TransactionOverlay, { lifecycleToPhase } from '../components/ui/TransactionOverlay'

export default function Trading() {
  const { lifecycle, lastResult, error, runNatural } = useLIA()
  const [overlayClosed, setOverlayClosed] = useState(false)
  const [cmd, setCmd] = useState('')
  const [busy, setBusy] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

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
    <div className="animate-fade-in space-y-5 pb-10 max-w-3xl">
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
          Simulation paper — aucune exécution sur votre portefeuille dans cette démo
          <InfoTip>
            <strong className="text-white block mb-1">Mode paper</strong>
            <span className="text-zinc-400">
              Les commandes alimentent le board LIA en simulation. Pas d’ordre live tant que le mode
              live n’est pas activé explicitement.
            </span>
          </InfoTip>
        </p>
      </header>

      <div className="rounded-2xl border border-white/10 bg-zinc-950/50 p-4 space-y-3">
        <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Intention</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={cmd}
            onChange={e => setCmd(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && run()}
            placeholder="ex. statut board · acheter EGLD paper"
            className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-white/25"
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

      <button
        type="button"
        className="text-[12px] text-zinc-500 hover:text-zinc-300"
        onClick={() => setShowAdvanced(s => !s)}
      >
        {showAdvanced ? 'Masquer les détails' : 'Détails techniques'}
      </button>
      {showAdvanced && (
        <p className="text-[11px] text-zinc-600 leading-relaxed">
          Mode ops : compounding / guardian / legs. Démo publique = board paper.{' '}
          <Link to="/agents" className="text-zinc-400 underline-offset-2 hover:underline">
            Packs
          </Link>
        </p>
      )}
    </div>
  )
}
