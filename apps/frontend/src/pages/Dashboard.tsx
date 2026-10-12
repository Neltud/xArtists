/**
 * Accueil — dôme 360° WebGL + cockpit HUD B2B (glassmorphism).
 */
import { Link } from 'react-router-dom'
import { requestOpenConnect } from '../lib/walletEvents'
import { useWallet } from '../context/WalletContext'
import { useI18n } from '../i18n/I18nContext'
import HomeDomeBackground from '../components/home/HomeDomeBackground'
import HomeHudCards from '../components/home/HomeHudCards'
import HomeMenuHall from '../components/home/HomeMenuHall'

export default function Dashboard() {
  const { t } = useI18n()
  const { connected } = useWallet()

  return (
    <>
      <HomeDomeBackground />

      <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-5rem)] max-w-4xl flex-col justify-between gap-6 px-3 pb-24 pt-4 animate-fade-in">
        {/* HUD header */}
        <header className="rounded-2xl border border-purple-500/30 bg-black/40 backdrop-blur-md p-5 shadow-2xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden />
              Dôme 360° Active · MultiversX Network
            </span>
            <div className="flex flex-wrap gap-2">
              {!connected && (
                <button
                  type="button"
                  onClick={requestOpenConnect}
                  className="btn-primary text-xs min-h-[40px]"
                >
                  {t('nav.wallet') || 'Connecter'}
                </button>
              )}
              <Link to="/command-center" className="btn-secondary text-xs min-h-[40px] inline-flex items-center">
                {t('nav.command') || 'Command'}
              </Link>
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-violet-300/90 font-semibold">
              {t('home.kicker') || 'xArtists'}
            </p>
            <h1 className="mt-1 font-tech text-xl sm:text-2xl font-bold leading-snug">
              <span className="bg-gradient-to-r from-violet-200 via-cyan-200 to-amber-100 bg-clip-text text-transparent">
                xArtists — Infrastructure Phygital RWA & Écosystème WebGL
              </span>
            </h1>
            <p className="mt-2 text-[13px] text-zinc-400 leading-relaxed max-w-2xl">
              {t('home.lead') ||
                'Galerie 3D, packs agent NFT, certification RWA et LIA paper-first sur MultiversX.'}
            </p>
          </div>
        </header>

        {/* Optional interactive hall (doors) — compact */}
        <section className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-md overflow-hidden shadow-2xl">
          <HomeMenuHall />
        </section>

        {/* 3 HUD cards */}
        <div className="flex justify-center">
          <HomeHudCards />
        </div>

        <footer className="flex flex-wrap justify-center gap-4 text-[11px] text-zinc-500">
          <Link to="/agents" className="hover:text-zinc-300">
            Packs Agent
          </Link>
          <Link to="/studio" className="hover:text-zinc-300">
            Studio Phygital
          </Link>
          <Link to="/go-live" className="hover:text-zinc-300">
            GO_LIVE
          </Link>
        </footer>
      </div>
    </>
  )
}
