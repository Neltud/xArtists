/**
 * Soul Protocol — couche liquidité cross-chain (intégration MultiversX en cours).
 * Pas d’adresse SC MVX publique stable → deep-link + placeholder builders.
 */
import type { PreparedTx } from './types'

export const SOUL = {
  docs: 'https://docs.soul.io',
  site: 'https://soul.io',
  status: 'multiversx_integration_pending' as const,
}

export function buildSoulPlaceholder(
  action: 'supply' | 'borrow' | 'repay',
  note?: string,
): PreparedTx {
  return {
    protocol: 'soul',
    action: `soul_${action}`,
    receiver: '',
    value: '0',
    data: '',
    gasLimit: 0,
    chainId: '1',
    summary: `Soul ${action} — ouvrir soul.io (MVX SC non publié ici)`,
    riskNote:
      note ||
      'Soul unifie lending multi-chaîne (Aave, Morpho, Hatom…). Signer uniquement via l’UI officielle tant que le router MVX n’est pas branché dans xArtists.',
  }
}

export function isSoulReady(): boolean {
  return false
}
