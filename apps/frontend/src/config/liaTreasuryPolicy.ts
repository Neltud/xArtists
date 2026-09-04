/**
 * Politique trésorerie LIA (Vellum) — publique, exécution gardée.
 *
 * Règle produit : le solde USDC (ou équivalent stable) du wallet LIA doit
 * dépasser MIN_USDC_DEPLOY avant toute intention de placement on-chain.
 * Chaîne 1 = MultiversX · puis Solana · Soul ($SO lend/stake) quand mainnet public.
 *
 * LIVE_TRADING / signatures restent hors front GitHub Pages (Vellum + Guardian).
 */

import { LIA_WALLET } from './links'

/** Seuil en USDC (unités token, 6 décimales côté MX) */
export const MIN_USDC_DEPLOY = 10

export const LIA_STABLE_TOKENS_MX = {
  USDC: 'USDC-c76f1f',
  USDT: 'USDT-f8c08c',
} as const

export type LiaChainLane = 'multiversx' | 'solana' | 'soul_omnichain'

/** Ordre de déploiement capital LIA */
export const LIA_CHAIN_PRIORITY: {
  id: LiaChainLane
  label: string
  status: 'active_policy' | 'next' | 'prepared'
  notes: string
}[] = [
  {
    id: 'multiversx',
    label: 'MultiversX',
    status: 'active_policy',
    notes: 'Premier rail : xExchange / Hatom / pools TRO-USDC — paper ou live selon Guardian.',
  },
  {
    id: 'solana',
    label: 'Solana',
    status: 'next',
    notes: 'Second rail après MX stable + runbook Solana validé.',
  },
  {
    id: 'soul_omnichain',
    label: 'Soul Protocol ($SO)',
    status: 'prepared',
    notes:
      'Omnichain liquidity / lending (@0xSoulProtocol). $SO lend + stake dès mainnet public + TGE clarifié.',
  },
]

export function canLiaDeployCapital(usdcBalance: number): boolean {
  return usdcBalance >= MIN_USDC_DEPLOY
}

export function liaDeployStatus(usdcBalance: number): {
  armed: boolean
  balance: number
  threshold: number
  deficit: number
  wallet: string
  message: string
} {
  const armed = canLiaDeployCapital(usdcBalance)
  const deficit = Math.max(0, MIN_USDC_DEPLOY - usdcBalance)
  return {
    armed,
    balance: usdcBalance,
    threshold: MIN_USDC_DEPLOY,
    deficit,
    wallet: LIA_WALLET,
    message: armed
      ? `Solde ≥ ${MIN_USDC_DEPLOY} USDC — politique placement armée (exécution Vellum/Guardian).`
      : `En attente : ${deficit.toFixed(2)} USDC manquants avant placement (seuil ${MIN_USDC_DEPLOY}).`,
  }
}
