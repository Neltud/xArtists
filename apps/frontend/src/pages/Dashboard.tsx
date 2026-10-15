/**
 * Accueil — textes institutionnels sobres.
 * Dôme 360° + hero xArtists + CTAs Musée / Marché RWA.
 */
import { Link } from 'react-router-dom'
import { requestOpenConnect } from '../lib/walletEvents'
import { useWallet } from '../context/WalletContext'
import { useI18n } from '../i18n/I18nContext'
import HomeDomeBackground from '../components/home/HomeDomeBackground'
import HomeHudCards from '../components/home/HomeHudCards'

export default function Dashboard() {
  const { t } = useI18n()
  const { connected } = useWallet()

  return (
    <>
      <HomeDomeBackground />

      <div className="pointer-events-none fixed inset-0 z-10 flex flex-col">
        <header className="pointer-events-auto flex items-center justify-between gap-2 px-4 pt-4 sm:px-6">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/50 px-2.5 py-1 text-[10px] font-medium text-zinc-300 backdrop-blur-xl">
            MultiversX
          </span>
          <div className="flex flex-wrap gap-2">
            {!connected && (
              <button type="button" onClick={requestOpenConnect} className="btn-primary text-xs min-h-[44px] px-3">
                {t('nav.wallet')}
              </button>
            )}
          </div>
        </header>

        <div className="pointer-events-auto mx-auto mt-8 w-full max-w-2xl flex-1 px-3 sm:px-4">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0c0c14]/90 via-[#101018]/80 to-[#0a1014]/85 p-6 shadow-[0_0_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-2xl sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-400">
              Infrastructure RWA · MultiversX
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">xArtists</h1>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-zinc-300">
              Plateforme d&apos;art physique et numérique sur MultiversX. Explorez l&apos;exposition 3D et
              découvrez les certificats de provenance RWA.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/museum"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100 active:scale-[0.98]"
              >
                Visiter le Musée 3D
              </Link>
              <Link
                to="/marketplace"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/20 bg-white/5 px-6 text-sm font-medium text-zinc-100 transition hover:bg-white/10 active:scale-[0.98]"
              >
                Marché RWA
              </Link>
              <Link
                to="/agents"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/15 px-5 text-sm font-medium text-zinc-300 transition hover:bg-white/5 active:scale-[0.98]"
              >
                Packs Agents
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
