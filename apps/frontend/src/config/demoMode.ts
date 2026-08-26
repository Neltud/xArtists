/**
 * DEMO MODE — product posture for public / investor demos.
 *
 * ON (always for this release):
 * - Paper LIA board, compounding, brain, fusion, ticker
 * - Live READ-ONLY MultiversX API (balances, prices, network)
 * - Wallet connect for tips / explore (user signs their own TX only)
 *
 * OFF until codeHash + ops:
 * - Marketplace List/Buy, agents mint buy on-chain
 * - LIA_LIVE_TRADING automatic execution
 */

/** Build-time: VITE_DEMO_MODE=0 to hide strip (not recommended pre-mainnet) */
const envOff =
  typeof import.meta !== 'undefined' &&
  (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_DEMO_MODE === '0'

export const DEMO_MODE = !envOff

export const DEMO_LABEL = 'DEMO · PAPER LIA · LIVE DATA READS'

export const DEMO_SUMMARY = {
  trading: 'paper' as const,
  liaLiveTrading: false,
  marketplaceOnChain: false,
  agentsOnChain: false,
  liveReads: true,
  userWalletOptional: true,
}

export const DEMO_BULLETS = [
  'Board LIA, compounding 10 colonnes, brain EV, fusion signaux = paper (JSON Vellum)',
  'Prix / soldes / réseau = lectures live API MultiversX (pas de faux chiffres SC)',
  'Marketplace & agents SC = non déployés (codeHash null) — pas de List/Buy simulé',
  'Wallet Connect = optionnel (tips, exploration) — LIA n’utilise jamais ta session',
  'Aucun ordre live LIA tant que LIA_LIVE_TRADING=0 + micro-preuves',
] as const
