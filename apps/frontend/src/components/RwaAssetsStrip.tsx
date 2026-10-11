import { Link } from 'react-router-dom'
import { RWA_ASSET_TYPES, RWA_USER_JOURNEY } from '../config/rwaAssets'

export default function RwaAssetsStrip() {
  return (
    <section
      className="rounded-2xl border border-amber-500/25 bg-black/40 backdrop-blur-md p-4 sm:p-5 mb-6 shadow-[0_0_40px_rgba(245,158,11,0.06)]"
      aria-labelledby="rwa-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <p className="text-[10px] font-tech uppercase tracking-[0.2em] text-amber-300/80 mb-1">
            Phygital · RWA
          </p>
          <h3 id="rwa-title" className="text-lg font-bold text-amber-100">
            Actifs RWA / œuvres physiques
          </h3>
          <p className="text-[12px] text-zinc-400 mt-1 max-w-xl leading-relaxed">
            Certificat d’authenticité, metadata on-chain et parcours Market. Escrow SC = phase 2 —
            Studio & CoA disponibles dès maintenant.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/studio" className="btn-primary text-xs px-3 py-1.5">
            Studio / Certifier →
          </Link>
          <Link to="/marketplace" className="btn-secondary text-xs px-3 py-1.5">
            Market art
          </Link>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-2.5 mb-4">
        {RWA_ASSET_TYPES.map(t => (
          <div
            key={t.id}
            className="rounded-xl border border-white/10 bg-zinc-950/50 px-3.5 py-3 hover:border-amber-400/30 transition"
          >
            <p className="text-sm font-semibold text-zinc-100">{t.label}</p>
            <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">{t.description}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span
                className={`text-[10px] rounded-full px-2 py-0.5 border ${
                  t.troRewardEligible
                    ? 'border-violet-400/30 bg-violet-500/10 text-violet-200'
                    : 'border-white/10 text-zinc-500'
                }`}
              >
                {t.troRewardEligible ? '1 TRO max éligible' : 'Pas de reward TRO physique'}
              </span>
              <span
                className={`text-[10px] rounded-full px-2 py-0.5 border ${
                  t.needsEscrow
                    ? 'border-amber-400/30 bg-amber-500/10 text-amber-100/90'
                    : 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200/90'
                }`}
              >
                {t.needsEscrow ? 'Escrow recommandé' : 'Metadata on-chain'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2.5">
        <p className="text-[10px] uppercase tracking-wide text-zinc-500 font-tech mb-1.5">
          Parcours utilisateur
        </p>
        <ol className="text-[11px] text-zinc-400 space-y-1 list-decimal list-inside">
          {RWA_USER_JOURNEY.map(s => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </div>
    </section>
  )
}
