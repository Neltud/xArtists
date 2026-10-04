/** Product map — labels utilisateur (jargon technique minimal). */

export type ProductTier = 'core' | 'secondary'

export type ProductModule = {
  id: string
  path: string
  label: string
  emoji: string
  tier: ProductTier
  /** live = on-chain utilisable · soon = UI prête SC en cours · ui = interface */
  status: 'live' | 'soon' | 'ui'
  blurb: string
  sc?: string
}

export const CORE_MODULES: ProductModule[] = [
  { id: 'home', path: '/', label: 'Accueil', emoji: '◈', tier: 'core', status: 'ui', blurb: 'Entrée' },
  {
    id: 'museum',
    path: '/museum',
    label: 'Musée',
    emoji: '🖼',
    tier: 'core',
    status: 'ui',
    blurb: 'Galerie 3D · murs venue',
  },
  {
    id: 'marketplace',
    path: '/marketplace',
    label: 'Marketplace',
    emoji: '▣',
    tier: 'core',
    status: 'live',
    blurb: 'List / buy NFT',
    sc: 'nft_marketplace',
  },
  {
    id: 'studio',
    path: '/studio',
    label: 'Studio',
    emoji: '🎨',
    tier: 'core',
    status: 'live',
    blurb: 'Créer · lister',
  },
  {
    id: 'staking',
    path: '/staking',
    label: 'Staking',
    emoji: '◈',
    tier: 'core',
    status: 'live',
    blurb: 'Stake / unstake $TRO',
    sc: 'tro_staking',
  },
  {
    id: 'slot',
    path: '/slot',
    label: 'Slot',
    emoji: '🎰',
    tier: 'core',
    status: 'ui',
    blurb: 'Jeu Fun · réel bientôt',
    sc: 'slot_casino',
  },
  {
    id: 'agents',
    path: '/agents',
    label: 'Packs IA',
    emoji: '◎',
    tier: 'core',
    status: 'soon',
    blurb: 'Salles holder · mint bientôt',
    sc: 'agents_marketplace',
  },
  {
    id: 'wallet',
    path: '/wallet',
    label: 'Wallet',
    emoji: '◇',
    tier: 'core',
    status: 'ui',
    blurb: 'Session · MoonPay',
  },
]

export const SECONDARY_MODULES: ProductModule[] = [
  {
    id: 'lia',
    path: '/lia',
    label: 'LIA Hub',
    emoji: '◉',
    tier: 'secondary',
    status: 'ui',
    blurb: 'Profil protocole · décisions · preuve simulée',
  },
  {
    id: 'market',
    path: '/market',
    label: 'Marché',
    emoji: '📊',
    tier: 'secondary',
    status: 'ui',
    blurb: 'Sentiment · matrice · signaux',
  },
  {
    id: 'lp',
    path: '/lp',
    label: 'LP pools',
    emoji: '💧',
    tier: 'secondary',
    status: 'ui',
    blurb: 'TRO · xExchange · OneDex',
  },
  {
    id: 'my-packs',
    path: '/my-packs',
    label: 'Mes salles',
    emoji: '🎛',
    tier: 'secondary',
    status: 'ui',
    blurb: 'Salles pack holder',
  },
  {
    id: 'command',
    path: '/command-center',
    label: 'Command',
    emoji: '⌘',
    tier: 'secondary',
    status: 'ui',
    blurb: 'Centre ops',
  },
  {
    id: 'venues',
    path: '/venues',
    label: 'Venues',
    emoji: '◎',
    tier: 'secondary',
    status: 'live',
    blurb: 'Louer un mur',
    sc: 'venue_split',
  },
  {
    id: 'tro',
    path: '/tro',
    label: '$TRO',
    emoji: '◎',
    tier: 'secondary',
    status: 'ui',
    blurb: 'Token TRO',
  },
  {
    id: 'dao',
    path: '/dao',
    label: 'DAO',
    emoji: '⬡',
    tier: 'secondary',
    status: 'soon',
    blurb: 'Gouvernance',
    sc: 'tro_governance',
  },
  {
    id: 'portfolio',
    path: '/portfolio',
    label: 'Portfolio',
    emoji: '▤',
    tier: 'secondary',
    status: 'ui',
    blurb: 'Avoirs wallet',
  },
  {
    id: 'legal',
    path: '/legal',
    label: 'Mentions',
    emoji: '§',
    tier: 'secondary',
    status: 'ui',
    blurb: 'Légal',
  },
  {
    id: 'go-live',
    path: '/go-live',
    label: 'Go-live',
    emoji: '✓',
    tier: 'secondary',
    status: 'ui',
    blurb: 'Checklist mainnet',
  },
  {
    id: 'sitemap',
    path: '/sitemap',
    label: 'Plan du site',
    emoji: '☰',
    tier: 'secondary',
    status: 'ui',
    blurb: 'Toutes les routes',
  },
]

export const ALL_MODULES = [...CORE_MODULES, ...SECONDARY_MODULES]
