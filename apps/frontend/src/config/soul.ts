/**
 * Soul Protocol — pre-mainnet / experimental (not primary nav).
 * @see https://docs.soul.io/
 * @see lia/defi/soul_routes.py
 */

export type SoulActionId =
  | 'soul_supply'
  | 'soul_add_collateral'
  | 'soul_borrow'
  | 'soul_repay'
  | 'soul_withdraw'
  | 'soul_cross_chain_lend'
  | 'skip'

export type SoulActionMeta = {
  id: SoulActionId
  label: string
  step: number
  description: string
  /** Allowed for LIA paper intents in v1 */
  liaPaper: boolean
  /** Allowed for LIA live after mainnet gates */
  liaLiveTarget: boolean
  risk: 'low' | 'medium' | 'high' | 'blocked'
}

/** Mirror Soul docs basic ops order */
export const SOUL_ACTIONS: SoulActionMeta[] = [
  {
    id: 'soul_supply',
    label: 'Supply',
    step: 1,
    description: 'Déposer un actif sous-jacent → mint sToken (gagne des intérêts).',
    liaPaper: true,
    liaLiveTarget: true,
    risk: 'medium',
  },
  {
    id: 'soul_add_collateral',
    label: 'Add collateral',
    step: 2,
    description: 'Activer une partie des sTokens comme collatéral → unlock borrow power.',
    liaPaper: true,
    liaLiveTarget: true,
    risk: 'medium',
  },
  {
    id: 'soul_borrow',
    label: 'Borrow',
    step: 3,
    description: 'Emprunter contre collatéral (limite = CF × collateral). Suivre HF.',
    liaPaper: false,
    liaLiveTarget: false,
    risk: 'high',
  },
  {
    id: 'soul_repay',
    label: 'Repay',
    step: 4,
    description: 'Rembourser la dette → libère du collatéral / améliore HF.',
    liaPaper: true,
    liaLiveTarget: true,
    risk: 'low',
  },
  {
    id: 'soul_withdraw',
    label: 'Withdraw',
    step: 5,
    description: 'Retirer supply non collatéralisée (ou après repay).',
    liaPaper: true,
    liaLiveTarget: true,
    risk: 'medium',
  },
  {
    id: 'soul_cross_chain_lend',
    label: 'Cross-chain lend',
    step: 6,
    description: 'Collatéral chaîne A, borrow chaîne B — bloqué v1 (bridge risk).',
    liaPaper: false,
    liaLiveTarget: false,
    risk: 'blocked',
  },
]

export const SOUL_POLICY = {
  /** Aligné SoulRouter */
  minHfOpen: 2.0,
  maxLeverageLoops: 0,
  minAmountUsd: 5,
  autoSupplyFraction: 0.5,
  defenseBlocksNewRisk: true,
  defaultPaperToken: 'USDC',
  defaultPaperChain: 'ethereum',
  mvxSettlement: true,
} as const

export const SOUL_MAINNET_GATES = [
  { id: 'docs_api', label: 'API / Lens Soul mainnet documentée + stable', done: false },
  { id: 'controller', label: 'Adresses Controller / sToken publiées par chaîne', done: false },
  { id: 'audit', label: 'Audit externe Soul + revue intégration xArtists', done: false },
  { id: 'zk_optional', label: 'soul-zk-verifier MVX (optionnel) codeHash + setVkHash', done: false },
  { id: 'paper_stable', label: 'Paper SoulRouter ≥ 30j sans anomaly log', done: false },
  { id: 'hatom_first', label: 'Hatom live LIA micro-proofs OK (priorité MVX)', done: false },
  { id: 'no_user_funds', label: 'UI user : pas de dépôt jusqu’à flag SOUL_USER_FUNDS=1', done: true },
  { id: 'lia_flag', label: 'SOUL_ENABLED=mainnet + LIA_LIVE_TRADING gates séparés', done: false },
] as const

export const SOUL = {
  appUrl: 'https://app.soul.io' as string | null,
  docsUrl: 'https://docs.soul.io/',
  status: 'pre-mainnet' as const,
  /** Native MultiversX market via Soul — not available today */
  mxNative: false,
  testnets: [
    { id: 11155111, name: 'Ethereum Sepolia' },
    { id: 84532, name: 'Base Sepolia' },
    { id: 421614, name: 'Arbitrum Sepolia' },
  ],
  baseProtocols: ['Aave', 'Compound', 'Venus', 'Morpho'] as const,
  disclaimer:
    'Pre-mainnet / experimental. No user deposits. MultiversX remains xArtists settlement. Third-party risk. Not financial advice.',
  policy: SOUL_POLICY,
  actions: SOUL_ACTIONS,
  mainnetGates: SOUL_MAINNET_GATES,
}
