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
  | 'tip'
  | 'editions'
  | 'entity'
  | 'voyage'
  | 'sim'

export const PAGE_GUIDE: Record<
  PageGuideKey,
  { title: string; bullets: string[]; warn?: string }
> = {
  dashboard: {
    title: 'Home — parcours',
    bullets: [
      'Étapes : Connecter → Packs → Board LIA → Studio/Galerie.',
      'Raccourcis : Voyage · On-ramp Fiat · Board · Packs.',
      '⌘K : intention (buy EGLD → on-ramp, voyage, trading…).',
      'Wallet = toi · Portfolio/Trading = protocole LIA (paper).',
      'My Packs = access pass, pas un dépôt de trading.',
    ],
  },
  entity: {
    title: 'Entité xArtists',
    bullets: [
      'Carte de l’organisation protocole et de ses 15 succursales.',
      'Verdict GO_DEMO = UI + data live + LIA paper — pas le commerce SC.',
      'LIA ops wallet ≠ wallet utilisateur.',
      'Roadmap P0 : deploy SC + codeHash avant micro List/Buy.',
    ],
    warn: 'Pas de faux GMV tant que marketplace/agents codeHash null.',
  },
  voyage: {
    title: 'Agent de Voyage',
    bullets: [
      'Pack thématique travel / culture / RWA hospitality.',
      'Signaux advisory uniquement (v1) — pas de réservation hôtel/vol.',
      'LIA peut utiliser un soft bias (weight_cap 0.12) en fusion paper.',
      'Mint NFT pack après deploy SC agents.',
    ],
    warn: 'Aucun booking ni custody voyage.',
  },
  sim: {
    title: 'Simulation Lab',
    bullets: [
      'Parcours et modules simulés pour démo exhaustive.',
      'Trades LIA paper — brancher TX après deploy SC.',
    ],
  },
  trading: {
    title: 'Trading Terminal LIA',
    bullets: [
      'Board protocole (JSON) — pas ton compte.',
      'Liquidity Orchestrator paper (pas de bridge live).',
      'Fusion signaux : GSN ≥80 % · Polymarket · feeds.',
      'Compounding 10 colonnes · paper legs · Guardian-first.',
      'LIA_LIVE_TRADING=0 jusqu’aux micro-preuves.',
    ],
    warn: 'Aucun ordre auto sur vos fonds.',
  },
  wallet: {
    title: 'Mon wallet (utilisateur)',
    bullets: [
      'Soldes + NFT via API MultiversX sur ton adresse Connect.',
      'paste = lecture seule · Web Wallet / extension pour signer.',
      'Treasury LIA → page Portfolio.',
    ],
  },
  portfolio: {
    title: 'Portfolio LIA (protocole)',
    bullets: ['Book LIA ops.', 'Séparé de /wallet.'],
  },
  marketplace: {
    title: 'Marketplace NFT / RWA',
    bullets: ['List/Buy après codeHash.', 'paste_readonly = pas de signature.', 'Offer = V2.'],
    warn: 'SC non live = pas de faux market.',
  },
  agents: {
    title: 'Agents',
    bullets: [
      'Packs : Pulse · Yield · Sentinel · Voyage.',
      'GSN = prédictions externes ≥80 % pour LIA (pas tes packs).',
      'Capital agent optionnel = escrow isolé (Soon).',
    ],
  },
  'my-packs': {
    title: 'My Packs',
    bullets: [
      'Access pass Model C.',
      'Perf affichée = paper.',
      'Fund capital agent = bientôt (isolé, plafond 10×).',
    ],
    warn: 'Pas un fonds géré.',
  },
  studio: {
    title: 'Studio artiste',
    bullets: [
      '4 étapes : collection → IPFS → metadata → mint/list.',
      'JWT Pinata jamais dans le front (proxy ops).',
      'Wallet artiste ≠ LIA ops.',
    ],
    warn: 'Mint on-chain = wallet signant + gaz EGLD.',
  },
  dao: {
    title: 'DAO $TRO',
    bullets: ['Gouvernance lecture / holders live.', 'Pas de faux vote sans sdk-dapp.'],
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
  tip: {
    title: 'Tip / dons',
    bullets: [
      'Don volontaire vers LIA Ops — pas un investissement.',
      'Tip on-chain : wallet user + memo tip:mission|reserve|ops.',
    ],
    warn: 'Ne confonds pas tip et achat de parts de fonds.',
  },
  editions: {
    title: 'xArtists Editions',
    bullets: [
      'Lettre mensuelle art · culture · tech.',
      'Abonnement ≠ investissement / yield.',
    ],
  },
}
