/**
 * Centralized help copy — PageGuide + InfoTip.
 * Honest UX: LIA treasury ≠ user wallet; paper-first; SC status explicit.
 */

export const HELP = {
  liaVsUser: {
    title: 'LIA ≠ votre wallet',
    body: 'Le portefeuille LIA (treasury autonome) est séparé du vôtre. Les signaux et positions affichés ici concernent le circuit LIA sauf mention explicite « votre wallet ».',
  },
  paperFirst: {
    title: 'Paper-first',
    body: 'LIA_LIVE_TRADING=0 par défaut. Les trades affichés sont paper / simulation jusqu’à micro-preuve + signature validée.',
  },
  guardianFirst: {
    title: 'Guardian avant Brain',
    body: 'Aucun ordre n’est proposé si le Guardian refuse. Le Brain ne décide qu’après le gate de sécurité.',
  },
  profitLock: {
    title: 'Profit lock 70/30',
    body: 'Sur gain net : 70 % compound, 30 % surplus / reserve policy.',
  },
  scStatus: {
    title: 'Smart contracts',
    body: 'Marketplace NFT et Agents : code source prêt. List/Buy bloqués tant que codeHash OK absent.',
  },
  mainnetOnly: {
    title: 'Mainnet only',
    body: 'Builds et deploy forcés mainnet (chainId 1).',
  },
  troUtility: {
    title: '$TRO',
    body: 'Token utilitaire (cap 500k). 1 TRO max pour NFT physique (policy RWA).',
  },
} as const

export type PageGuideKey =
  | 'dashboard'
  | 'trading'
  | 'wallet'
  | 'portfolio'
  | 'marketplace'
  | 'agents'
  | 'dao'
  | 'gallery'
  | 'staking'
  | 'tro'
  | 'hatom'
  | 'my-packs'
  | 'studio'

export const PAGE_GUIDE: Record<
  PageGuideKey,
  { title: string; bullets: string[]; warn?: string }
> = {
  dashboard: {
    title: 'Home',
    bullets: [
      'Hub dApp : persona, dual market, SC, Guardian.',
      'Wallet = user · Portfolio = LIA · My Packs = access paper.',
    ],
  },
  trading: {
    title: 'Trading Terminal LIA',
    bullets: ['Signaux + paper.', 'Guardian-first.', 'LIA_LIVE_TRADING=0 par défaut.'],
    warn: 'Paper — pas d’ordre auto sur vos fonds.',
  },
  wallet: {
    title: 'Mon wallet (utilisateur)',
    bullets: ['Soldes Connect uniquement.', 'Treasury LIA → Portfolio.'],
  },
  portfolio: {
    title: 'Portfolio LIA (protocole)',
    bullets: ['Board LIA ops.', 'Séparé de /wallet.'],
  },
  marketplace: {
    title: 'Marketplace NFT / RWA',
    bullets: ['List/Buy après codeHash.', 'paste_readonly = pas de signature.', 'Offer = V2.'],
    warn: 'SC non live = pas de faux market.',
  },
  agents: {
    title: 'Agents',
    bullets: ['Pulse 18 € · Yield 12 € · Sentinel 8 €.', 'GSN = signal only.', 'Model C access.'],
  },
  'my-packs': {
    title: 'My Packs',
    bullets: ['Access pass Model C.', 'Perf = paper router.', 'Pas de deposit trading.'],
    warn: 'Pas un fonds géré.',
  },
  studio: {
    title: 'Studio artiste',
    bullets: [
      '4 étapes : collection → IPFS → metadata → mint/list.',
      'JWT Pinata jamais dans le front (proxy ops).',
      'Export JSON metadata pour mxpy / minter.',
      'Wallet artiste ≠ LIA ops. List bloqué si SC market non live.',
    ],
    warn: 'Mint on-chain nécessite wallet signant + gaz EGLD.',
  },
  dao: {
    title: 'DAO $TRO',
    bullets: ['Gouvernance lecture / vote selon SC.', 'Pas de faux vote sans sdk-dapp.'],
  },
  gallery: {
    title: 'Gallery',
    bullets: ['Catalogue xArtists.', '1 TRO max œuvre physique (policy).'],
  },
  staking: {
    title: 'Staking',
    bullets: ['Selon contrats déployés.'],
  },
  tro: {
    title: '$TRO',
    bullets: ['Cap 500 000.', 'Utilité rewards / DAO / RWA claim.'],
  },
  hatom: {
    title: 'Hatom / Yield',
    bullets: ['Lecture positions MVX.', 'Soul = pre-mainnet isolé.'],
  },
}
