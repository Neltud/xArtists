import { Link } from 'react-router-dom'
import PageGuide from '../components/PageGuide'

const GROUPS = [
  {
    title: 'Découvrir',
    items: [
      { to: '/gallery', label: 'Galerie', note: 'Art & éditions' },
      { to: '/tours', label: 'Tours artistiques', note: 'Culture — pas un pack IA' },
      { to: '/editions', label: 'Éditions', note: 'Collections' },
      { to: '/marketplace', label: 'Marketplace', note: 'NFT · SC soon' },
    ],
  },
  {
    title: 'Agents IA (packs)',
    items: [
      { to: '/agents', label: 'Packs', note: 'Pulse · Yield · Sentinel' },
      { to: '/my-packs', label: 'My Packs', note: 'Accès achetés' },
      { to: '/agents/lightning', label: 'Lightning ops', note: 'MCP BTC doc' },
    ],
  },
  {
    title: 'LIA (protocole paper)',
    items: [
      { to: '/trading', label: 'Trading board', note: 'Paper only' },
      { to: '/portfolio', label: 'Portfolio LIA', note: 'Book protocole' },
      { to: '/sim', label: 'Sim Lab', note: 'Simulations' },
      { to: '/entity', label: 'Entité', note: 'Succursales' },
    ],
  },
  {
    title: 'Wallet & token',
    items: [
      { to: '/wallet', label: 'Wallet user', note: 'xPortal / WC' },
      { to: '/tip', label: 'Tip', note: 'Pourboire' },
      { to: '/staking', label: 'Staking', note: 'TRO refs' },
      { to: '/tro', label: '$TRO', note: 'Token info' },
    ],
  },
  {
    title: 'DeFi refs',
    items: [
      { to: '/lp', label: 'LP pools', note: 'xExchange refs' },
      { to: '/hatom', label: 'Hatom', note: 'Lien externe' },
    ],
  },
] as const

export default function SiteMapPage() {
  return (
    <div className="animate-fade-in space-y-6 pb-10">
      <PageGuide page="entity" />
      <header>
        <h1 className="text-3xl font-black">Plan du site</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Tous les onglets · Agents ≠ Tours · LIA paper ≠ wallet user
        </p>
      </header>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {GROUPS.map(g => (
          <section key={g.title} className="card">
            <h2 className="text-sm font-bold uppercase tracking-wider text-purple-300/90 mb-3">
              {g.title}
            </h2>
            <ul className="space-y-2">
              {g.items.map(it => (
                <li key={it.to}>
                  <Link
                    to={it.to}
                    className="flex justify-between gap-2 rounded-lg border border-white/5 px-3 py-2 hover:border-purple-400/40 transition-colors"
                  >
                    <span className="font-medium text-white text-sm">{it.label}</span>
                    <span className="text-[10px] text-zinc-500 text-right">{it.note}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="text-[11px] text-zinc-600">
        Vellum = cerveau LIA (service payant). Ce site = corps produit GitHub Pages.
      </p>
    </div>
  )
}
