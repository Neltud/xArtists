/**
 * Modal connexion — xPortal / extension + accès simplifié (Web Wallet / passkey path).
 * Écoute OPEN_CONNECT_EVENT (requestOpenConnect).
 */
import { useEffect, useState } from 'react'
import { useWallet } from '../context/WalletContext'
import { loginWithXPortalMainnet } from '../lib/xportalWc'
import { OPEN_CONNECT_EVENT } from '../lib/walletEvents'
import { useI18n } from '../i18n/I18nContext'

const WEB_WALLET = 'https://wallet.multiversx.com/unlock'

export function generateGuestReceiveId(): string {
  const t = Date.now().toString(36)
  const r = Math.random().toString(36).slice(2, 10)
  return `xa_guest_${t}_${r}`
}

export function saveGuestReceiveId(id: string, meta?: Record<string, unknown>) {
  try {
    localStorage.setItem(
      'xartists_guest_receive',
      JSON.stringify({ id, ...meta, ts: Date.now() }),
    )
  } catch {
    /* */
  }
}

export function loadGuestReceiveId(): string | null {
  try {
    const raw = localStorage.getItem('xartists_guest_receive')
    if (!raw) return null
    const j = JSON.parse(raw) as { id?: string }
    return typeof j.id === 'string' ? j.id : null
  } catch {
    return null
  }
}

type Props = {
  /** controlled optional — if omitted, self-manages via OPEN_CONNECT_EVENT */
  open?: boolean
  onClose?: () => void
  /** after successful connect */
  onConnected?: (address: string) => void
}

