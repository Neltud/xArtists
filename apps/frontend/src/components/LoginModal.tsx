import {localizeChild as xaLocalize, renderChild as xaRender, usePhraseLocale as xaUsePhraseLocale} from '../i18n/phraseRuntime'
/**
 * Modal connexion — xPortal / extension + accès simplifié (Web Wallet / passkey path).
 * Shell tokens: acid accent, graphite surface.
 * Écoute OPEN_CONNECT_EVENT (requestOpenConnect).
 */
import { useEffect, useState, useRef, useMemo } from 'react'
import { useWallet } from '../context/WalletContext'
import { loginWithXPortalMainnet, cancelXPortalLogin } from '../lib/xportalWc'
import { OPEN_CONNECT_EVENT } from '../lib/walletEvents'
import { XPORTAL_DEEP_LINKS } from '../config/sdkDapp'
import { useI18n } from '../i18n/I18nContext'
import Dialog from '../experience/Dialog'
import WalletPairing from './WalletPairing'

const WEB_WALLET = 'https://wallet.multiversx.com/unlock'

function isInAppBrowserUa(ua = typeof navigator !== 'undefined' ? navigator.userAgent : '') {
  return /FBAN|FBAV|Instagram|Line\/|Twitter|LinkedInApp|Snapchat|MicroMessenger|GSA\/|wv\)|; wv/i.test(ua)
}

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
  const attempt = useRef(0)
  const { connect } = useWallet()
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const [error, setError] = useState('')
  const [wcUri, setWcUri] = useState<string | null>(null)
  const [manual, setManual] = useState('')
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const [mode, setMode] = useState<'classic' | 'simple'>('classic')
  const inApp = useMemo(() => isInAppBrowserUa(), [])

  useEffect(() => {
    if (controlledOpen != null) return
    const on = () => {
      setInternalOpen(true)
      setError('')
      setWcUri(null)
      setFailed(false)
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
    setFailed(false)
  }

  const cancelCurrent = () => {
    // Closing/retrying must never silently accept a late WalletConnect approval.
    attempt.current++
    cancelXPortalLogin()
    setBusy(false)
    setWcUri(null)
    setFailed(false)
    setError('Connexion annulée. Tu peux relancer xPortal ou coller un erd1 en lecture seule.')
  }
  const close = () => {
    cancelCurrent()
    reset()
  }

  if (!open) return null

  const runXPortal = async () => {
    const id = ++attempt.current
    setBusy(true)
    setFailed(false)
    setError(
      inApp
        ? 'Initialisation WalletConnect… Les navigateurs intégrés (X, Instagram, etc.) bloquent souvent le popup. Préfère Chrome si ça échoue.'
        : 'Initialisation de WalletConnect…',
    )
    setWcUri(null)
    try {
      const res = await loginWithXPortalMainnet(p => {
        if (id !== attempt.current) return
        if (p.uri) setWcUri(p.uri)
        if (p.message) setError(p.message)
      })
      if (id !== attempt.current) return
      if (!res.ok) {
        setFailed(true)
        setError(res.error)
        return
      }
      const linked = connect(res.address, 'xportal')
      if (!linked.ok) {
        setFailed(true)
        setError(linked.error || 'Session refusée')
        return
      }
      onConnected?.(res.address)
      reset()
    } catch (e) {
      if (id === attempt.current) {
        setFailed(true)
        setError(e instanceof Error ? e.message : 'Erreur xPortal')
      }
    } finally {
      if (id === attempt.current) setBusy(false)
    }
  }

  const runExtension = async () => {
    setBusy(true)
    setError('')
    setFailed(false)
    try {
      const w = window as unknown as { elrondWallet?: { getAddress?: () => Promise<string> } }
      if (!w.elrondWallet?.getAddress) {
        setError('Extension MultiversX introuvable — sur mobile utilise xPortal (Chrome) ou Lecture seule.')
        setFailed(true)
        return
      }
      const addr = await w.elrondWallet.getAddress()
      const r = connect(String(addr).trim(), 'defi_wallet')
      if (!r.ok) {
        setFailed(true)
        setError(r.error || 'Échec')
      } else {
        onConnected?.(String(addr).trim())
        reset()
      }
    } catch (e) {
      setFailed(true)
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setBusy(false)
    }
  }

  const runPaste = () => {
    setError('')
    setFailed(false)
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
              {xaRender('Non-custodial — aucune clé privée stockée par xArtists. ')}
            </p>
          </div>
          <button type="button" className="modal-close-btn" onClick={close} aria-label={xaLocalize('Fermer')}>
            ×
          </button>
        </div>

        {inApp && (
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] leading-relaxed text-amber-100/90">
            {xaRender(
              'Navigateur intégré détecté. WalletConnect échoue souvent ici. Ouvre xartists.art dans Chrome, ou utilise Lecture seule (erd1).',
            )}
          </p>
        )}

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
            {xaRender('Classique ')}
          </button>
          <button
            type="button"
            onClick={() => setMode('simple')}
            className={`flex-1 rounded-xl border px-2 py-2 text-[12px] ${
              mode === 'simple'
                ? 'border-[color:var(--xa-border-strong)] bg-[color:var(--xa-accent-soft)] text-[color:var(--xa-text)]'
                : 'border-white/10 text-zinc-500'
            }`}
          >
            {xaRender('Accès simplifié ')}
          </button>
        </div>

        {xaRender(
          mode === 'classic' && (
            <div className="space-y-3">
              {wcUri && <WalletPairing uri={wcUri} />}
              <button
                type="button"
                className="btn-primary w-full"
                disabled={busy}
                onClick={() => void runXPortal()}
              >
                {xaRender(busy ? 'En attente…' : failed ? 'Réessayer xPortal / WalletConnect' : 'xPortal / WalletConnect')}
              </button>
              {busy && (
                <button type="button" className="btn-secondary w-full" onClick={cancelCurrent}>
                  {xaRender('Annuler la connexion xPortal')}
                </button>
              )}
              {(busy || failed) && !wcUri && (
                <div className="space-y-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                  <p role="status" className="text-[12px] text-[color:var(--xa-text-muted)] leading-relaxed">
                    {xaRender(
                      busy
                        ? 'Si aucun lien xPortal n’apparaît, le relais sera réessayé automatiquement. Si l’échec persiste, ouvre le site dans Chrome plutôt que dans un navigateur intégré.'
                        : 'Échec WalletConnect. Ouvre xartists.art dans Chrome, installe xPortal, ou colle un erd1 en lecture seule.',
                    )}
                  </p>
                  <a
                    href={XPORTAL_DEEP_LINKS.storeAndOpen}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-center text-[12px] text-[color:var(--xa-accent)] underline-offset-2 hover:underline"
                  >
                    {xaRender('Installer / ouvrir xPortal ↗')}
                  </a>
                </div>
              )}
              <button
                type="button"
                className="btn-secondary w-full"
                disabled={busy}
                onClick={() => void runExtension()}
              >
                {xaRender('Extension DeFi Wallet ')}
              </button>
              <div className="space-y-2 border-t border-white/10 pt-3">
                <p className="text-[11px] text-zinc-600">{xaRender('Lecture seule — coller erd1')}</p>
                <input
                  value={manual}
                  onChange={e => setManual(e.target.value)}
                  placeholder="erd1…"
                  className="mono w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[color:var(--xa-accent)]"
                />
                <button type="button" className="btn-secondary w-full text-xs" onClick={runPaste}>
                  {xaRender('Lecture seule ')}
                </button>
              </div>
            </div>
          ),
        )}

        {xaRender(
          mode === 'simple' && (
            <div className="space-y-3">
              <p className="text-[12px] text-zinc-400 leading-relaxed">
                {xaRender('Pour un achat ')}
                <strong className="text-zinc-200">{xaRender('Fiat')}</strong>
                {xaRender(
                  ' sans extension : crée un wallet via le Web Wallet officiel MultiversX (ou passkey côté wallet quand dispo), puis reviens coller ton ',
                )}
                <span className="mono text-zinc-300">erd1</span>
                {xaRender('. xArtists ne détient jamais tes fonds. ')}
              </p>
              <button type="button" className="btn-primary w-full" onClick={runSimpleWebWallet}>
                {xaRender('Ouvrir Web Wallet MVX ↗ ')}
              </button>
              <button type="button" className="btn-secondary w-full text-sm" onClick={runGuestForFiat}>
                {xaRender('Identifiant temporaire (fiat sans erd1 encore) ')}
              </button>
              <p className="text-[10px] text-zinc-600">
                {xaRender(
                  'L’ID temporaire lie le paiement au futur mint — tu devras revendiquer avec un erd1 (claim). Pas un compte titres. ',
                )}
              </p>
            </div>
          ),
        )}

        {xaRender(error && <p className="text-[12px] leading-relaxed text-amber-200/90">{xaRender(error)}</p>)}
      </div>
    </Dialog>
  )
}
