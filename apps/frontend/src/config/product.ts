/** Product map — honesty badges for mainnet capacity. */

export type ProductTier = 'core' | 'secondary' | 'lab'

export type ProductModule = {
  id: string
  path: string
  label: string
  emoji: string
  tier: ProductTier
  status: 'live' | 'gated' | 'paper' | 'ui'
  blurb: string
  sc?: string
}

export const CORE_MODULES: ProductModule[] = [
  {
    id: 'home',
    path: '/',
    label: 'Home',
    emoji: '◈',
    tier: 'core',
    status: 'ui',
    blurb: 'Entrée produit',
  },
  {
    id: 'museum',
    path: '/museum',
    label: 'Musée',
    emoji: '🖼',
    tier: 'core',
    status: 'ui',
    blurb: 'Galerie 3D · pas un SC',
  },
  {
    id: 'marketplace',
    path: '/marketplace',
    label: 'Marketplace',
    emoji: '▣',
    tier: 'core',
    status: 'live',
    blurb: 'listNft / buyNft mainnet',
    sc: 'nft_marketplace',
  },
  {
    id: 'studio',
    path: '/studio',
    label: 'Studio',
    emoji: '🎨',
    tier: 'core',
    status: 'gated',
    blurb: 'Issue · mint · list',
  },
  {
    id: 'staking',
    path: '/staking',
    label: 'Staking $TRO',
    emoji: '◈',
    tier: 'core',
    status: 'live',
    blurb: 'stake / unstake TRO prouvés',
    sc: 'tro_staking',
  },
  {
    id: 'slot',
    path: '/slot',
    label: 'Slot',
    emoji: '🎰',
    tier: 'core',
    status: 'paper',
    blurb: 'Fun OK · réel après upgrade SC',
    sc: 'slot_casino',
  },
  {
    id: 'agents',
    path: '/agents',
    label: 'Packs IA',
    emoji: '◎',
    tier: 'core',
    status: 'paper',
    blurb: 'Paper · buyAgentAction si listing',
    sc: 'agents_marketplace',
  },
  {
    id: 'wallet',
    path: '/wallet',
    label: 'Wallet',
    emoji: '◇',
    tier: 'core',
    status: 'ui',
    blurb: 'Session xPortal',
  },
]

export const SECONDARY_MODULES: ProductModule[] = [
  {
    id: 'my-packs',
    path: '/my-packs',
    label: 'Mes salles',
    emoji: '🎛',
    tier: 'secondary',
    status: 'paper',
    blurb: 'Salles holder paper',
  },
  {
    id: 'command',
    path: '/command-center',
    label: 'Command',
    emoji: '⌘',
    tier: 'secondary',
    status: 'paper',
    blurb: 'Moniteur pack',
  },
  {
    id: 'tro',
    path: '/tro',
    label: '$TRO',
    emoji: '◎',
    tier: 'secondary',
    status: 'ui',
    blurb: 'Token TRO-94c925',
  },
  {
    id: 'venues',
    path: '/venues',
    label: 'Venues',
    emoji: '◎',
    tier: 'secondary',
    status: 'live',
    blurb: 'rentPay prouvé',
    sc: 'venue_split',
  },
  {
    id: 'dao',
    path: '/dao',
    label: 'DAO',
    emoji: '⬡',
    tier: 'secondary',
    status: 'gated',
    blurb: 'createProposal / vote',
    sc: 'tro_governance',
  },
  {
    id: 'portfolio',
    path: '/portfolio',
    label: 'Portfolio',
    emoji: '▤',
    tier: 'secondary',
    status: 'ui',
    blurb: 'Vue assets',
  },
  {
    id: 'legal',
    path: '/legal',
    label: 'Legal',
    emoji: '§',
    tier: 'secondary',
    status: 'ui',
    blurb: 'Mentions · pas un fond',
  },
  {
    id: 'status',
    path: '/go-live',
    label: 'Status SC',
    emoji: '🚀',
    tier: 'secondary',
    status: 'ui',
    blurb: 'Checklist mainnet',
  },
  {
    id: 'sitemap',
    path: '/sitemap',
    label: 'Plan',
    emoji: '☰',
    tier: 'secondary',
    status: 'ui',
    blurb: 'Toutes les routes',
  },
]

export const LAB_PATHS = [
  '/simulation',
  '/entities',
  '/burnify',
  '/ads',
  '/payments',
  '/lia',
  '/trading',
  '/identity',
  '/gallery',
  '/market',
  '/demo',
  '/tours',
  '/editions',
  '/tip',
  '/lp',
  '/hatom',
  '/agents/lightning',
  '/agents/polylia',
  '/sale',
] as const

export const STATUS_LABEL: Record<ProductModule['status'], string> = {
  live: 'LIVE',
  gated: 'SC',
  paper: 'PAPER',
  ui: 'UI',
}

export const STATUS_CLASS: Record<ProductModule['status'], string> = {
  live: 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10',
  gated: 'border-cyan-500/35 text-cyan-200 bg-cyan-500/10',
  paper: 'border-amber-500/35 text-amber-200 bg-amber-500/10',
  ui: 'border-white/15 text-zinc-400 bg-white/5',
}
