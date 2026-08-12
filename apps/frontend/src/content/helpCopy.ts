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
    body: 'LIA_LIVE_TRADING=0 par défaut. Les trades affichés sont paper / simulation jusqu’à micro-preuve + signature validée. Aucun fonds utilisateur n’est engagé sans action wallet explicite.',
  },
  guardianFirst: {
    title: 'Guardian avant Brain',
    body: 'Aucun ordre n’est proposé si le Guardian (spiral_score, leverage, risk) refuse. Le Brain ne décide qu’après le gate de sécurité.',
  },
  profitLock: {
    title: 'Profit lock 70/30',
    body: 'Sur gain net : 70 % restent en compound (equity de trading), 30 % vont en surplus / reserve policy. Paramètres dans CircuitConfig.',
  },
  scStatus: {
    title: 'Smart contracts',
    body: 'Marketplace NFT et Agents Marketplace : code source prêt. agents_marketplace = null jusqu’au deploy mainnet + codeHash. List/Buy bloqués tant que codeHash OK absent.',
  },
  mainnetOnly: {
    title: 'Mainnet only',
    body: 'Builds et chemins de deploy forcés mainnet (chainId 1).',
  },
  troUtility: {
    title: '$TRO',
    body: 'Token utilitaire (cap 500k). Rewards, staking, gouvernance DAO (quorum 60 %). 1 TRO max pour NFT physique (policy RWA).',
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

export const PAGE_GUIDE: Record<
  PageGuideKey,
  { title: string; bullets: string[]; warn?: string }
> = {
  dashboard: {
    title: 'Home',
    bullets: [
      'Hub dApp : persona, dual marketplace (Art + Agents), état SC, Guardian.',
      'Wallet Connect = session utilisateur. Portfolio = board LIA protocole.',
      'My Packs = access Model C (paper), pas un dépôt de trading.',
    ],
  },
  trading: {
    title: 'Trading Terminal LIA',
    bullets: [
      'Signaux Vellum + trailing + historique paper.',
      'Guardian-first : pas d’ordre si risk gate KO.',
      'Live trading désactivé jusqu’à micro-preuve (LIA_LIVE_TRADING=0).',
    ],
    warn: 'Paper / simulation — aucun ordre on-chain automatique sur vos fonds.',
  },
  wallet: {
    title: 'Mon wallet (utilisateur)',
    bullets: [
      'Soldes de l’adresse Connect uniquement.',
      'Jamais le wallet LIA protocole ici.',
      'Pour treasury LIA → page Portfolio.',
    ],
  },
  portfolio: {
    title: 'Portfolio LIA (protocole)',
    bullets: [
      'Agrégation valeur LIA ops + positions suivies.',
      'Séparé de /wallet (utilisateur).',
      'Données oracles / API MultiversX + data/ GitHub.',
    ],
  },
  marketplace: {
    title: 'Marketplace NFT / RWA',
    bullets: [
      'List / Buy après codeHash marketplace live.',
      'paste_readonly ne peut pas signer.',
      'Fees + royalties selon SC.',
    ],
    warn: 'SC non live = bandeau + pas de faux market.',
  },
  agents: {
    title: 'Agents',
    bullets: [
      '3 packs Access : Pulse 18 € · Yield 12 € · Sentinel 8 €.',
      'GSN = signal only, pas un produit vendu.',
      'Checkout fiat → membership (Model C) via My Packs.',
    ],
  },
  'my-packs': {
    title: 'My Packs',
    bullets: [
      'Access pass membership — Model C.',
      'Performance affichée = paper router LIA.',
      'Aucun fonds user tradé pour le pack à ce stade.',
    ],
    warn: 'Pas un fonds géré. Pas de deposit trading.',
  },
  dao: {
    title: 'DAO $TRO',
    bullets: [
      'Gouvernance (quorum 60 %).',
      'Vote on-chain seulement si UI + SC branchés — sinon lecture.',
    ],
  },
  gallery: {
    title: 'Gallery',
    bullets: [
      'Collections xArtists mainnet + filtres.',
      'Phygital / RWA : 1 TRO max œuvre physique (à la vente).',
    ],
  },
  staking: {
    title: 'Staking',
    bullets: ['NFT / TRO staking selon contrats déployés.', 'Rewards claim via wallet utilisateur.'],
  },
  tro: {
    title: '$TRO',
    bullets: [
      'Cap supply 500 000.',
      'Utilité : rewards, staking, DAO, RWA physical claim.',
    ],
  },
  hatom: {
    title: 'Hatom / Yield',
    bullets: [
      'Positions Hatom (lecture) — priorité MVX pour LIA.',
      'Soul = pre-mainnet séparé.',
    ],
  },
}
