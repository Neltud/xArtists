import {localizeChild as xaLocalize, renderChild as xaRender, usePhraseLocale as xaUsePhraseLocale} from '../i18n/phraseRuntime'
/**
 * Parcours découverte démo — Accueil → Galerie → Packs → Wallet → Tours
 */
import { Link, useLocation } from 'react-router-dom'
import { SOFT_LAUNCH_PATH } from '../config/demoMode'
import { requestOpenConnect } from '../lib/walletEvents'
import { useWallet } from '../context/WalletContext'

export default function SoftLaunchPath({ compact = false }: { compact?: boolean }) {
  xaUsePhraseLocale()

  const { pathname } = useLocation()
  const { connected } = useWallet()

  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/[0.03] ${
        compact ? 'px-3 py-2' : 'px-4 py-3'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold">
          {xaRender("Découvrir ")}</p>
        {xaRender(!connected && (
          <button
            type="button"
            className="btn-primary text-[10px] !py-1 !px-2.5"
            onClick={() => requestOpenConnect()}
          >
            {xaRender("Connecter ")}</button>
        ))}
        {xaRender(connected && (
          <span className="text-[10px] text-emerald-300/90 font-medium">{xaRender("Wallet lié")}</span>
        ))}
      </div>
      <nav className="flex flex-wrap gap-1.5" aria-label={xaLocalize("Découvrir")}>
        {xaRender(SOFT_LAUNCH_PATH.map(step => {
          const active =
            pathname === step.to || (step.to !== '/' && pathname.startsWith(step.to))
          return (
            <Link
              key={step.to}
              to={step.to}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                active
                  ? 'border-white/25 bg-white/10 text-white'
                  : 'border-white/10 text-zinc-400 hover:text-zinc-200 hover:border-white/20'
              }`}
            >
              <span className="opacity-70">{xaRender(step.emoji)}</span>
              {xaRender(step.label)}
            </Link>
          )
        }))}
      </nav>
      {xaRender(!compact && (
        <p className="mt-2 text-[10px] text-zinc-600 leading-relaxed">
          {xaRender("Parcours conseillé pour découvrir la démo — galerie, packs, wallet. ")}</p>
      ))}
    </div>
  )
}
