/**
 * Trading board LIA — paper + TX monitor.
 */
import { useEffect, useState } from 'react'
import PageGuide from '../components/PageGuide'
import TxMonitorPanel from '../components/TxMonitorPanel'
import CompoundingPanel from '../components/CompoundingPanel'
import LiaBoardPanel from '../components/LiaBoardPanel'
import PaperLegsPanel from '../components/PaperLegsPanel'
import GuardianStatusPanel from '../components/GuardianStatusPanel'
import { useLIA } from '../hooks/useLIA'

export default function Trading() {
  const { lifecycle, lastResult, error, runNatural } = useLIA()
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
    try {
      await runNatural(cmd.trim(), true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="animate-fade-in space-y-6 pb-10">
      <PageGuide page="trading" />

      <header className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.2em] text-violet-400/80 font-semibold">
          LIA desk
        </p>
        <h1 className="display text-3xl sm:text-4xl">Trading</h1>
        <p className="muted">Board protocole paper · monitoring TX si broadcast</p>
      </header>

      <GuardianStatusPanel />

      <div className="card space-y-3 !border-violet-500/15">
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
          Intention (paper · Doctrine)
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            value={cmd}
            onChange={e => setCmd(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && void run()}
            placeholder="ex: swap 1 EGLD USDC · solde"
            className="input-field flex-1 min-w-[200px]"
          />
          <button
            type="button"
            className="btn-primary text-sm"
            disabled={busy}
            onClick={() => void run()}
          >
            {busy ? '…' : 'Valider'}
          </button>
        </div>
        <p className="text-[11px] text-zinc-500">
          Lifecycle: <span className="text-cyan-300 mono">{lifecycle}</span>
          {error && <span className="text-rose-400 ml-2">{error}</span>}
        </p>
        {lastResult && (
          <p className="text-[11px] text-zinc-400 mono break-all">{lastResult.message}</p>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <TxMonitorPanel />
        <LiaBoardPanel />
      </div>

      <CompoundingPanel />
      <PaperLegsPanel />
    </div>
  )
}
