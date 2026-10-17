/**
 * Journal d’intents · paper ou LIVE user-sign (xPortal).
 * LIA_LIVE_TRADING=1 → bouton Signer xPortal construit une TX MultiversX.
 */
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LIA_BADGE, LIA_GUARDS, LIA_LIVE_TRADING } from '../config/liaConfig'
import {
  attachUserTxHash,
  ensureBootstrapIntent,
  explorerTxUrl,
  loadJournal,
  markAwaitingSignature,
  markPending,
  type JournalEntry,
} from '../lia/intentJournal'
import { buildTxFromIntent, describeTx } from '../lia/buildIntentTx'
import { useWallet, LIA_WALLET } from '../context/WalletContext'
import { useSendTransaction } from '../hooks/useSendTransaction'
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
  const { send } = useSendTransaction()
  const [rows, setRows] = useState<JournalEntry[]>([])
  const [hashDraft, setHashDraft] = useState<Record<string, string>>({})
  const [busyId, setBusyId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const isLiaOps = !!address && address.toLowerCase() === LIA_WALLET.toLowerCase()

  const refresh = useCallback(() => {
    if (LIA_LIVE_TRADING) ensureBootstrapIntent()
    setRows(loadJournal(12))
  }, [])

  useEffect(() => {
    refresh()
    const id = window.setInterval(refresh, 15_000)
    const onIntent = (ev: Event) => {
      const detail = (ev as CustomEvent<{ intentId?: string; payload?: { summary?: string } }>).detail
      refresh()
      if (detail?.intentId) {
        setToast(
          `Intent ${detail.intentId.slice(0, 22)} prêt · ${detail.payload?.summary || 'signature xPortal'}`,
        )
      }
    }
    window.addEventListener('lia-user-intent', onIntent)
    return () => {
      window.clearInterval(id)
      window.removeEventListener('lia-user-intent', onIntent)
    }
  }, [refresh])

  const onPrepare = (entry: JournalEntry) => {
    markAwaitingSignature(entry.id)
    const draft = buildTxFromIntent(entry)
    setToast(
      LIA_LIVE_TRADING
        ? `Prêt à signer · ${describeTx(draft)} · wallet LIA via xPortal`
        : 'Suivi ouvert (paper). Active VITE_LIA_LIVE_TRADING=1 pour broadcaster une TX.',
    )
    refresh()
  }

  const onSignXPortal = async (entry: JournalEntry) => {
    if (!connected || !address) {
      requestOpenConnect()
      setToast('Connecte le wallet LIA dans xPortal.')
      return
    }
    if (!LIA_LIVE_TRADING) {
      setToast('LIA_LIVE_TRADING=0 — rebuild avec VITE_LIA_LIVE_TRADING=1.')
      return
    }
    if (!isLiaOps) {
      setToast(
        `Connecte le wallet protocole LIA (${LIA_WALLET.slice(0, 12)}…) dans xPortal pour signer les intents ops.`,
      )
      return
    }
    setBusyId(entry.id)
    markAwaitingSignature(entry.id)
    const draft = buildTxFromIntent(entry)
    try {
      const res = await send([draft], {
        processingMessage: `Intent ${entry.action}…`,
        successMessage: 'Intent soumis à xPortal',
        errorMessage: 'Signature / broadcast échoué',
      })
      if (res.error) {
        setToast(res.error)
        setBusyId(null)
        refresh()
        return
      }
      markPending(entry.id, res.sessionId || undefined)
      setToast(
        `TX envoyée à xPortal · ${describeTx(draft)}. Confirme dans le wallet, puis colle le TxHash si besoin.`,
      )
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Erreur signature')
    }
    setBusyId(null)
    refresh()
  }

  const onAttachHash = async (id: string) => {
    const h = (hashDraft[id] || '').trim()
    if (!connected || !address) {
      requestOpenConnect()
      setToast('Connecte le wallet qui a signé.')
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
    setToast('Tx confirmée on-chain · journal mis à jour.')
    refresh()
  }

  return (
    <section className="rounded-2xl border border-purple-500/30 bg-black/45 backdrop-blur-md p-4 space-y-3 shadow-2xl">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-300/80 font-tech">
            Intent journal · {LIA_LIVE_TRADING ? 'LIVE user-sign' : 'paper'}
          </p>
          <h3 className="text-sm font-semibold text-white">Signaux → signature xPortal</h3>
        </div>
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] text-emerald-100 max-w-[16rem] leading-snug">
          {LIA_BADGE}
        </span>
      </div>

      <p className="text-[11px] text-zinc-500 leading-relaxed">
        LIA_LIVE_TRADING={LIA_LIVE_TRADING ? 1 : 0} · bootstrap {LIA_GUARDS.bootstrapEgld} EGLD ·
        caps {LIA_GUARDS.maxUsdPerTrade}$/trade · allowlist {LIA_GUARDS.allowlist.join(', ')}.
        {LIA_LIVE_TRADING
          ? ' Connecte le wallet LIA ops dans xPortal puis « Signer xPortal ».'
          : ' Mode paper : colle un hash après signature manuelle, ou rebuild avec VITE_LIA_LIVE_TRADING=1.'}
      </p>

      {LIA_LIVE_TRADING && (
        <p className="text-[11px] text-amber-100/90 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 mono break-all">
          Wallet LIA ops attendu : {LIA_WALLET}
          {isLiaOps ? ' · ✅ connecté' : connected ? ' · ⚠️ autre adresse' : ' · non connecté'}
        </p>
      )}

      {toast && (
        <p className="text-[12px] text-amber-100/90 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2">
          {toast}
        </p>
      )}

      {rows.length === 0 ? (
        <div className="space-y-2">
          <p className="text-[12px] text-zinc-500">Aucun intent. En live, un bootstrap est injecté auto.</p>
          {LIA_LIVE_TRADING && (
            <button
              type="button"
              className="btn-secondary text-xs min-h-[44px]"
              onClick={() => {
                ensureBootstrapIntent()
                refresh()
              }}
            >
              Créer intent bootstrap live=1
            </button>
          )}
        </div>
      ) : (
        <ul className="space-y-3 max-h-[28rem] overflow-y-auto">
          {rows.map(e => (
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
              <p className="text-[10px] text-zinc-600 mono">{describeTx(buildTxFromIntent(e))}</p>

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
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center flex-wrap">
                    <button
                      type="button"
                      className="btn-secondary text-xs min-h-[44px]"
                      onClick={() => onPrepare(e)}
                    >
                      Préparer TX
                    </button>
                    {LIA_LIVE_TRADING && (
                      <button
                        type="button"
                        className="btn-primary text-xs min-h-[44px]"
                        disabled={busyId === e.id}
                        onClick={() => void onSignXPortal(e)}
                      >
                        {busyId === e.id ? 'xPortal…' : 'Signer xPortal'}
                      </button>
                    )}
                    <input
                      className="flex-1 rounded-lg border border-white/10 bg-black/50 px-2 py-1.5 text-[11px] text-white mono min-h-[44px]"
                      placeholder="TxHash (64 hex) après signature"
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
        <Link to="/command-center" className="hover:text-zinc-300">
          Command Center
        </Link>
        <Link to="/agents" className="hover:text-zinc-300">
          Packs Agent
        </Link>
      </div>
    </section>
  )
}
