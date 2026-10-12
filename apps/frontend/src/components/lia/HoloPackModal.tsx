/** Modale B2B pack sponsor — Silver / Gold / Platinum. */
import { Link } from 'react-router-dom'
import type { PackId } from '../../config/agentPacks'
import { PACKS } from '../../config/agentPacks'

const TIERS = [
  {
    id: 'silver',
    name: 'Silver',
    blurb: 'Accès salle + lecture signaux · idéal premier déploiement',
  },
  {
    id: 'gold',
    name: 'Gold',
    blurb: 'Hub Command + tape multi-actifs · ops holder régulières',
  },
  {
    id: 'platinum',
    name: 'Platinum',
    blurb: 'Suite complète pack + priorité roadmap B2B / intégrations',
  },
] as const

type Props = {
  packId: PackId | null
  onClose: () => void
}

export function HoloPackModal({ packId, onClose }: Props) {
  if (!packId) return null
  const pack = PACKS.find(p => p.id === packId)
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
            <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/80">Pack Sponsor · B2B</p>
            <h2 className="text-xl font-semibold text-white">
              {pack.icon} {pack.name}
            </h2>
            <p className="text-[13px] text-zinc-400 mt-1">{pack.tagline}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-xl border border-white/15 text-zinc-300"
            aria-label="Fermer"
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
          {TIERS.map(t => (
            <div
              key={t.id}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-1"
            >
              <p className="text-[11px] font-bold text-amber-100">{t.name}</p>
              <p className="text-[10px] text-zinc-500 leading-snug">{t.blurb}</p>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-zinc-500">
          À partir de ~{pack.priceEur?.list ?? '—'} € / ~{pack.priceEgld?.list ?? '—'} EGLD (liste).
          Non-custodial · pas un conseil financier.
        </p>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/agents"
            className="btn-primary text-sm min-h-[44px] inline-flex items-center"
            onClick={onClose}
          >
            Engagement B2B / Packs
          </Link>
          <Link
            to="/command-center"
            className="btn-secondary text-sm min-h-[44px] inline-flex items-center"
            onClick={onClose}
          >
            Command Center
          </Link>
        </div>
      </div>
    </div>
  )
}

export default HoloPackModal
