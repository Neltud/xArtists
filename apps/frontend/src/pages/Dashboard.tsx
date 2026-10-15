/**
 * Accueil — Super-dApp Art RWA / SFT MultiversX.
 * Dome 360° + hero packs officiels 10 / 5 / 2.5 EGLD + CTAs Museum / Packs.
 */
import { Link } from 'react-router-dom'
import { requestOpenConnect } from '../lib/walletEvents'
import { useWallet } from '../context/WalletContext'
import { useI18n } from '../i18n/I18nContext'
import HomeDomeBackground from '../components/home/HomeDomeBackground'
import HomeHudCards from '../components/home/HomeHudCards'

const PACKS = [
  {
    id: 'pulse',
    name: 'Pulse',
    tier: 'Gold',
    price: '10.0',
    collection: 'XAIPLS-2cf72b',
    accent: 'from-amber-500/30 via-yellow-600/10 to-transparent border-amber-400/40',
    badge: 'text-amber-200',
  },
  {
    id: 'yield',
    name: 'Yield',
    tier: 'Silver',
    price: '5.0',
    collection: 'XAIYLD-987e24',
    accent: 'from-slate-300/25 via-zinc-500/10 to-transparent border-slate-300/35',
    badge: 'text-slate-200',
  },
  {
    id: 'sentinel',
    name: 'Sentinel',
    tier: 'Platinum',
    price: '2.5',
    collection: 'XAISNT-3d8a6b',
    accent: 'from-cyan-400/25 via-violet-600/15 to-transparent border-cyan-400/35',
    badge: 'text-cyan-200',
  },
] as const

export default function Dashboard() {
  const { t } = useI18n()
  const { connected } = useWallet()

  return (
    <>
      <HomeDomeBackground />

      <div className="pointer-events-none fixed inset-0 z-10 flex flex-col">
        <header className="pointer-events-auto flex items-center justify-between gap-2 px-4 pt-4 sm:px-6">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-black/50 px-2.5 py-1 text-[10px] font-medium text-emerald-200 backdrop-blur-xl">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden />
            MultiversX mainnet · live
          </span>
          <div className="flex flex-wrap gap-2">
            {!connected && (
              <button type="button" onClick={requestOpenConnect} className="btn-primary text-xs min-h-[44px] px-3">
                {t('nav.wallet')}
              </button>
            )}
          </div>
        </header>

        <div className="pointer-events-auto mx-auto mt-6 w-full max-w-3xl flex-1 px-3 sm:px-4">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0c0c14]/85 via-[#12101a]/75 to-[#0a1218]/80 p-5 shadow-[0_0_60px_-12px_rgba(139,92,246,0.35)] backdrop-blur-2xl sm:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-300/90">
              Super-dApp Art RWA / SFT
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              xArtists sur MultiversX
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-300">
              Packs Agents on-chain, Museum WebGL 3D, Marketplace Frameit & provenance RWA —
              entitlements réels, pas de rendement promis.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {PACKS.map(p => (
                <Link
                  key={p.id}
                  to="/agents"
                  className={`group rounded-2xl border bg-gradient-to-br ${p.accent} p-3 transition hover:brightness-110 active:scale-[0.98]`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${p.badge}`}>{p.tier}</span>
                    <span className="font-mono text-lg font-semibold text-white">{p.price} <span className="text-xs text-white/60">EGLD</span></span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-white">{p.name}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-white/40">{p.collection}</p>
                </Link>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/museum"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-cyan-600 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition hover:brightness-110 active:scale-[0.98]"
              >
                Explorer le Museum 3D
              </Link>
              <Link
                to="/agents"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-amber-400/40 bg-amber-500/15 px-5 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/25 active:scale-[0.98]"
              >
                Acheter un Pack
              </Link>
              <Link
                to="/marketplace"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 text-sm font-medium text-zinc-200 transition hover:bg-white/10 active:scale-[0.98]"
              >
                Marketplace RWA
              </Link>
            </div>
          </div>
        </div>

        <div className="pointer-events-auto px-3 pb-28 pt-4 sm:pb-10">
          <HomeHudCards />
        </div>
      </div>
    </>
  )
}
