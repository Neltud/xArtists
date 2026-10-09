/**
 * Accueil — salle 3D menu · pas de CTA ATC/TCA gris.
 */
import { Link } from 'react-router-dom'
import { MAINNET_ADDRESSES } from '../config/contracts'
import { CORE_MODULES, SECONDARY_MODULES, type ModuleDef } from '../config/modules'
import { requestOpenConnect } from '../lib/walletEvents'
import { useWallet } from '../context/WalletContext'
import { useI18n } from '../i18n/I18nContext'
import RceStrip from '../components/RceStrip'
import HomeMenuHall from '../components/home/HomeMenuHall'
import { scStatus } from '../config/scStatus'

const STATUS_LABEL: Record<string, string> = {
  live: 'LIVE',
  soon: 'BIENTÔT',
  open: 'OUVERT',
  paper: 'INFO',
}

const STATUS_CLASS: Record<string, string> = {
  live: 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10',
  soon: 'border-amber-500/40 text-amber-200 bg-amber-500/10',
  open: 'border-sky-500/40 text-sky-200 bg-sky-500/10',
  paper: 'border-white/15 text-zinc-400 bg-white/5',
}

function badgeStatus(m: ModuleDef): string {
  if (m.status === 'live') return 'live'
  if (m.status === 'soon') return 'soon'
  if (m.status === 'ui') return 'open'
  const id = m.id
  if (id === 'marketplace') return scStatus.nft_marketplace?.live ? 'live' : 'soon'
  if (id === 'staking') return scStatus.tro_staking?.live ? 'live' : 'soon'
  if (id === 'slot') return scStatus.slot_casino?.live ? 'live' : 'soon'
  if (id === 'agents') return 'open'
  return 'open'
}

export default function Dashboard() {
  const { t } = useI18n()
  const { connected } = useWallet()
  const core = CORE_MODULES

  return (
    <div className="animate-fade-in space-y-6 pb-10">
      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-violet-300/80 font-semibold">
              {t('home.kicker')}
            </p>
            <h1 className="font-tech text-2xl font-bold tracking-tight text-white title-glow sm:text-3xl">
              {t('home.title')}
            </h1>
            <p className="mt-1 text-sm text-zinc-400">{t('home.lead')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!connected && (
              <button type="button" className="btn-primary text-sm" onClick={() => requestOpenConnect()}>
                {t('common.connect')}
              </button>
            )}
            <Link to="/command-center" className="btn-secondary text-sm">
              {t('nav.command')}
            </Link>
          </div>
        </div>
        <HomeMenuHall />
      </section>

      <RceStrip compact />

      <section className="space-y-3">
        <p className="section-label">{t('home.plan')}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {core.map(m => {
            const st = badgeStatus(m)
            return (
              <Link
                key={m.id}
                to={m.path}
                className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-violet-400/30 active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-sm font-semibold text-white">
                    <span className="mr-1.5" aria-hidden>
                      {m.emoji}
                    </span>
                    {m.label}
                  </h2>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${STATUS_CLASS[st]}`}
                  >
                    {STATUS_LABEL[st]}
                  </span>
                </div>
                <p className="mt-1.5 text-[12px] text-zinc-500">{m.blurb}</p>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="space-y-3">
        <p className="section-label">{t('home.also')}</p>
        <div className="flex flex-wrap gap-2">
          {SECONDARY_MODULES.filter(m => m.id !== 'tca' && m.path !== '/tca').map(m => (
            <Link
              key={m.id}
              to={m.path}
              className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[12px] text-zinc-300 transition hover:border-white/20 hover:text-white active:scale-95"
            >
              {m.emoji} {m.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/30 p-4 text-[11px] text-zinc-500 space-y-1">
        <p className="font-medium text-zinc-300">{t('home.contracts')}</p>
        <p className="mono truncate">market {MAINNET_ADDRESSES.nft_marketplace}</p>
        <p className="mono truncate">stake {MAINNET_ADDRESSES.tro_staking}</p>
        <p className="mono truncate">slot {MAINNET_ADDRESSES.slot_casino}</p>
      </section>
    </div>
  )
}
