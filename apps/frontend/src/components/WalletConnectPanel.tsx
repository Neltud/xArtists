/**
 * Parcours connect live — Web Wallet (recommandé), xPortal, extension, lecture seule.
 */
import { useState } from 'react'
import { useMxLogin } from '../hooks/useMxLogin'
import { isValidErd } from '../context/WalletContext'
import { isWalletConnectConfigured } from '../config/sdkDapp'

export default function WalletConnectPanel() {
  const {
    connected,
    shortAddress,
    method,
    canAttemptSign,
    disconnect,
    openWebWallet,
    openXPortalDeepLink,
    tryExtension,
    connect,
  } = useMxLogin()
  const [manual, setManual] = useState('')
  const [err, setErr] = useState('')

  if (connected) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
        <p className="text-sm font-semibold text-emerald-100">Wallet connecté</p>
        <p className="font-mono text-xs text-zinc-300 break-all">{shortAddress}</p>
        <p className="text-[11px] text-zinc-500">
          Méthode : <strong className="text-zinc-300">{method}</strong>
          {canAttemptSign
            ? ' · signature possible (si provider TX branché)'
            : ' · lecture seule (colle adresse) — pas de signature'}
        </p>
        <button type="button" className="btn-secondary text-xs" onClick={disconnect}>
          Déconnecter
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-cyan-500/25 bg-[#0e0e16] p-4 space-y-3">
      <div>
        <p className="text-sm font-bold text-white">Connecter ton wallet MultiversX</p>
        <p className="text-[11px] text-zinc-500 mt-1">
          Recommandé : <strong className="text-zinc-400">Web Wallet</strong> (retour automatique avec
          adresse). Ce n’est <strong className="text-zinc-400">pas</strong> le wallet protocole LIA.
        </p>
      </div>

      <div className="grid gap-2">
        <button type="button" className="btn-primary text-sm py-2.5" onClick={openWebWallet}>
          Web Wallet — connexion live
        </button>
        <button type="button" className="btn-secondary text-sm py-2" onClick={openXPortalDeepLink}>
          Ouvrir xPortal
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

      <p className="text-[10px] text-zinc-600">
        WalletConnect project : {isWalletConnectConfigured() ? 'configuré' : 'manquant'} · domain
        Pages allowlist
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
