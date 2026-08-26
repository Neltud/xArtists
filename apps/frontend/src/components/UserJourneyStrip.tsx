/**
 * Parcours utilisateur clair — 4 étapes honnêtes (paper-first).
 */
import { Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { requestOpenConnect } from '../lib/walletEvents'

const STEPS = [
  {
    n: 1,
    id: 'connect',
    title: 'Connecter',
    desc: 'Ton wallet MultiversX (pas LIA ops)',
    to: '/wallet',
    cta: 'Wallet',
  },
  {
    n: 2,
    id: 'packs',
    title: 'Access pack',
    desc: 'Pass agents · paper · pas un fonds',
    to: '/agents',
    cta: 'Packs',
  },
  {
    n: 3,
    id: 'trading',
    title: 'Suivre LIA',
    desc: 'Board · GSN≥80% · compounding paper',
    to: '/trading',
    cta: 'Trading',
  },
  {
    n: 4,
    id: 'create',
    title: 'Créer / collecter',
    desc: 'Studio · galerie · market (après SC)',
    to: '/studio',
    cta: 'Studio',
  },
] as const

export default function UserJourneyStrip() {
  const { connected } = useWallet()

  return (
    <section
      className="rounded-2xl border border-purple-500/25 bg-gradient-to-r from-purple-950/40 via-[#0d0d14] to-teal-950/30 p-4 sm:p-5 mb-2"
      aria-label="Parcours utilisateur"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-sm font-bold text-white tracking-wide">Parcours en 4 étapes</h2>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Paper-first · ton capital ≠ book LIA · market on-chain après codeHash
          </p>
        </div>
        {!connected ? (
          <button
            type="button"
            onClick={requestOpenConnect}
            className="btn-primary text-xs px-3 py-1.5"
          >
            1 · Connecter
          </button>
        ) : (
          <span className="text-[10px] uppercase tracking-wider text-teal-300/90 border border-teal-500/30 rounded-full px-2.5 py-1">
            Wallet lié
          </span>
        )}
      </div>

      <ol className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {STEPS.map((s, i) => (
          <li key={s.id} className="relative">
            <Link
              to={s.to}
              className="group block h-full rounded-xl border border-white/10 bg-black/30 p-3 hover:border-purple-400/50 hover:bg-purple-500/10 transition-all"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600/30 text-[11px] font-black text-purple-200 border border-purple-400/40">
                  {s.n}
                </span>
                {i < STEPS.length - 1 && (
                  <span className="hidden lg:block flex-1 h-px bg-gradient-to-r from-purple-500/40 to-transparent" aria-hidden />
                )}
              </div>
              <p className="text-xs font-semibold text-zinc-100 group-hover:text-white">{s.title}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5 leading-snug">{s.desc}</p>
              <span className="inline-block mt-2 text-[10px] font-medium text-purple-300 group-hover:underline">
                {s.cta} →
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}
