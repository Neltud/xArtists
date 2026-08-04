/**
 * Cartes parcours — rétention & clarté FR
 */

const CARDS = [
  {
    emoji: '🎨',
    title: 'Studio artiste',
    body: 'Prépare collection et NFT (image, vidéo, musique). Média sur IPFS ; mint via guide mxpy.',
    href: '/studio',
    cta: 'Ouvrir Studio',
  },
  {
    emoji: '🖼️',
    title: 'Galerie & Market',
    body: 'Parcours les collections xArtists. Market on-chain après deploy SC ; XOXNO en externe.',
    href: '/gallery',
    cta: 'Galerie',
  },
  {
    emoji: '🧠',
    title: 'Agents LIA',
    body: 'Packs Vellum (trading, yield…). GreenSmoke = prévisions externes, pas les packs à vendre.',
    href: '/agents',
    cta: 'Agents',
  },
  {
    emoji: '💎',
    title: '$TRO',
    body: 'Token gouvernance. Supply maximum 500 000 TRO. Achat via DEX MultiversX.',
    href: '/tro',
    cta: 'Token $TRO',
  },
  {
    emoji: '🗳️',
    title: 'DAO',
    body: 'Proposals en lecture seule jusqu’au branchement vote on-chain. Quorum cible 60 %.',
    href: '/dao',
    cta: 'DAO',
  },
  {
    emoji: '🏦',
    title: 'DeFi (Hatom / LP)',
    body: 'Positions yield et liquidité — liens protocoles ; LIA gère le wallet ops.',
    href: '/hatom',
    cta: 'Hatom',
  },
]

export default function ExplainCards() {
  return (
    <section className="mb-10" aria-labelledby="how-title">
      <div className="mb-5">
        <h2 id="how-title" className="text-xl font-bold">
          Comment naviguer
        </h2>
        <p className="text-sm text-zinc-500 mt-1">Raccourcis clairs — un clic pour chaque rôle.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map(c => (
          <a
            key={c.href}
            href={`/xArtists${c.href}`}
            className="card group block hover:border-violet-500/40 transition-colors focus-visible:ring-2 focus-visible:ring-purple-500"
          >
            <div className="text-2xl mb-3" aria-hidden>
              {c.emoji}
            </div>
            <h3 className="font-semibold text-white group-hover:text-violet-300">{c.title}</h3>
            <p className="text-sm text-zinc-400 mt-2 leading-relaxed">{c.body}</p>
            <span className="inline-block mt-4 text-xs font-medium text-violet-400">{c.cta} →</span>
          </a>
        ))}
      </div>
    </section>
  )
}
