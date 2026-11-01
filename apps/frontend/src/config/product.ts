/** Product map — soft-launch core (Slot/Casino hors monorepo). */

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
  { id: 'home', path: '/', label: 'Accueil', emoji: '\u25c8', tier: 'core', status: 'ui', blurb: 'Entrée' },
  { id: 'museum', path: '/museum', label: 'Musée', emoji: '\ud83d\uddbc', tier: 'core', status: 'ui', blurb: 'Galerie 3D' },
  { id: 'marketplace', path: '/market', label: 'Marché', emoji: '\u25a3', tier: 'core', status: 'live', blurb: 'NFT · list / buy', sc: 'nft_marketplace' },
  { id: 'agents', path: '/agents', label: 'Packs IA', emoji: '\u25ce', tier: 'core', status: 'live', blurb: 'Pulse · Yield · Sentinel', sc: 'agents_marketplace' },
  { id: 'lia', path: '/lia', label: 'LIA Hub', emoji: '\u25c9', tier: 'core', status: 'ui', blurb: 'Paper only · décisions' },
  { id: 'studio', path: '/studio', label: 'Studio', emoji: '\ud83c\udfa8', tier: 'core', status: 'live', blurb: 'Créer · lister' },
  { id: 'wallet', path: '/wallet', label: 'Wallet', emoji: '\u25c7', tier: 'core', status: 'ui', blurb: 'Session · on-ramp' },
]

export const SECONDARY_MODULES: ProductModule[] = [
  {
    id: 'my-packs',
    path: '/my-packs',
    label: 'Mes salles',
    emoji: '\ud83c\udf9b',
    tier: 'secondary',
    status: 'ui',
    blurb: 'Salles pack holder',
  },
  {
    id: 'staking',
    path: '/staking',
    label: 'Staking',
    emoji: '\u25c8',
    tier: 'secondary',
    status: 'live',
    blurb: 'Stake / unstake $TRO',
    sc: 'tro_staking',
  },
  {
    id: 'command',
    path: '/command-center',
    label: 'Command',
    emoji: '\u2318',
    tier: 'secondary',
    status: 'ui',
    blurb: 'Centre ops (lab)',
  },
  {
    id: 'venues',
    path: '/venues',
    label: 'Venues',
    emoji: '\u25ce',
    tier: 'secondary',
    status: 'live',
    blurb: 'Louer un mur',
    sc: 'venue_split',
  },
  {
    id: 'tro',
    path: '/tro',
    label: '$TRO',
    emoji: '\u25ce',
    tier: 'secondary',
    status: 'ui',
    blurb: 'Token TRO',
  },
  {
    id: 'dao',
    path: '/dao',
    label: 'DAO',
    emoji: '\u2b21',
    tier: 'secondary',
    status: 'soon',
    blurb: 'Gouvernance',
    sc: 'tro_governance',
  },
  {
    id: 'portfolio',
    path: '/portfolio',
    label: 'Portfolio',
    emoji: '\u25a4',
    tier: 'secondary',
    status: 'ui',
    blurb: 'Avoirs wallet',
  },
  {
    id: 'legal',
    path: '/legal',
    label: 'Mentions',
    emoji: '\u00a7',
    tier: 'secondary',
    status: 'ui',
    blurb: 'Légal',
  },
  {
    id: 'go-live',
    path: '/go-live',
    label: 'Go-live',
    emoji: '\u2713',
    tier: 'secondary',
    status: 'ui',
    blurb: 'Checklist mainnet',
  },
  {
    id: 'sitemap',
    path: '/sitemap',
    label: 'Plan du site',
    emoji: '\u2630',
    tier: 'secondary',
    status: 'ui',
    blurb: 'Toutes les routes',
  },
]

export const ALL_MODULES = [...CORE_MODULES, ...SECONDARY_MODULES]
