/**
 * Signaux LIA paper — marché · intent · examiner & signer xPortal.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import LiaRibbonOverlay from './LiaRibbonOverlay'
import { loadJournal, markAwaitingSignature, buildUserSignPayload } from '../../lia/intentJournal'
import { LIA_BADGE, LIA_LIVE_TRADING } from '../../config/liaConfig'
import { useWallet } from '../../context/WalletContext'
import { requestOpenConnect } from '../../lib/walletEvents'

export default function LiaSignalPanel() {
  const { connected } = useWallet()
  const [toast, setToast] = useState<string | null>(null)
  const latest = useMemo(() => loadJournal(1)[0] || null, [])

  const conviction = latest?.confidence ?? 0.62
  const volSpread = Math.min(1, Math.abs(latest?.theoreticalPnlUsd || 0.2) * 2 + 0.25)

  const marketSignal = latest
    ? `Tendance ${latest.assetId} · ${latest.action} (conf ${(conviction * 100).toFixed(0)}%)`
    : 'Tendance $TRO/EGLD · lecture paper (en attente de tick)'

  const intentLabel = latest
    ? `${latest.action} · ${latest.amount} ${latest.assetId}`
    : 'Swap 2 EGLD → $TRO (exemple paper)'

  const onExamine = () => {
    if (!connected) {
      requestOpenConnect()
      setToast('Connecte xPortal pour examiner & signer toi-même.')
      return
    }
    if (latest) {
      const payload = buildUserSignPayload(latest)
      markAwaitingSignature(latest.id)
      window.dispatchEvent(
        new CustomEvent('lia-user-intent', { detail: { intentId: latest.id, payload } }),
      )
      try {
        sessionStorage.setItem(
          'xartists_pending_lia_intent',
          JSON.stringify({ id: latest.id, payload }),
        )
      } catch {
        /* */
      }
    }
    setToast('Intent prêt — signe dans xPortal (LIA ne détient aucune clé).')
  }

  return (
    <section className="rounded-2xl border border-cyan-500/30 bg-black/50 backdrop-blur-md p-4 space-y-3 shadow-2xl">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-300/90 font-tech">
            LIA Signals · Blue Ribbon
          </p>
          <h3 className="text-sm font-semibold text-white">Arbitrage paper · non-custodial</h3>
        </div>
        <span className="text-[10px] text-emerald-200/90 border border-emerald-500/25 rounded-full px-2 py-0.5">
          LIVE_TRADING={LIA_LIVE_TRADING ? 1 : 0}
        </span>
      </div>

      <LiaRibbonOverlay conviction={conviction} volSpread={volSpread} />

      <ol className="space-y-2 text-[12px] text-zinc-300">
        <li className="rounded-xl border border-white/10 bg-black/40 px-3 py-2">
          <span className="text-[10px] uppercase text-zinc-500">1 · Signal marché</span>
          <p className="mt-0.5">{marketSignal}</p>
        </li>
        <li className="rounded-xl border border-white/10 bg-black/40 px-3 py-2">
          <span className="text-[10px] uppercase text-zinc-500">2 · LIA Intent</span>
          <p className="mt-0.5 mono text-cyan-100/90">{intentLabel}</p>
          {latest && (
            <p className="text-[11px] text-zinc-500 mt-1">
              PnL th. {latest.theoreticalPnlUsd >= 0 ? '+' : ''}
              {latest.theoreticalPnlUsd.toFixed(3)} $
            </p>
          )}
        </li>
        <li className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 space-y-2">
          <span className="text-[10px] uppercase text-zinc-500">3 · Execution trigger</span>
          <button
            type="button"
            className="btn-primary text-xs min-h-[44px] w-full sm:w-auto"
            onClick={onExamine}
          >
            ⚡ Examiner & Signer xPortal
          </button>
        </li>
      </ol>

      {toast && (
        <p className="text-[12px] text-amber-100/90 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2">
          {toast}
        </p>
      )}

      <p className="text-[10px] text-zinc-600 leading-relaxed">{LIA_BADGE}</p>
      <Link to="/command-center" className="text-[11px] text-cyan-300 hover:underline">
        Ouvrir le journal d’intents →
      </Link>
    </section>
  )
}
