/**
 * Connect live — Web Wallet, xPortal WC + QR desktop, extension, lecture seule.
 */
import { useEffect, useState } from 'react'
import { useMxLogin } from '../hooks/useMxLogin'
import { isValidErd } from '../context/WalletContext'
import { isWalletConnectConfigured } from '../config/sdkDapp'
import { clearXPortalSession } from '../lib/xportalWc'

export default function WalletConnectPanel() {
  const {
    connected,
    shortAddress,
    method,
    canAttemptSign,
    disconnect,
    openWebWallet,
    connectXPortal,
    tryExtension,
    connect,
    wcProgress,
  } = useMxLogin()
  const [manual, setManual] = useState('')
  const [err, setErr] = useState('')
  const [wcUri, setWcUri] = useState<string | null>(null)

  useEffect(() => {
    const onUri = (e: Event) => {
      const d = (e as CustomEvent).detail as { uri?: string }
      if (d?.uri) setWcUri(d.uri)
    }
    window.addEventListener('xartists-wc-uri', onUri)
    return () => window.removeEventListener('xartists-wc-uri', onUri)
  }, [])

  useEffect(() => {
    if (wcProgress?.uri) setWcUri(wcProgress.uri)
    if (wcProgress?.phase === 'done' || wcProgress?.phase === 'error') {
      // keep QR until done; clear on done
      if (wcProgress.phase === 'done') setWcUri(null)
    }
  }, [wcProgress])

  if (connected) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
        <p className="text-sm font-semibold text-emerald-100">Wallet connecté</p>
        <p className="font-mono text-xs text-emerald-50/90 break-all">{shortAddress}</p>
        <p className="text-[11px] text-zinc-500">
          {method}
          {canAttemptSign ? ' · signature possible' : ' · lecture seule'}
        </p>
        {method === 'xportal' && (
          <p className="text-[11px] text-cyan-200/90">
            Session xPortal active — les TX s’ouvrent dans l’app (pas le Web Wallet).
          </p>
        )}
        {method === 'paste_readonly' && (
          <p className="text-[11px] text-amber-200">
            Lecture seule — pour signer, reconnecte via xPortal ou Web Wallet.
          </p>
        )}
        <button
          type="button"
          className="btn-secondary text-xs"
          onClick={() => {
            clearXPortalSession()
            disconnect()
            setWcUri(null)
          }}
        >
          Déconnecter
        </button>
      </div>
    )
  }

  const qrImg = wcUri
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(wcUri)}`
    : null

  return (
    <div className="rounded-2xl border border-cyan-500/25 bg-[#0e0e16] p-4 space-y-3">
      <div>
        <p className="text-sm font-bold text-white">Connecter ton wallet MultiversX</p>
        <p className="text-[11px] text-zinc-500 mt-1">
          <strong className="text-zinc-400">xPortal</strong> (QR / app) ou{' '}
          <strong className="text-zinc-400">Web Wallet</strong>. Pas le wallet protocole LIA.
        </p>
      </div>

      <div className="grid gap-2">
        <button
          type="button"
          className="btn-primary text-sm py-2.5"
          onClick={async () => {
            setErr('')
            setWcUri(null)
            const r = await connectXPortal()
            if (!r.ok) setErr(('error' in r && r.error) || 'Échec xPortal')
          }}
        >
          xPortal mainnet (QR / WalletConnect)
        </button>
        <button type="button" className="btn-secondary text-sm py-2" onClick={openWebWallet}>
          Web Wallet — navigateur
        </button>
        <button
          type="button"
          className="btn-secondary text-sm py-2"
          onClick={async () => {
            setErr('')
            const r = await tryExtension()
            if (!r.ok) setErr(r.error || 'Échec')
          }}
        >
          Extension DeFi Wallet
        </button>
      </div>

      {qrImg && (
        <div className="flex flex-col items-center gap-2 py-3 rounded-xl border border-cyan-500/20 bg-black/40">
          <p className="text-[11px] text-cyan-200">Scanne avec xPortal → WalletConnect</p>
          <img src={qrImg} alt="QR WalletConnect xPortal" width={180} height={180} className="rounded-lg bg-white p-2" />
          <p className="text-[10px] text-zinc-500 text-center px-2">
            Desktop : caméra xPortal. Mobile : l’app s’ouvre via lien universel.
          </p>
        </div>
      )}

      {wcProgress?.message && (
        <p className="text-[11px] text-cyan-300/80">{wcProgress.message}</p>
      )}

      <p className="text-[10px] text-zinc-600">
        WalletConnect project : {isWalletConnectConfigured() ? 'configuré' : 'manquant'} · domain
        Pages allowlist (neltud.github.io)
      </p>

      <div className="border-t border-white/10 pt-3 space-y-2">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500">Lecture seule (erd1…)</p>
        <input
          value={manual}
          onChange={e => setManual(e.target.value)}
          placeholder="erd1…"
          className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs font-mono text-white"
        />
        <button
          type="button"
          className="btn-secondary text-xs w-full"
          onClick={() => {
            setErr('')
            if (!isValidErd(manual)) {
              setErr('Adresse invalide')
              return
            }
            const r = connect(manual.trim(), 'paste_readonly')
            if (!r.ok) setErr(r.error || 'Échec')
          }}
        >
          Afficher le solde (sans signature)
        </button>
      </div>

      {err && <p className="text-xs text-rose-300">{err}</p>}
    </div>
  )
}
