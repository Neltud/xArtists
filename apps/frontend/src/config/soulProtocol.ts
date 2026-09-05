/**
 * Soul Protocol — préparation intégration LIA ($SO lend / stake).
 * Source publique : @0xSoulProtocol (X) — couche de liquidité / crédit omnichain.
 *
 * Statut produit (2026-09) : Private Mainnet done · Public Mainnet approaching ·
 * Seeds jusqu’au launch · $SO TGE annoncé sans date publique figée.
 *
 * Aucune TX live depuis le front démo. LIA n’alloue $SO qu’après :
 * 1) solde USDC LIA ≥ MIN_USDC_DEPLOY
 * 2) rail MultiversX opérationnel
 * 3) mainnet public Soul + adresses vérifiées
 */

export const SOUL_PROTOCOL = {
  x: 'https://x.com/0xSoulProtocol',
  label: 'Soul Protocol',
  tokenSymbol: 'SO',
  thesis:
    'Couche unifiée omnichain entre money markets (collateral d’une chaîne, liquidité agrégée).',
  tokenomicsPublic: {
    totalSupply: 100_000_000,
    circulatingAtTgePct: 33.3,
    roles: ['governance', 'incentives', 'fee switch', 'booster'],
  },
  liaUseCases: ['lending', 'staking', 'booster'] as const,
  /** Pas d’adresse SC figée tant que mainnet public non figé dans le repo */
  contracts: {
    multiversx: null as string | null,
    solana: null as string | null,
  },
  status: 'prepared' as const,
}

export type SoulAllocationIntent = {
  token: 'SO'
  action: 'lend' | 'stake'
  chainLane: 'soul_omnichain'
  paper: true
  note: string
}

export function draftSoulPaperIntent(action: 'lend' | 'stake'): SoulAllocationIntent {
  return {
    token: 'SO',
    action,
    chainLane: 'soul_omnichain',
    paper: true,
    note: `Intention paper $SO ${action} — en attente mainnet public + Guardian.`,
  }
}