export default function LoginModal({ open: controlledOpen, onClose, onConnected }: Props) {
  const { t } = useI18n()
  const { connect } = useWallet()
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const [error, setError] = useState('')
  const [wcUri, setWcUri] = useState<string | null>(null)
  const [manual, setManual] = useState('')
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState<'classic' | 'simple'>('classic')

  useEffect(() => {
    if (controlledOpen != null) return
    const on = () => {
      setInternalOpen(true)
      setError('')
      setWcUri(null)
    }
    window.addEventListener(OPEN_CONNECT_EVENT, on)
    return () => window.removeEventListener(OPEN_CONNECT_EVENT, on)
  }, [controlledOpen])

  useEffect(() => {
    const onUri = (e: Event) => {
      const u = (e as CustomEvent).detail?.uri
      if (typeof u === 'string') setWcUri(u)
    }
    window.addEventListener('xartists-wc-uri', onUri)
    return () => window.removeEventListener('xartists-wc-uri', onUri)
  }, [])

  const close = () => {
    if (busy) return
    setInternalOpen(false)
    onClose?.()
    setError('')
    setWcUri(null)
  }

  if (!open) return null

  const runXPortal = async () => {
    setBusy(true)
    setError('xPortal…')
    setWcUri(null)
    try {
      const res = await loginWithXPortalMainnet(p => {
        if (p.uri) setWcUri(p.uri)
        if (p.message) setError(p.message)
      })
      if (!res.ok) {
        setError(res.error)
        return
      }
      const linked = connect(res.address, 'xportal')
      if (!linked.ok) {
        setError(linked.error || 'Session refusée')
        return
      }
      onConnected?.(res.address)
      close()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur xPortal')
    } finally {
      setBusy(false)
    }
  }

  const runExtension = async () => {
    setBusy(true)
    setError('')
    try {
      const w = window as unknown as { elrondWallet?: { getAddress?: () => Promise<string> } }
      if (!w.elrondWallet?.getAddress) {
        setError('Extension MultiversX introuvable')
        return
      }
      const addr = await w.elrondWallet.getAddress()
      const r = connect(String(addr).trim(), 'defi_wallet')
      if (!r.ok) setError(r.error || 'Échec')
      else {
        onConnected?.(String(addr).trim())
        close()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setBusy(false)
    }
  }

  const runPaste = () => {
    setError('')
    if (!/^erd1[a-z0-9]{58}$/i.test(manual.trim())) {
      setError('Adresse erd1 invalide')
      return
    }
    const r = connect(manual.trim(), 'paste_readonly')
    if (!r.ok) setError(r.error || 'Échec')
    else {
      onConnected?.(manual.trim())
      close()
    }
  }

  const runSimpleWebWallet = () => {
    // Non-custodial: user creates/unlocks wallet on official MVX web wallet
    window.open(WEB_WALLET, '_blank', 'noopener,noreferrer')
    setError(
      'Web Wallet ouvert. Crée ou déverrouille un compte, copie erd1, colle-la ci-dessous (ou reviens avec xPortal).',
    )
    setMode('classic')
  }

  const runGuestForFiat = () => {
    const id = generateGuestReceiveId()
    saveGuestReceiveId(id, { purpose: 'fiat_pack_pending' })
    setError(
      `Identifiant réception temporaire : ${id}. Utilise-le au checkout Fiat — le mint sera lié après webhook dès qu’un erd1 est fourni (email / claim).`,
    )
  }

  return (
    <div
      className="fixed inset-0 z-[85] flex items-end justify-center bg-black/75 p-3 backdrop-blur-sm sm:items-center"
      onClick={close}
      role="presentation"
    >
      <div
        className="glass-hud w-full max-w-md space-y-4 p-5 shadow-2xl"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal
        aria-label={t('common.connect')}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white font-tech">{t('common.connect')}</h2>
            <p className="mt-1 text-[12px] text-zinc-500">
              Non-custodial — aucune clé privée stockée par xArtists.
            </p>
          </div>
          <button type="button" className="btn-secondary px-2 py-1 text-xs" onClick={close}>
            ×
          </button>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('classic')}
            className={`flex-1 rounded-xl border px-2 py-2 text-[12px] ${
              mode === 'classic'
                ? 'border-cyan-400/40 bg-cyan-500/10 text-white'
                : 'border-white/10 text-zinc-500'
            }`}
          >
            Classique
          </button>
          <button
            type="button"
            onClick={() => setMode('simple')}
            className={`flex-1 rounded-xl border px-2 py-2 text-[12px] ${
              mode === 'simple'
                ? 'border-violet-400/40 bg-violet-500/10 text-white'
                : 'border-white/10 text-zinc-500'
            }`}
          >
            Accès simplifié
          </button>
        </div>

        {mode === 'classic' && (
          <div className="space-y-3">
            {wcUri && (
              <div className="rounded-xl border border-violet-500/25 bg-violet-500/5 p-3">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(wcUri)}`}
                  alt="QR WalletConnect"
                  width={200}
                  height={200}
                  className="mx-auto rounded-lg bg-white p-2"
                />
                <p className="mt-2 text-center text-[11px] text-zinc-500">Scanne avec xPortal</p>
              </div>
            )}
            <button type="button" className="btn-primary w-full" disabled={busy} onClick={() => void runXPortal()}>
              {busy ? 'En attente…' : 'xPortal / WalletConnect'}
            </button>
            <button type="button" className="btn-secondary w-full" disabled={busy} onClick={() => void runExtension()}>
              Extension DeFi Wallet
            </button>
            <div className="space-y-2 border-t border-white/10 pt-3">
              <p className="text-[11px] text-zinc-600">Lecture seule — coller erd1</p>
              <input
                value={manual}
                onChange={e => setManual(e.target.value)}
                placeholder="erd1…"
                className="mono w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-violet-400/40"
              />
              <button type="button" className="btn-secondary w-full text-xs" onClick={runPaste}>
                Lecture seule
              </button>
            </div>
          </div>
        )}

        {mode === 'simple' && (
          <div className="space-y-3">
            <p className="text-[12px] text-zinc-400 leading-relaxed">
              Pour un achat <strong className="text-zinc-200">Fiat</strong> sans extension : crée un
              wallet via le Web Wallet officiel MultiversX (ou passkey côté wallet quand dispo),
              puis reviens coller ton <span className="mono text-zinc-300">erd1</span>. xArtists ne
              détient jamais tes fonds.
            </p>
            <button type="button" className="btn-primary w-full" onClick={runSimpleWebWallet}>
              Ouvrir Web Wallet MVX ↗
            </button>
            <button type="button" className="btn-secondary w-full text-sm" onClick={runGuestForFiat}>
              Identifiant temporaire (fiat sans erd1 encore)
            </button>
            <p className="text-[10px] text-zinc-600">
              L’ID temporaire lie le paiement FC/Stripe au futur mint — tu devras revendiquer avec un
              erd1 (claim). Pas un compte titres. Pas LIA broker.
            </p>
          </div>
        )}

        {error && <p className="text-[12px] leading-relaxed text-amber-200/90">{error}</p>}
      </div>
    </div>
  )
}
