/**
 * Accueil présentation — dôme 360° WebGL plein écran + HUD glass 3 cartes.
 * Canvas fixed inset-0, aucun cadre autour de la scène 3D.
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

      <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between">
        <header className="pointer-events-auto flex items-center justify-between gap-2 px-4 pt-4 sm:px-6">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-black/50 px-2.5 py-1 text-[10px] font-medium text-emerald-200 backdrop-blur-xl">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden />
            {t('home.dome.badge')}
          </span>
          <div className="flex flex-wrap gap-2">
            {!connected && (
              <button
                type="button"
                onClick={requestOpenConnect}
                className="btn-primary text-xs min-h-[44px] px-3"
              >
                {t('nav.wallet')}
              </button>
            )}
            <Link
              to="/command-center"
              className="btn-secondary text-xs min-h-[44px] px-3 inline-flex items-center"
            >
              {t('nav.command')}
            </Link>
          </div>
        </header>

        <div className="flex-1" aria-hidden />

        <div className="pointer-events-auto px-3 pb-28 sm:pb-10">
          <HomeHudCards />
        </div>
      </div>
    </>
  )
}
