/**
 * Visibility / ad placements — public read-only discovery only.
 * Never instruct users to send a manual EGLD transfer for an unverified slot.
 */
import { Link } from 'react-router-dom'

const SLOTS = [
  { id: 'home_hero', label: 'Accueil · format héro', format: '1200 × 400' },
  { id: 'market_sidebar', label: 'Marketplace · encart', format: '300 × 250' },
  { id: 'studio_banner', label: 'Studio · bandeau', format: 'Bannière' },
  { id: 'drop_feature', label: 'Musée · sélection', format: 'Mise en avant' },
] as const

export default function AdsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 pb-24">
      <header className="space-y-3">
        <p className="section-label">Visibilité · Projet</p>
        <h1 className="text-3xl font-semibold text-white">Exposer un projet artistique</h1>
        <p className="max-w-2xl text-sm leading-7 text-zinc-300">
          Découvrez les emplacements éditoriaux envisagés pour les expositions, projets
          culturels et nouvelles collections de xArtists.
        </p>
      </header>

      <p role="status" className="rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm leading-6 text-amber-100">
        Présentation uniquement : les réservations publicitaires, les enchères et les
        paiements ne sont pas ouverts. Ne transférez pas d’EGLD ni de tokens pour
        réserver un emplacement. Aucun tarif ou droit de diffusion n’est garanti.
      </p>

      <section aria-labelledby="visibility-preview-title" className="space-y-4">
        <div className="space-y-2">
          <h2 id="visibility-preview-title" className="text-xl font-semibold text-white">
            Emplacements à l’étude
          </h2>
          <p className="text-sm text-zinc-400">
            Maquettes de formats possibles, non proposés à la vente.
          </p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {SLOTS.map(slot => (
            <li key={slot.id} className="rounded-2xl border border-white/15 bg-white/[0.035] p-5">
              <div className="mb-4 aspect-[3/1] rounded-xl border border-dashed border-white/20 bg-gradient-to-br from-zinc-900 to-zinc-950" aria-hidden="true"/>
              <h3 className="text-base font-semibold text-white">{slot.label}</h3>
              <p className="mt-2 text-xs text-zinc-400">{slot.format} · En préparation</p>
            </li>
          ))}
        </ul>
      </section>

      <nav aria-label="Découvrir xArtists" className="flex flex-wrap gap-3">
        <Link to="/offres" className="inline-flex min-h-[44px] items-center rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-white">
          Découvrir les offres
        </Link>
        <Link to="/museum" className="inline-flex min-h-[44px] items-center rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-white">
          Visiter le musée
        </Link>
      </nav>
    </div>
  )
}
