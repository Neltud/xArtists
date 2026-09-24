import { Link } from 'react-router-dom'
import PageGuide from '../components/PageGuide'

const GROUPS = [
  {
    title: 'Découvrir',
    items: [
      { to: '/', label: 'Accueil', note: 'Dashboard' },
      { to: '/museum', label: 'Galerie 3D', note: 'Musée · Pulse · avatar' },
      { to: '/tours', label: 'Tours artistiques', note: 'Culture — pas un pack IA' },
      { to: '/editions', label: 'Éditions', note: 'Collections' },
      { to: '/marketplace', label: 'Marketplace', note: 'NFT · SC off' },
      { to: '/slot', label: 'Slot', note: '3×3 casino paper' },
    ],
  },
  {
    title: 'Agents IA (packs)',
    items: [
      { to: '/agents', label: 'Packs', note: 'Pulse · Yield · Sentinel' },
      { to: '/my-packs', label: 'My Packs', note: 'Accès achetés' },
      { to: '/agents/lightning', label: 'Lightning ops', note: 'MCP BTC doc' },
      { to: '/agents/polylia', label: 'Polylia', note: 'Vue multi' },
    ],
  },
  {
    title: 'LIA (protocole paper)',
    items: [
      { to: '/trading', label: 'Trading board', note: 'Paper only' },
      { to: '/portfolio', label: 'Portfolio LIA', note: 'Book protocole' },
      { to: '/sim', label: 'Sim Lab', note: 'Simulations' },
      { to: '/entity', label: 'Entité', note: 'Succursales' },
      { to: '/go-live', label: 'GO_LIVE', note: 'Checklist SC off' },
    ],
  },
  {
    title: 'Wallet & économie',
    items: [
      { to: '/wallet', label: 'Wallet user', note: 'xPortal / WC' },
      { to: '/tip', label: 'Tip', note: 'Soutien treasury' },
      { to: '/ads', label: 'Ads / enchères', note: 'Slots pub paper' },
      { to: '/sale', label: 'Sale', note: 'Ventes' },
      { to: '/venues', label: 'Comptes lieux', note: 'Musée · artiste · société' },
    ],
  },
  {
    title: 'Token & DeFi refs',
    items: [
      { to: '/tro', label: '$TRO', note: 'Token info' },
      { to: '/staking', label: 'Staking', note: 'Refs' },
      { to: '/burnify', label: 'Burnify', note: 'Burn feed' },
      { to: '/lp', label: 'LP pools', note: 'xExchange refs' },
      { to: '/hatom', label: 'Hatom', note: 'Lien externe' },
    ],
  },
  {
    title: 'Gouvernance & légal',
    items: [
      { to: '/dao', label: 'DAO', note: 'Narrative · pas de vote SC' },
      { to: '/legal', label: 'Légal', note: 'Mentions' },
      { to: '/demo', label: 'Tour démo', note: 'Parcours' },
      { to: '/sitemap', label: 'Plan du site', note: 'Cette page' },
      { to: '/soul', label: 'Soul testnet', note: 'Lab' },
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
          Routes live · DEMO_MODE · SC marketplace/agents OFF · Agents ≠ Tours · LIA paper ≠ wallet user
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

      <p className="text-xs text-zinc-600 leading-relaxed">
        Produit GitHub Pages. SC list/buy/mint désactivés tant que GO_LIVE / codeHash non validés.
        Voir <Link to="/go-live" className="text-zinc-400 underline">/go-live</Link>.
      </p>
    </div>
  )
}
