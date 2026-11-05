/**
 * Maison hub — high-end Art-first entry.
 * Presentation only: links to existing explore/create modules.
 * Does not enable auction, checkout, or mint.
 */
import { Link } from 'react-router-dom'

const ROOMS = [
  {
    to: '/explore/museum',
    kicker: 'Immersion',
    title: 'Museum',
    body: 'Salles WebGL et accrochages. Expérience de collection, pas de grille de floor price.',
  },
  {
    to: '/explore/market?tab=opensea',
    kicker: 'Marché NFT multichaîne',
    title: 'OpenSea · Solana & Polygon',
    body: 'Explorer les collections réellement prises en charge, puis vérifier toute vente directement sur OpenSea. Pas de mint ni de paiement dans xArtists.',
  },
  {
    to: '/explore/auction',
    kicker: 'Temps',
    title: 'Salle des enchères',
    body: 'English auction design. Flag serveur off — pas d’enchère live ni de settle auto.',
  },
  {
    to: '/explore/rwa',
    kicker: 'Garde',
    title: 'RWA · Physique',
    body: 'Paid ≠ shipped ≠ accepted. Certification et suivi d’œuvre, sans payout webhook.',
  },
  {
    to: '/create/studio',
    kicker: 'Création',
    title: 'Studio',
    body: 'Mint signé par l’artiste. Le backend n’émet pas la transaction à sa place.',
  },
  {
    to: '/intelligence/agents',
    kicker: 'Intelligence',
    title: 'Packs · Agents',
    body: 'Pulse · Yield · Sentinel. Primary EUR — claim atomique en chantier, checkout commercial NO-GO.',
  },
  {
    to: '/intelligence/lia',
    kicker: 'Signaux',
    title: 'LIA',
    body: 'Paper / signaux. Aucun trading live activé depuis cette interface.',
  },
] as const

export default function MaisonHubPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 text-left">
      <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-500">xArtists · Maison</p>
      <h1 className="mt-3 text-3xl font-medium tracking-tight text-amber-50/95">
        Une maison, pas un mall NFT
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400">
        Curation, garde et preuve avant le volume. Les modules ci-dessous existent déjà dans la dApp ;
        ce hub ordonne l’entrée Art-first sans ouvrir de vente automatique ni de bridge.
      </p>

      <ul className="mt-10 space-y-3">
        {ROOMS.map((room) => (
          <li key={room.to}>
            <Link
              to={room.to}
              className="block rounded-2xl border border-white/10 bg-black/45 p-5 transition hover:border-amber-200/25 hover:bg-black/60"
            >
              <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">{room.kicker}</p>
              <h2 className="mt-1 text-[17px] text-amber-50/95">{room.title}</h2>
              <p className="mt-2 text-[13px] leading-relaxed text-zinc-500">{room.body}</p>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-[11px] leading-relaxed text-zinc-600">
        Statut commercial : checkout PayBox public et mint mainnet restent soumis aux gates fail-closed
        (voir /workspace/status). Ce hub ne modifie aucun flag serveur.
      </p>
    </div>
  )
}
