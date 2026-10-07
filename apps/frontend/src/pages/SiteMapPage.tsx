import { Link } from 'react-router-dom'
import PageGuide from '../components/PageGuide'

const GROUPS = [
  {
    title: 'Monument & découverte',
    items: [
      { to: '/', label: 'Accueil · Grande galerie 3D', note: 'Menu en salles' },
      { to: '/museum', label: 'Musée', note: 'Galerie WebGL' },
      { to: '/gallery', label: 'Gallery', note: 'Collection' },
      { to: '/tours', label: 'Tours', note: 'Parcours culture' },
      { to: '/demo', label: 'Demo', note: 'Visite guidée' },
      { to: '/tca', label: 'TCA Classroom', note: 'Masterclass' },
    ],
  },
  {
    title: 'Marché & assets',
    items: [
      { to: '/marketplace', label: 'Marketplace', note: 'Listings NFT' },
      { to: '/market', label: 'Market analytics', note: 'Signaux' },
      { to: '/studio', label: 'Studio', note: 'Mint / créateur' },
      { to: '/agents', label: 'Packs Agents', note: 'Pulse · Yield · Sentinel' },
      { to: '/my-packs', label: 'Mes salles', note: 'Holders' },
      { to: '/slot', label: 'Slot', note: 'EGLD live' },
    ],
  },
  {
    title: 'Ops & token',
    items: [
      { to: '/command-center', label: 'Command Center', note: 'HUD holo' },
      { to: '/lia', label: 'LIA', note: 'Oracle paper' },
      { to: '/staking', label: 'Staking $TRO', note: 'On-chain' },
      { to: '/tro', label: '$TRO', note: 'Token' },
      { to: '/lp', label: 'LP pools', note: 'xExchange' },
      { to: '/dao', label: 'DAO', note: 'Gouvernance' },
    ],
  },
  {
    title: 'Compte & légal',
    items: [
      { to: '/wallet', label: 'Wallet', note: 'xPortal' },
      { to: '/portfolio', label: 'Portfolio', note: 'Inventaire' },
      { to: '/identity', label: 'Identity', note: 'MX-8004' },
      { to: '/legal', label: 'Mentions légales', note: 'SIRET' },
      { to: '/go-live', label: 'Go-live', note: 'Checklist' },
      { to: '/sitemap', label: 'Plan du site', note: 'Cette page' },
    ],
  },
]

export default function SiteMapPage() {
  return (
    <div className="animate-fade-in max-w-2xl mx-auto space-y-8 pb-16">
      <PageGuide page="sitemap" />
      <header className="space-y-2">
        <p className="section-label">Navigation</p>
        <h1 className="section-title display">Plan du site</h1>
        <div className="atelier-title-rule" aria-hidden />
        <p className="section-lead">Toutes les portes du monument — clique pour y entrer.</p>
      </header>
      {GROUPS.map(g => (
        <section key={g.title} className="space-y-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            {g.title}
          </h2>
          <ul className="space-y-2">
            {g.items.map(it => (
              <li key={it.to}>
                <Link
                  to={it.to}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3 transition hover:border-violet-400/40 hover:bg-violet-950/20"
                >
                  <span>
                    <span className="block text-sm font-medium text-zinc-100 group-hover:text-white">
                      {it.label}
                    </span>
                    <span className="text-[11px] text-zinc-500">{it.note}</span>
                  </span>
                  <span className="text-violet-300/80 text-lg" aria-hidden>
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
