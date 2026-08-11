/**
 * Cartes parcours — rétention & clarté FR
 * Double marketplace : Art/RWA/NFT · Agents IA (packs LIA)
 */

import { Link } from 'react-router-dom'

const CARDS = [
  {
    emoji: '🎨',
    title: 'Studio artiste',
    body: 'Collection, NFT image/vidéo/musique, IPFS. Parcours artiste → mint → sell.',
    to: '/studio',
    cta: 'Ouvrir Studio',
  },
  {
    emoji: '🖼️',
    title: 'Market Art · RWA · NFT',
    body: 'Galerie xArtists + market on-chain (après SC). Phygital · royalties · fees treasury.',
    to: '/marketplace',
    cta: 'Marketplace art',
  },
  {
    emoji: '🧠',
    title: 'Market Agents IA',
    body: 'Packs LIA (5–25 €) · NFT stake · 3 profils. ≠ GreenSmoke (prévisions). Prix borné, LIA propose.',
    to: '/agents',
    cta: 'Agents packs',
  },
  {
    emoji: '📈',
    title: 'LIA décisionnelle',
    body: 'Trading multi-stratégies · treasury · mémoire on-chain. Wallet protocole ≠ ton wallet.',
    to: '/portfolio',
    cta: 'Board LIA',
  },
  {
    emoji: '💎',
    title: '$TRO',
    body: 'Gouvernance. Supply max 500 000. Utility packs, DAO, incentives créateurs.',
    to: '/tro',
    cta: 'Token $TRO',
  },
  {
    emoji: '🏦',
    title: 'DeFi (Hatom)',
    body: 'Lending MVX prioritaire pour LIA. Soul = experimental pre-mainnet.',
    to: '/hatom',
    cta: 'Hatom',
  },
]

export default function ExplainCards() {
  return (
    <section className="mb-10" aria-labelledby="how-title">
      <div className="mb-5">
        <h2 id="how-title" className="text-xl font-bold">
          Deux marketplaces · une IA
        </h2>
        <p className="text-sm text-zinc-500 mt-1">
          Art tokenisé d’un côté · agents LIA de l’autre — LIA décide, la chaîne mémorise.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map(c => (
          <Link
            key={c.to}
            to={c.to}
            className="card group block hover:border-violet-500/40 transition-colors focus-visible:ring-2 focus-visible:ring-purple-500"
          >
            <div className="text-2xl mb-3" aria-hidden>
              {c.emoji}
            </div>
            <h3 className="font-semibold text-white group-hover:text-violet-300">{c.title}</h3>
            <p className="text-sm text-zinc-400 mt-2 leading-relaxed">{c.body}</p>
            <span className="inline-block mt-4 text-xs font-medium text-violet-400">{c.cta} →</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
