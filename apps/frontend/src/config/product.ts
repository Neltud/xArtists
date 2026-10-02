/**
 * Product map — single truth for nav + honesty badges.
 * LIVE = SC deployed + gate can*() typically true when secrets/runtime OK.
 * PAPER = UI only or gated until proof TX.
 */

export type ProductTier = 'core' | 'secondary' | 'lab'

export type ProductModule = {
  id: string
  path: string
  label: string
  emoji: string
  tier: ProductTier
  /** Honest status for UI */
  status: 'live' | 'gated' | 'paper' | 'ui'
  blurb: string
  sc?: string
}

/** Core product — what we stand behind publicly */
export const CORE_MODULES: ProductModule[] = [
  {
    id: 'home',
    path: '/',
    label: 'Home',
    emoji: '\u25c8',
    tier: 'core',
    status: 'ui',
    blurb: 'Entr\u00e9e produit',
  },
  {
    id: 'museum',
    path: '/museum',
    label: 'Mus\u00e9e',
    emoji: '\ud83d\uddbc',
    tier: 'core',
    status: 'ui',
    blurb: 'Galerie 3D \u00b7 pas un SC',
  },
  {
    id: 'marketplace',
    path: '/marketplace',
    label: 'Marketplace',
    emoji: '\u25a3',
    tier: 'core',
    status: 'live',
    blurb: 'listNft / buyNft mainnet',
    sc: 'nft_marketplace',
  },
  {
    id: 'studio',
    path: '/studio',
    label: 'Studio',
    emoji: '\ud83c\udfa8',
    tier: 'core',
    status: 'gated',
    blurb: 'Mint / list vers marketplace',
  },
  {
    id: 'staking',
    path: '/staking',
    label: 'Staking $TRO',
    emoji: '\u25c8',
    tier: 'core',
    status: 'gated',
    blurb: 'SC tro_staking d\u00e9ploy\u00e9',
    sc: 'tro_staking',
  },
  {
    id: 'slot',
    path: '/slot',
    label: 'Slot',
    emoji: '\ud83c\udfb0',
    tier: 'core',
    status: 'gated',
    blurb: 'SC slot + house 0.5 EGLD',
    sc: 'slot_casino',
  },
  {
    id: 'agents',
    path: '/agents',
    label: 'Packs IA',
    emoji: '\u25ce',
    tier: 'core',
    status: 'paper',
    blurb: 'SC agents d\u00e9ploy\u00e9 \u00b7 mint users \u00e0 prouver',
    sc: 'agents_marketplace',
  },
  {
    id: 'wallet',
    path: '/wallet',
    label: 'Wallet',
    emoji: '\u25c7',
    tier: 'core',
    status: 'ui',
    blurb: 'Session xPortal / assets',
  },
]

export const SECONDARY_MODULES: ProductModule[] = [
  {
    id: 'my-packs',
    path: '/my-packs',
    label: 'Mes salles',
    emoji: '\ud83c\udf9b',
    tier: 'secondary',
    status: 'paper',
    blurb: 'UX holder \u00b7 paper rooms',
  },
  {
    id: 'command',
    path: '/command-center',
    label: 'Command',
    emoji: '\u2318',
    tier: 'secondary',
    status: 'paper',
    blurb: 'Aura / pulse \u00b7 pas trading live',
  },
  {
    id: 'tro',
    path: '/tro',
    label: '$TRO',
    emoji: '\u25ce',
    tier: 'secondary',
    status: 'ui',
    blurb: 'Token TRO-94c925',
  },
  {
    id: 'venues',
    path: '/venues',
    label: 'Venues',
    emoji: '\u25ce',
    tier: 'secondary',
    status: 'gated',
    blurb: 'SC venue-split',
    sc: 'venue_split',
  },
  {
    id: 'dao',
    path: '/dao',
    label: 'DAO',
    emoji: '\u2b21',
    tier: 'secondary',
    status: 'gated',
    blurb: 'SC governance',
    sc: 'tro_governance',
  },
  {
    id: 'portfolio',
    path: '/portfolio',
    label: 'Portfolio',
    emoji: '\u25a4',
    tier: 'secondary',
    status: 'ui',
    blurb: 'Vue assets',
  },
  {
    id: 'legal',
    path: '/legal',
    label: 'Legal',
    emoji: '\u00a7',
    tier: 'secondary',
    status: 'ui',
    blurb: 'Mentions \u00b7 pas un fond',
  },
  {
    id: 'status',
    path: '/go-live',
    label: 'Status SC',
    emoji: '\ud83d\ude80',
    tier: 'secondary',
    status: 'ui',
    blurb: 'Checklist mainnet honn\u00eate',
  },
  {
    id: 'sitemap',
    path: '/sitemap',
    label: 'Plan',
    emoji: '\u2630',
    tier: 'secondary',
    status: 'ui',
    blurb: 'Toutes les routes',
  },
]

/** Lab routes kept in router but not sold as product */
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
