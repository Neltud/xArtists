import {localizeChild as xaLocalize, renderChild as xaRender, usePhraseLocale as xaUsePhraseLocale} from '../i18n/phraseRuntime'
/**
 * Connect live — Web Wallet, xPortal WC + QR desktop, extension, lecture seule.
 */
import { useEffect, useState } from 'react'
import WalletPairing from './WalletPairing'
import { useMxLogin } from '../hooks/useMxLogin'
import { isValidErd } from '../context/WalletContext'
import { clearXPortalSession, cancelXPortalLogin } from '../lib/xportalWc'

export default function WalletConnectPanel() {
  xaUsePhraseLocale()

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
  const [busy,setBusy]=useState(false)
  useEffect(()=>()=>{cancelXPortalLogin()},[])

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
        <p className="text-sm font-semibold text-emerald-100">{xaRender("Wallet connecté")}</p>
        <p className="font-mono text-xs text-emerald-50/90 break-all">{xaRender(shortAddress)}</p>
        <p className="text-[11px] text-zinc-500">
          {xaRender(method)}
          {xaRender(canAttemptSign ? ' · signature possible' : ' · lecture seule')}
        </p>
        {xaRender(method === 'xportal' && (
          <p className="text-[11px] text-cyan-200/90">
            {xaRender("Session xPortal active — les TX s’ouvrent dans l’app (pas le Web Wallet). ")}</p>
        ))}
        {xaRender(method === 'paste_readonly' && (
          <p className="text-[11px] text-amber-200">
            {xaRender("Lecture seule — pour signer, reconnecte via xPortal ou Web Wallet. ")}</p>
        ))}
        <button
          type="button"
          className="btn-secondary text-xs"
          onClick={() => {
            clearXPortalSession()
            disconnect()
            setWcUri(null)
          }}
        >
          {xaRender("Déconnecter ")}</button>
      </div>
    )
  }



  return (
    <div className="rounded-2xl border border-cyan-500/25 bg-[#0e0e16] p-4 space-y-3">
      <div>
        <p className="text-sm font-bold text-white">{xaRender("Connecter ton wallet MultiversX")}</p>
        <p className="text-[11px] text-zinc-500 mt-1">
          <strong className="text-zinc-400">{xaRender("xPortal")}</strong> {xaRender(" (QR / app) ou")}{xaRender(' ')}
          <strong className="text-zinc-400">{xaRender("Web Wallet")}</strong>{xaRender(". Pas le wallet protocole LIA. ")}</p>
      </div>

      <div className="grid gap-2">
        <button
          type="button"
          className="btn-primary text-sm py-2.5"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            setErr('')
            setWcUri(null)
            try{const r = await connectXPortal();if (!r.ok) setErr(('error' in r && r.error) || 'Échec xPortal')}finally{setBusy(false)}
          }}
        >
          {xaRender("xPortal mainnet (QR / WalletConnect) ")}</button>
        <button type="button" className="btn-secondary text-sm py-2" onClick={openWebWallet}>
          {xaRender("Web Wallet — navigateur ")}</button>
        <button
          type="button"
          className="btn-secondary text-sm py-2"
          onClick={async () => {
            setErr('')
            const r = await tryExtension()
            if (!r.ok) setErr(r.error || 'Échec')
          }}
        >
          {xaRender("Extension DeFi Wallet ")}</button>
      </div>

      {wcUri&&<WalletPairing uri={wcUri}/>}

      {xaRender(wcProgress?.message && (
        <p className="text-[11px] text-cyan-300/80">{xaRender(wcProgress.message)}</p>
      ))}

      <div className="border-t border-white/10 pt-3 space-y-2">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500">{xaRender("Lecture seule (erd1…)")}</p>
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
          {xaRender("Afficher le solde (sans signature) ")}</button>
      </div>

      {xaRender(err && <p className="text-xs text-rose-300">{xaRender(err)}</p>)}
    </div>
  )
}
