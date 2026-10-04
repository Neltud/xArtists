/** Product map — labels utilisateur (pas de jargon paper). */

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
  { id: 'museum', path: '/museum', label: 'Musée', emoji: '🖼', tier: 'core', status: 'ui', blurb: 'Galerie 3D · murs venue' },
  { id: 'marketplace', path: '/marketplace', label: 'Marketplace', emoji: '▣', tier: 'core', status: 'live', blurb: 'List / buy NFT', sc: 'nft_marketplace' },
  { id: 'studio', path: '/studio', label: 'Studio', emoji: '🎨', tier: 'core', status: 'live', blurb: 'Créer · lister' },
  { id: 'staking', path: '/staking', label: 'Staking', emoji: '◈', tier: 'core', status: 'live', blurb: 'Stake / unstake $TRO', sc: 'tro_staking' },
  { id: 'slot', path: '/slot', label: 'Slot', emoji: '🎰', tier: 'core', status: 'ui', blurb: 'Jeu Fun · réel bientôt', sc: 'slot_casino' },
  { id: 'agents', path: '/agents', label: 'Packs IA', emoji: '◎', tier: 'core', status: 'soon', blurb: 'Salles holder · mint SC bientôt', sc: 'agents_marketplace' },
  { id: 'wallet', path: '/wallet', label: 'Wallet', emoji: '◇', tier: 'core', status: 'ui', blurb: 'Session · MoonPay' },
]

export const SECONDARY_MODULES: ProductModule[] = [
  { id: 'lia', path: '/lia', label: 'LIA Hub', emoji: '◉', tier: 'secondary', status: 'ui', blurb: 'Profil protocole · mindset · shadow' },
  { id: 'market', path: '/market', label: 'Marché', emoji: '📊', tier: 'secondary', status: 'ui', blurb: 'F&G · matrice 10 col · paper' },
  { id: 'my-packs', path: '/my-packs', label: 'Mes salles', emoji: '🎛', tier: 'secondary', status: 'ui', blurb: 'Salles pack' },
  { id: 'command', path: '/command-center', label: 'Command', emoji: '⌘', tier: 'secondary', status: 'ui', blurb: 'Centre ops' },
  { id: 'venues', path: '/venues', label: 'Venues', emoji: '◎', tier: 'secondary', status: 'live', blurb: 'Louer un mur', sc: 'venue_split' },
  { id: 'lp', path: '/lp', label: 'LP pools', emoji: '💧', tier: 'secondary', status: 'ui', blurb: 'TRO xExchange · OneDex' },
  { id: 'tro', path: '/tro', label: '$TRO', emoji: '◎', tier: 'secondary', status: 'ui', blurb: 'Token TRO' },
  { id: 'dao', path: '/dao', label: 'DAO', emoji: '⬡', tier: 'secondary', status: 'soon', blurb: 'Gouvernance', sc: 'tro_governance' },
  { id: 'portfolio', path: '/portfolio', label: 'Portfolio', emoji: '▤', tier: 'secondary', status: 'ui', blurb: 'Assets user' },
  { id: 'legal', path: '/legal', label: 'Legal', emoji: '§', tier: 'secondary', status: 'ui', blurb: 'Mentions' },
  { id: 'status', path: '/go-live', label: 'Statut', emoji: '✓', tier: 'secondary', status: 'ui', blurb: 'RCE · checklist' },
]

export const STATUS_LABEL: Record<ProductModule['status'], string> = {
  live: 'LIVE',
  soon: 'BIENTÔT',
  ui: 'OUVERT',
}

export const STATUS_CLASS: Record<ProductModule['status'], string> = {
  live: 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10',
  soon: 'border-amber-500/35 text-amber-200 bg-amber-500/10',
  ui: 'border-white/15 text-zinc-300 bg-white/5',
}
