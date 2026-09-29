/**
 * Board LIA — paper MTM + desk pack (live-in avec Grok).
 */
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import InfoTip from '../components/InfoTip'
import LiaBoardPanel from '../components/LiaBoardPanel'
import CompoundingPanel from '../components/CompoundingPanel'
import AnnualYieldPanel from '../components/AnnualYieldPanel'
import CrossAgentPanel from '../components/CrossAgentPanel'
import PaperLiveDesk from '../components/PaperLiveDesk'
import { useLIA } from '../hooks/useLIA'
import TransactionOverlay, { lifecycleToPhase } from '../components/ui/TransactionOverlay'
import { AGENT_PACKS, type PackId } from '../config/agentPacks'
import { ROOM_META } from '../lib/holderAccess'

const PACK_IDS: PackId[] = ['pulse', 'yield', 'sentinel']

export default function Trading() {
  const { lifecycle, lastResult, error, runNatural } = useLIA()
  const [overlayClosed, setOverlayClosed] = useState(false)
  const [cmd, setCmd] = useState('')
  const [busy, setBusy] = useState(false)
  const [params] = useSearchParams()
  const packParam = params.get('pack')
  const desk = params.get('desk') === '1'
  const packId = PACK_IDS.includes(packParam as PackId) ? (packParam as PackId) : null
  const pack = packId ? AGENT_PACKS.find(p => p.id === packId) : null

  useEffect(() => {
    const onIntent = (e: Event) => {
      const d = (e as CustomEvent).detail
      if (d?.lip?.raw) setCmd(String(d.lip.raw))
    }
    window.addEventListener('lia-intent', onIntent)
    return () => window.removeEventListener('lia-intent', onIntent)
  }, [])

  useEffect(() => {
    if (pack && desk) {
      setCmd(`paper ${pack.id} board · strategies ${pack.strategies.join(' ')}`)
    }
  }, [pack, desk])

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
        <p className="section-label">Board</p>
        <h1 className="section-title display">Trading</h1>
        <div className="atelier-title-rule" aria-hidden />
        <p className="text-sm text-zinc-400 inline-flex flex-wrap items-center gap-1 max-w-xl">
          Paper MTM · prix marche live · desk Grok / LIA — execution on-chain seulement si tu signes
          <InfoTip>
            <strong className="text-white block mb-1">Mode paper + signature</strong>
            <span className="text-zinc-400">
              Positions paper par defaut. Les TX reelles passent par TxShell / xPortal — jamais de PEM
              navigateur.
            </span>
          </InfoTip>
        </p>
      </header>

      {pack && (
        <div className="rounded-2xl border border-violet-500/30 bg-violet-950/25 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-violet-300/80 font-semibold">
              Desk live-in · pack {pack.name}
            </p>
            <p className="text-[12px] text-zinc-400 mt-0.5">
              {pack.icon} {pack.strategies.join(' · ')} · clone LIA paper
            </p>
          </div>
          <Link to={ROOM_META[pack.id].path} className="btn-secondary text-xs">
            Retour salle
          </Link>
        </div>
      )}

      <PaperLiveDesk />

      <section className="card space-y-3">
        <p className="section-label">10 colonnes compounding (paper)</p>
        <div className="grid sm:grid-cols-2 gap-2 text-[12px]">
          <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2">
            <p className="text-zinc-500 uppercase tracking-wider text-[9px]">Core (~70 %)</p>
            <p className="text-zinc-200 mt-0.5 font-medium">TP ladder +1 % · compounding</p>
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
      </section>

      <CompoundingPanel />
      <AnnualYieldPanel />

      <div className="card space-y-3">
        <p className="section-label">Commande paper · Grok / LIA</p>
        <div className="flex gap-2">
          <input
            className="input-field flex-1"
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
        <Link to="/my-packs" className="text-zinc-400 hover:text-white underline-offset-2 hover:underline">
          My Packs / salles
        </Link>
        {' · '}
        <Link to="/agents" className="text-zinc-400 hover:text-white underline-offset-2 hover:underline">
          Packs agents
        </Link>
        {' · '}
        <Link to="/museum" className="text-zinc-400 hover:text-white underline-offset-2 hover:underline">
          Musee
        </Link>
      </p>
    </div>
  )
}
