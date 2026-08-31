/**
 * Soft launch critical path — Connect → Wallet → Musée → Tours → Packs
 */
import { Link, useLocation } from 'react-router-dom'
import { SOFT_LAUNCH_PATH } from '../config/demoMode'
import { requestOpenConnect } from '../lib/walletEvents'
import { useWallet } from '../context/WalletContext'

export default function SoftLaunchPath({ compact = false }: { compact?: boolean }) {
  const { pathname } = useLocation()
  const { connected } = useWallet()

  return (
    <div
      className={`rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/30 via-black/40 to-violet-950/20 ${
        compact ? 'px-3 py-2' : 'px-4 py-3'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/90 font-semibold">
          Parcours soft launch
        </p>
        {!connected && (
          <button
            type="button"
            className="btn-primary text-[10px] !py-1 !px-2.5"
            onClick={() => requestOpenConnect()}
          >
            🔗 Connect
          </button>
        )}
        {connected && (
          <span className="text-[10px] text-emerald-300/90 font-medium">Wallet lié</span>
        )}
      </div>
      <nav className="flex flex-wrap gap-1.5" aria-label="Parcours soft launch">
        {SOFT_LAUNCH_PATH.map(step => {
          const active =
            pathname === step.to || (step.to !== '/' && pathname.startsWith(step.to))
          return (
            <Link
              key={step.to}
              to={step.to}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                active
                  ? 'border-cyan-400/45 bg-cyan-500/15 text-cyan-100'
                  : 'border-white/10 text-zinc-400 hover:text-zinc-200 hover:border-white/20'
              }`}
            >
              <span className="opacity-70">{step.emoji}</span>
              {step.label}
            </Link>
          )
        })}
      </nav>
      {!compact && (
        <p className="mt-2 text-[10px] text-zinc-600 leading-relaxed">
          Paper par défaut · SC market/agents pending · pas de trading live · musée = œuvres réelles +
          intention d’achat (Guardian), pas de succès simulé.
        </p>
      )}
    </div>
  )
}
