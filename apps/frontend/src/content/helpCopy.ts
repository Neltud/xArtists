/**
 * Centralized help copy — PageGuide + InfoTip.
 * Agents IA = Pulse·Yield·Sentinel only. Tours art = separate service.
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
  museumGame: {
    title: 'Musée exploration',
    body: 'WASD ou flèches pour avancer dans la galerie. E ou clic pour inspecter une œuvre. Intention d’achat = paper tant que le marketplace SC n’est pas vérifié.',
  },
  softLaunch: {
    title: 'Soft launch paper',
    body: 'Démo publique honnête : lectures on-chain, packs limités, trading LIA off, SC market/agents pending.',
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
  | 'tip'
  | 'editions'
  | 'entity'
  | 'tours'
  | 'sim'

export const PAGE_GUIDE: Record<
  PageGuideKey,
  { title: string; bullets: string[]; warn?: string }
> = {
  dashboard: {
    title: 'Home',
    bullets: [
      'Parcours : Connect → Wallet → Musée → Tours → Packs.',
      '⌘K : intention LIA (paper par défaut).',
      'Wallet = toi · Trading/Portfolio = protocole LIA paper.',
    ],
  },
  entity: {
    title: 'Entité',
    bullets: ['Organisation xArtists.', 'GO_DEMO paper — pas le commerce SC.'],
    warn: 'Pas de faux GMV tant que codeHash null.',
  },
  tours: {
    title: 'Tours art',
    bullets: [
      'Service culturel (expos, parcours).',
      'Séparés des packs Agents IA.',
    ],
  },
  trading: {
    title: 'Trading LIA',
    bullets: ['Board paper.', 'Guardian-first.', 'Live OFF par défaut.'],
    warn: 'Aucun ordre auto sur vos fonds.',
  },
  wallet: {
    title: 'Wallet',
    bullets: ['Soldes + NFT API MultiversX.', 'paste = lecture seule.'],
  },
  portfolio: {
    title: 'Portfolio LIA',
    bullets: ['Book protocole.', 'Séparé de /wallet.'],
  },
  marketplace: {
    title: 'Marketplace',
    bullets: ['List/Buy après codeHash.', 'Catalogue lisible en paper.'],
    warn: 'SC non live = pas de faux market.',
  },
  agents: {
    title: 'Packs',
    bullets: ['Pulse · Yield · Sentinel.', 'Pas un dépôt de trading.'],
  },
  dao: {
    title: 'DAO',
    bullets: ['Gouvernance produit.', 'Pas de promesse de rendement.'],
  },
  gallery: {
    title: 'Galerie',
    bullets: ['Catalogue collections.', 'Musée = exploration 3D.'],
  },
  staking: {
    title: 'Staking',
    bullets: ['Modules stake selon SC live.'],
  },
  tro: {
    title: '$TRO',
    bullets: ['Utilitaire.', 'Burns documentés (Burnify).'],
  },
  hatom: {
    title: 'Hatom',
    bullets: ['Lecture DeFi.', 'Pas d’exécution auto.'],
  },
  'my-packs': {
    title: 'My Packs',
    bullets: ['Access pass / collections on-chain quand dispo.'],
  },
  studio: {
    title: 'Studio',
    bullets: ['Création / brouillons artiste.'],
  },
  tip: {
    title: 'Tip',
    bullets: ['Pourboire optionnel.', '≠ investissement.'],
  },
  editions: {
    title: 'Editions',
    bullets: ['Éditions limitées produit.'],
  },
  sim: {
    title: 'Sim Lab',
    bullets: ['Simulations paper uniquement.'],
  },
}
