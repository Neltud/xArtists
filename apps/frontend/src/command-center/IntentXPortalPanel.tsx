/**
 * Journal d’intents paper. Aucun broadcast : le hash collé est vérifié on-chain.
 */
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LIA_BADGE, LIA_GUARDS, LIA_LIVE_TRADING } from '../config/liaConfig'
import {
  attachUserTxHash,
  explorerTxUrl,
  loadJournal,
  markAwaitingSignature,
  type JournalEntry,
} from '../lia/intentJournal'
import { useWallet } from '../context/WalletContext'
import { requestOpenConnect } from '../lib/walletEvents'
import { verifyUserSignedTx } from '../lia/verifyUserTx'

const STATUS_LABEL: Record<JournalEntry['status'], string> = {
  paper: 'Paper',
  awaiting_signature: 'Awaiting xPortal',
  pending: 'Pending',
  executed: 'Executed',
  failed: 'Failed',
}

export default function IntentXPortalPanel() {
  const { connected, address } = useWallet()
  const [rows, setRows] = useState<JournalEntry[]>([])
  const [hashDraft, setHashDraft] = useState<Record<string, string>>({})
  const [busyId, setBusyId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const refresh = useCallback(() => {
    setRows(loadJournal(12))
  }, [])

  useEffect(() => {
    refresh()
    const id = window.setInterval(refresh, 15_000)
    return () => window.clearInterval(id)
  }, [refresh])

  const onPrepare = (entry: JournalEntry) => {
    markAwaitingSignature(entry.id)
    window.dispatchEvent(
      new CustomEvent('lia-user-intent', {
        detail: { intentId: entry.id, mode: 'paper_track_only' },
      }),
    )
    setToast(
      'Suivi ouvert. Aucune transaction n’est construite ici : LIA n’a pas de clé. Signe toi-même dans xPortal, puis colle le hash — il est vérifié (succès + ton adresse).',
    )
    refresh()
  }

  const onAttachHash = async (id: string) => {
    const h = (hashDraft[id] || '').trim()
    if (!connected || !address) {
      requestOpenConnect()
      setToast('Connecte ton wallet. Un hash n’est lié que s’il part de cette adresse.')
      return
    }
    setBusyId(id)
    const verdict = await verifyUserSignedTx(h, address)
    setBusyId(null)
    if (!verdict.ok) {
      setToast(verdict.reason)
      return
    }
    attachUserTxHash(id, verdict.hash, true)
    setToast('Tx confirmée sur l’API MultiversX. Signature utilisateur — pas un trade agent.')
    refresh()
  }

  return (
    <section className="rounded-2xl border border-purple-500/30 bg-black/45 backdrop-blur-md p-4 space-y-3 shadow-2xl">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-300/80 font-tech">
            Intent journal · paper
          </p>
          <h3 className="text-sm font-semibold text-white">Signaux → signature xPortal</h3>
        </div>
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] text-emerald-100 max-w-[16rem] leading-snug">
          {LIA_BADGE}
        </span>
      </div>

      <p className="text-[11px] text-zinc-500 leading-relaxed">
        LIA_LIVE_TRADING={String(LIA_LIVE_TRADING ? 1 : 0)} · caps paper {LIA_GUARDS.maxUsdPerTrade}$/trade ·{' '}
        {LIA_GUARDS.maxUsdPerDay}$/jour · allowlist {LIA_GUARDS.allowlist.join(', ')}. Le bouton ne broadcast
        rien : il ouvre le suivi. Un hash n’est « exécuté » qu’après preuve API.
      </p>

      {toast && (
        <p className="text-[12px] text-amber-100/90 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2">
          {toast}
        </p>
      )}

      {rows.length === 0 ? (
        <p className="text-[12px] text-zinc-500">
          Aucun intent paper pour l’instant. Le cycle de décision alimente ce journal en localStorage.
        </p>
      ) : (
        <ul className="space-y-3 max-h-[28rem] overflow-y-auto">
          {rows.map(e => (
            <li
              key={e.id}
              className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[12px] font-medium text-zinc-100">
                  {e.action} · {e.assetId}{' '}
                  <span className="text-zinc-500 font-normal">× {e.amount}</span>
                </p>
                <span className="text-[10px] uppercase tracking-wide text-zinc-400">
                  {STATUS_LABEL[e.status]}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">
                {e.strategy} · conf {(e.confidence * 100).toFixed(0)}% · PnL th.{' '}
                <span className={e.theoreticalPnlUsd >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                  {e.theoreticalPnlUsd >= 0 ? '+' : ''}
                  {e.theoreticalPnlUsd.toFixed(3)} $
                </span>
              </p>
              <p className="text-[11px] text-zinc-600 line-clamp-2">{e.reason}</p>

              {e.txHash ? (
                <a
                  href={explorerTxUrl(e.txHash)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-cyan-300 hover:underline mono break-all"
                >
                  Tx {e.txHash.slice(0, 10)}…{e.txHash.slice(-8)} ↗ Explorer
                </a>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      className="btn-secondary text-xs min-h-[40px]"
                      onClick={() => onPrepare(e)}
                    >
                      Suivi signature
                    </button>
                    <input
                      className="flex-1 rounded-lg border border-white/10 bg-black/50 px-2 py-1.5 text-[11px] text-white mono min-h-[40px]"
                      placeholder="TxHash signé par toi (64 hex)"
                      value={hashDraft[e.id] || ''}
                      onChange={ev =>
                        setHashDraft(d => ({
                          ...d,
                          [e.id]: ev.target.value,
                        }))
                      }
                    />
                    <button
                      type="button"
                      className="btn-primary text-xs min-h-[40px] shrink-0"
                      disabled={busyId === e.id}
                      onClick={() => void onAttachHash(e.id)}
                    >
                      {busyId === e.id ? 'Vérif…' : 'Vérifier'}
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-3 text-[11px] text-zinc-500 pt-1">
        <Link to="/lia" className="hover:text-zinc-300">
          LIA Hub
        </Link>
        <Link to="/agents" className="hover:text-zinc-300">
          Packs Agent
        </Link>
        <Link to="/trading" className="hover:text-zinc-300">
          Board paper
        </Link>
      </div>
    </section>
  )
}
