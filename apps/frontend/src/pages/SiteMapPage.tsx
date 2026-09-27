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
      { to: '/slot', label: 'Slot', note: 'EGLD/USDC · jackpot paper' },
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
      { to: '/lia', label: 'LIA Performance', note: '8008 · trésorerie · pipeline' },
      { to: '/trading', label: 'Trading board', note: 'Paper only' },
      { to: '/portfolio', label: 'Portfolio LIA', note: 'Book protocole' },
      { to: '/simulation', label: 'Sim Lab', note: 'Simulations' },
      { to: '/entities', label: 'Entité', note: 'Succursales' },
      { to: '/go-live', label: 'GO_LIVE', note: 'Checklist SC off' },
    ],
  },
  {
    title: 'Wallet & économie',
    items: [
      { to: '/wallet', label: 'Wallet user', note: 'xPortal / WC' },
      { to: '/tip', label: 'Tip', note: 'Soutien treasury · TIP_LIA' },
      { to: '/payments', label: 'Paiements paper', note: 'Intents locaux' },
      { to: '/ads', label: 'Ads / enchères', note: 'ADS_BID · slots pub' },
      { to: '/sale', label: 'Sale', note: 'Ventes' },
      { to: '/venues', label: 'Comptes & location', note: 'Tarifs notoriété · split' },
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
      { to: '/dao', label: 'DAO', note: 'LP TRO + ArtPass (paper)' },
      { to: '/legal', label: 'Légal', note: 'Mentions' },
      { to: '/sitemap', label: 'Plan du site', note: 'Cette page' },
      { to: '/demo', label: 'Demo tour', note: 'Parcours' },
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
        <p className="section-lead">Toutes les entrées utiles — paper-first · SC off jusqu’à GO_LIVE.</p>
      </header>
      {GROUPS.map(g => (
        <section key={g.title} className="space-y-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            {g.title}
          </h2>
          <ul className="rounded-2xl border border-white/10 bg-zinc-950/40 divide-y divide-white/5">
            {g.items.map(it => (
              <li key={it.to}>
                <Link
                  to={it.to}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors"
                >
                  <span className="text-sm text-white">{it.label}</span>
                  <span className="text-[11px] text-zinc-500 text-right">{it.note}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
