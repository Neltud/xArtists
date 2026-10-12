/** Modale B2B pack sponsor — Silver / Gold / Platinum + export PDF. */
import { Link } from 'react-router-dom'
import type { PackId } from '../../config/agentPacks'
import { AGENT_PACKS } from '../../config/agentPacks'
import { downloadSponsorDeckPdf } from '../../lib/sponsorDeckPdf'
import { useI18n } from '../../i18n/I18nContext'

const TIERS = [
  { id: 'silver', nameKey: 'pack.tier.silver', blurbKey: 'pack.tier.silver.blurb' },
  { id: 'gold', nameKey: 'pack.tier.gold', blurbKey: 'pack.tier.gold.blurb' },
  { id: 'platinum', nameKey: 'pack.tier.platinum', blurbKey: 'pack.tier.platinum.blurb' },
] as const

type Props = {
  packId: PackId | null
  onClose: () => void
}

export function HoloPackModal({ packId, onClose }: Props) {
  const { t, lang } = useI18n()
  if (!packId) return null
  const pack = AGENT_PACKS.find(p => p.id === packId)
  if (!pack) return null

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-3 bg-black/70 backdrop-blur-md"
      role="dialog"
      aria-modal
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-purple-500/30 bg-black/85 shadow-2xl p-5 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/80">{t('pack.sponsor.kicker')}</p>
            <h2 className="text-xl font-semibold text-white">
              {pack.icon} {pack.name}
            </h2>
            <p className="text-[13px] text-zinc-400 mt-1">{pack.tagline}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-xl border border-white/15 text-zinc-300"
            aria-label={lang === 'en' ? 'Close' : 'Fermer'}
          >
            ✕
          </button>
        </div>

        <ul className="text-[12px] text-zinc-300 space-y-1 list-disc list-inside">
          {(pack.entitlements || []).slice(0, 6).map(e => (
            <li key={e}>{e}</li>
          ))}
        </ul>

        <div className="grid gap-2 sm:grid-cols-3">
          {TIERS.map(tier => (
            <div
              key={tier.id}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-1"
            >
              <p className="text-[11px] font-bold text-amber-100">{t(tier.nameKey)}</p>
              <p className="text-[10px] text-zinc-500 leading-snug">{t(tier.blurbKey)}</p>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-zinc-500">
          {t('pack.price.from')} ~{pack.priceEur?.list ?? '—'} € / ~{pack.priceEgld?.list ?? '—'} EGLD.
          {' '}
          {t('pack.disclaimer')}
        </p>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="btn-primary text-sm min-h-[44px] w-full inline-flex items-center justify-center gap-2"
            onClick={() => downloadSponsorDeckPdf(packId)}
          >
            {t('pack.download.pdf')}
          </button>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/agents"
              className="btn-secondary text-sm min-h-[44px] inline-flex items-center"
              onClick={onClose}
            >
              {t('pack.cta.agents')}
            </Link>
            <Link
              to="/command-center"
              className="btn-secondary text-sm min-h-[44px] inline-flex items-center"
              onClick={onClose}
            >
              {t('pack.cta.cc')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HoloPackModal
