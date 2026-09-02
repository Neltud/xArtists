import { Link } from 'react-router-dom'
import { RWA_ASSET_TYPES, RWA_USER_JOURNEY } from '../config/rwaAssets'

export default function RwaAssetsStrip() {
  return (
    <section className="card border-amber-500/20 mb-6" aria-labelledby="rwa-title">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div>
          <h3 id="rwa-title" className="font-bold text-amber-200">
            Actifs RWA / phygital
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            Intégrés au Market art — escrow SC = P2 ; metadata + Studio dès aujourd’hui.
          </p>
        </div>
        <Link to="/studio" className="text-xs text-violet-400 font-medium">
          Studio →
        </Link>
      </div>
      <div className="grid sm:grid-cols-2 gap-2 mb-4">
        {RWA_ASSET_TYPES.map(t => (
          <div key={t.id} className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2">
            <p className="text-sm font-semibold text-zinc-100">{t.label}</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">{t.description}</p>
            <p className="text-[10px] mt-1 text-zinc-600">
              {t.troRewardEligible ? '1 TRO max éligible' : 'Pas de reward TRO physique'} ·{' '}
              {t.needsEscrow ? 'escrow recommandé' : 'on-chain metadata suffit'}
            </p>
          </div>
        ))}
      </div>
      <ol className="text-[11px] text-zinc-400 space-y-1 list-decimal list-inside">
        {RWA_USER_JOURNEY.map(s => (
          <li key={s}>{s}</li>
        ))}
      </ol>
    </section>
  )
}
