/**
 * Journal d’intents · lecture et paper.
 * Le client public ne broadcaste pas le wallet LIA Ops.
 * publicOpsBroadcastAllowed() est figé à false : VITE_LIA_LIVE_TRADING ne réouvre pas send().
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
import { prepareIntentTx, describeTx } from '../lia/buildIntentTx'
import { publicOpsBroadcastAllowed } from '../lia/publicCommand'
import { useWallet, LIA_WALLET } from '../context/WalletContext'
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
  const opsBroadcast = publicOpsBroadcastAllowed()

  const isLiaOps = !!address && address.toLowerCase() === LIA_WALLET.toLowerCase()

  const refresh = useCallback(() => {
    setRows(loadJournal(12))
  }, [])

  useEffect(() => {
    refresh()
    const id = window.setInterval(refresh, 15_000)
    const onIntent = () => {
      refresh()
      setToast('Intent journalisé en paper. Ce client ne le signe pas.')
    }
    window.addEventListener('lia-user-intent', onIntent)
    return () => {
      window.clearInterval(id)
      window.removeEventListener('lia-user-intent', onIntent)
    }
  }, [refresh])

  const onPrepare = (entry: JournalEntry) => {
    if (opsBroadcast) return
    const prepared = prepareIntentTx(entry)
    if (!prepared.ok) {
      setToast(prepared.reason)
      return
    }
    if (!markAwaitingSignature(entry.id)) {
      setToast('Cet intent est déjà soumis ou confirmé.')
      return
    }
    setToast(`Préparation locale seulement · ${describeTx(prepared.draft)}. Aucun broadcast.`)
    refresh()
  }

  const onAttachHash = async (id: string) => {
    const h = (hashDraft[id] || '').trim()
    if (!connected || !address) {
      requestOpenConnect()
      setToast('Connecte le wallet qui a signé, hors de ce client.')
      return
    }
    const entry = rows.find(row => row.id === id)
    const prepared = entry ? prepareIntentTx(entry) : null
    if (!prepared?.ok) {
      setToast('Transaction attendue indisponible pour cet intent.')
      return
    }
    setBusyId(id)
    const verdict = await verifyUserSignedTx(h, address, prepared.draft)
    setBusyId(null)
    if (!verdict.ok) {
      setToast(verdict.reason)
      return
    }
    if (!attachUserTxHash(id, verdict.hash, true)) {
      setToast('Ce hash est déjà lié à un autre intent.')
      return
    }
    setToast('Tx déjà présente on-chain · journal mis à jour. Ce client ne l’a pas envoyée.')
    refresh()
  }

  return (
    <section className="rounded-2xl border border-purple-500/30 bg-black/45 backdrop-blur-md p-4 space-y-3 shadow-2xl">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-300/80 font-tech">
            Intent journal · {opsBroadcast ? 'broadcast' : 'paper fermé'}
          </p>
          <h3 className="text-sm font-semibold text-white">Signaux → lecture, pas une signature ops</h3>
        </div>
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] text-emerald-100 max-w-[16rem] leading-snug">
          {LIA_BADGE}
        </span>
      </div>

      <p className="text-[11px] text-zinc-500 leading-relaxed">
        Broadcast LIA Ops {opsBroadcast ? 'inattendu' : 'fermé'} dans ce client.
        VITE_LIA_LIVE_TRADING={LIA_LIVE_TRADING ? '1' : '0'} ne réouvre pas ce bouton.
        Plafond documenté {LIA_GUARDS.maxUsdPerTrade} $/opération, {LIA_GUARDS.maxUsdPerDay} $/jour — inactif ici.
        La revue EGLD 16–20 nov 2026 n’est pas une autorisation.
      </p>

      {isLiaOps && (
        <p className="text-[11px] text-amber-100/90 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 mono break-all">
          Wallet historique ops détecté ({LIA_WALLET}). Ce client ne le fait pas signer.
        </p>
      )}

      {toast && (
        <p className="text-[12px] text-amber-100/90 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2">
          {toast}
        </p>
      )}

      {rows.length === 0 ? (
        <p className="text-[12px] text-zinc-500">Aucun intent. Rien n’est injecté automatiquement.</p>
      ) : (
        <ul className="space-y-3 max-h-[28rem] overflow-y-auto">
          {rows.map(e => {
            const prepared = prepareIntentTx(e)
            return (
            <li key={e.id} className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-2">
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
              <p className="text-[10px] text-zinc-500 mono">
                {prepared.ok ? describeTx(prepared.draft) : prepared.reason}
              </p>

              {e.txHash && e.status === 'executed' ? (
                <a
                  href={explorerTxUrl(e.txHash)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-cyan-300 hover:underline mono break-all"
                >
                  Tx {e.txHash.slice(0, 10)}…{e.txHash.slice(-8)} ↗ Explorer
                </a>
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center flex-wrap">
                  <button
                    type="button"
                    className="btn-secondary text-xs min-h-[44px]"
                    disabled={busyId !== null || !prepared.ok || ['pending', 'executed'].includes(e.status)}
                    onClick={() => onPrepare(e)}
                  >
                    Préparer en local
                  </button>
                  <input
                    className="flex-1 rounded-lg border border-white/10 bg-black/50 px-2 py-1.5 text-[11px] text-white mono min-h-[44px]"
                    placeholder="TxHash déjà signé ailleurs (64 hex)"
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
                    className="btn-secondary text-xs min-h-[44px] shrink-0"
                    disabled={busyId === e.id}
                    onClick={() => void onAttachHash(e.id)}
                  >
                    {busyId === e.id ? 'Vérif…' : 'Vérifier hash'}
                  </button>
                </div>
              )}
            </li>
            )
          })}
        </ul>
      )}

      <div className="flex flex-wrap gap-3 text-[11px] text-zinc-500 pt-1">
        <Link to="/xorus" className="hover:text-zinc-300">
          xOrus
        </Link>
        <Link to="/command-center" className="hover:text-zinc-300">
          Command Center
        </Link>
        <Link to="/go-live" className="hover:text-zinc-300">
          État public
        </Link>
      </div>
    </section>
  )
}
