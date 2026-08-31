/**
 * Trading board LIA — paper-first, calm layout.
 */
import { useEffect, useState } from 'react'
import PageGuide from '../components/PageGuide'
import InfoTip from '../components/InfoTip'
import TxMonitorPanel from '../components/TxMonitorPanel'
import CompoundingPanel from '../components/CompoundingPanel'
import LiaBoardPanel from '../components/LiaBoardPanel'
import PaperLegsPanel from '../components/PaperLegsPanel'
import GuardianStatusPanel from '../components/GuardianStatusPanel'
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
    <div className="animate-fade-in space-y-5 pb-10 max-w-4xl">
      <PageGuide page="trading" />
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

      <header className="space-y-1">
        <p className="section-label text-violet-400/80">LIA · paper</p>
        <h1 className="page-title">Trading</h1>
        <p className="page-sub inline-flex flex-wrap items-center gap-1">
          Board protocole — pas ton wallet retail
          <InfoTip k="paperFirst" />
          <InfoTip k="liaVsUser" />
          <InfoTip k="guardianFirst" />
        </p>
      </header>

      <div className="card space-y-3 !border-violet-500/15">
        <div className="flex items-center gap-1.5">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Intention</p>
          <InfoTip>
            <strong className="text-white block mb-1">Commande LIA</strong>
            <span className="text-zinc-400">
              Texte libre → Doctrine / Guardian. Paper par défaut. Aucun ordre auto sur tes fonds.
            </span>
          </InfoTip>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={cmd}
            onChange={e => setCmd(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && run()}
            placeholder="ex. buy EGLD paper · status board"
            className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-violet-400/40"
          />
          <button
            type="button"
            className="btn-primary text-sm shrink-0"
            disabled={busy || !cmd.trim()}
            onClick={run}
          >
            {busy ? '…' : 'Exécuter'}
          </button>
        </div>
      </div>

      <GuardianStatusPanel />
      <LiaBoardPanel />
      <div className="grid sm:grid-cols-2 gap-4">
        <CompoundingPanel />
        <PaperLegsPanel />
      </div>
      <TxMonitorPanel />
    </div>
  )
}
