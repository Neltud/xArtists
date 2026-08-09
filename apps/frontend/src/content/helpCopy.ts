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
    body: 'Marketplace NFT et Agents Marketplace : code source prêt (pause, CEI, fee cap, 2-step ownership). agents_marketplace adresse = null jusqu’au deploy mainnet + codeHash.',
  },
  mainnetOnly: {
    title: 'Mainnet only',
    body: 'Builds et chemins de deploy forcés mainnet (chainId 1). Devnet désactivé côté scripts opérateurs.',
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

export const PAGE_GUIDE: Record<
  PageGuideKey,
  { title: string; bullets: string[]; warn?: string }
> = {
  dashboard: {
    title: 'Dashboard',
    bullets: [
      'Vue synthétique LIA (portfolio treasury, guard status, Battle of Nodes).',
      'Les montants LIA ne sont pas votre solde wallet.',
      'Actualisez si le bandeau « données périmées » apparaît.',
    ],
  },
  trading: {
    title: 'Trading Terminal LIA',
    bullets: [
      'Signaux Vellum + trailing + historique paper.',
      'Guardian-first : pas d’ordre si risk gate KO.',
      'Modes : DEFENSE / COMPOUND / MICRO_ARB / MOMENTUM / YIELD…',
      'Live trading désactivé jusqu’à micro-preuve (LIA_LIVE_TRADING=0).',
    ],
    warn: 'Paper / simulation — aucun ordre on-chain automatique sur vos fonds.',
  },
  wallet: {
    title: 'Wallet (scan LIA treasury)',
    bullets: [
      'Scan ESDT / Hatom / LP de l’adresse LIA (treasury).',
      'Pour votre propre wallet : connectez xPortal (bouton Header).',
      'Hatom health factor et positions yield sont lus en lecture seule.',
    ],
    warn: 'Cette page liste le wallet LIA, pas automatiquement le vôtre.',
  },
  portfolio: {
    title: 'Portfolio',
    bullets: [
      'Agrégation valeur LIA + positions suivies.',
      'Séparation claire treasury vs utilisateur une fois wallet connecté.',
      'Données oracles / API MultiversX + fichiers data/ GitHub.',
    ],
  },
  marketplace: {
    title: 'Marketplace NFT / RWA',
    bullets: [
      'List / Buy via sdk-dapp lorsque wallet connecté.',
      'SC marketplace déployé ; fees + royalties capés (≤ 10 %).',
      'Agents Marketplace : adresse à renseigner après deploy mainnet.',
    ],
  },
  agents: {
    title: 'Agents',
    bullets: [
      'Catalogue agents LIA + GreenSmoke + Warps.',
      'List/Buy actions agents dès que SC agents_marketplace est live.',
      'GSN = prévisions advisory ; packs sub-agents LIA = marketplace séparé.',
    ],
  },
  dao: {
    title: 'DAO $TRO',
    bullets: [
      'Gouvernance on-chain (quorum 60 %).',
      'Staking TRO requis pour voter selon policy contrat.',
    ],
  },
  gallery: {
    title: 'Gallery',
    bullets: [
      'Collections xArtists mainnet + filtres.',
      'Phygital / RWA : 1 TRO max pour NFT physique (policy).',
    ],
  },
  staking: {
    title: 'Staking',
    bullets: ['NFT staking + TRO staking selon contrats déployés.', 'Rewards claim via wallet utilisateur.'],
  },
  tro: {
    title: '$TRO',
    bullets: [
      'Utilité : rewards, staking, DAO, RWA physical claim.',
      'LIA ne conserve pas de TRO long terme (asset policy redistribute).',
    ],
  },
  hatom: {
    title: 'Hatom / Yield',
    bullets: [
      'Positions Hatom lues en lecture seule (wallet LIA).',
      'LIA Yield agent peut allouer selon policy (pas de live sans flag).',
    ],
  },
}
