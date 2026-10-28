import {localizeChild as xaLocalize, renderChild as xaRender, usePhraseLocale as xaUsePhraseLocale} from '../i18n/phraseRuntime'
/**
 * Modal connexion — xPortal / extension + accès simplifié (Web Wallet / passkey path).
 * Shell tokens: acid accent, graphite surface.
 * Écoute OPEN_CONNECT_EVENT (requestOpenConnect).
 */
import { useEffect, useState, useRef } from 'react'
import { useWallet } from '../context/WalletContext'
import { loginWithXPortalMainnet, cancelXPortalLogin } from '../lib/xportalWc'
import { OPEN_CONNECT_EVENT } from '../lib/walletEvents'
import { useI18n } from '../i18n/I18nContext'
import Dialog from '../experience/Dialog'
import WalletPairing from './WalletPairing'

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
  open?: boolean
  onClose?: () => void
  onConnected?: (address: string) => void
}

export default function LoginModal({ open: controlledOpen, onClose, onConnected }: Props) {
  xaUsePhraseLocale()

  const { t } = useI18n()
  const attempt=useRef(0)
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

  const reset = () => {
    setInternalOpen(false)
    onClose?.()
    setError('')
    setWcUri(null)
  }

  const close = () => {attempt.current++;cancelXPortalLogin();setBusy(false);reset()}

  if (!open) return null

  const runXPortal = async () => {
    const id=++attempt.current
    setBusy(true)
    setError('xPortal…')
    setWcUri(null)
    try {
      const res = await loginWithXPortalMainnet(p => {
        if(id!==attempt.current)return
        if (p.uri) setWcUri(p.uri)
        if (p.message) setError(p.message)
      })
      if(id!==attempt.current)return
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
      reset()
    } catch (e) {
      if(id===attempt.current)setError(e instanceof Error ? e.message : 'Erreur xPortal')
    } finally {
      if(id===attempt.current)setBusy(false)
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
        reset()
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
    <Dialog title={t('common.connect')} onClose={close} className="xa-wallet-dialog">
      <div
        className="w-full max-w-md space-y-4 rounded-2xl border border-[color:var(--xa-border-strong)] bg-[color:var(--xa-bg-elevated)] backdrop-blur-md p-5 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[color:var(--xa-text)] font-tech">{xaRender(t('common.connect'))}</h2>
            <p className="mt-1 text-[12px] text-[color:var(--xa-text-muted)]">
              {xaRender("Non-custodial — aucune clé privée stockée par xArtists. ")}</p>
          </div>
          <button type="button" className="modal-close-btn" onClick={close} aria-label={xaLocalize("Fermer")}>
            ×
          </button>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('classic')}
            className={`flex-1 rounded-xl border px-2 py-2 text-[12px] ${
              mode === 'classic'
                ? 'border-[color:var(--xa-border-strong)] bg-[color:var(--xa-accent-soft)] text-[color:var(--xa-text)]'
                : 'border-white/10 text-zinc-500'
            }`}
          >
            {xaRender("Classique ")}</button>
          <button
            type="button"
            onClick={() => setMode('simple')}
            className={`flex-1 rounded-xl border px-2 py-2 text-[12px] ${
              mode === 'simple'
                ? 'border-[color:var(--xa-border-strong)] bg-[color:var(--xa-accent-soft)] text-[color:var(--xa-text)]'
                : 'border-white/10 text-zinc-500'
            }`}
          >
            {xaRender("Accès simplifié ")}</button>
        </div>

        {xaRender(mode === 'classic' && (
          <div className="space-y-3">
            {wcUri&&<WalletPairing uri={wcUri}/>}
            <button type="button" className="btn-primary w-full" disabled={busy} onClick={() => void runXPortal()}>
              {xaRender(busy ? 'En attente…' : 'xPortal / WalletConnect')}
            </button>
            <button type="button" className="btn-secondary w-full" disabled={busy} onClick={() => void runExtension()}>
              {xaRender("Extension DeFi Wallet ")}</button>
            <div className="space-y-2 border-t border-white/10 pt-3">
              <p className="text-[11px] text-zinc-600">{xaRender("Lecture seule — coller erd1")}</p>
              <input
                value={manual}
                onChange={e => setManual(e.target.value)}
                placeholder="erd1…"
                className="mono w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[color:var(--xa-accent)]"
              />
              <button type="button" className="btn-secondary w-full text-xs" onClick={runPaste}>
                {xaRender("Lecture seule ")}</button>
            </div>
          </div>
        ))}

        {xaRender(mode === 'simple' && (
          <div className="space-y-3">
            <p className="text-[12px] text-zinc-400 leading-relaxed">
              {xaRender("Pour un achat ")}<strong className="text-zinc-200">{xaRender("Fiat")}</strong> {xaRender(" sans extension : crée un wallet via le Web Wallet officiel MultiversX (ou passkey côté wallet quand dispo), puis reviens coller ton ")}<span className="mono text-zinc-300">erd1</span>{xaRender(". xArtists ne détient jamais tes fonds. ")}</p>
            <button type="button" className="btn-primary w-full" onClick={runSimpleWebWallet}>
              {xaRender("Ouvrir Web Wallet MVX ↗ ")}</button>
            <button type="button" className="btn-secondary w-full text-sm" onClick={runGuestForFiat}>
              {xaRender("Identifiant temporaire (fiat sans erd1 encore) ")}</button>
            <p className="text-[10px] text-zinc-600">
              {xaRender("L’ID temporaire lie le paiement au futur mint — tu devras revendiquer avec un erd1 (claim). Pas un compte titres. ")}</p>
          </div>
        ))}

        {xaRender(error && <p className="text-[12px] leading-relaxed text-amber-200/90">{xaRender(error)}</p>)}
      </div>
    </Dialog>
  )
}
