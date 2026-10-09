/** Prepared MultiversX TX — sign via xPortal (user). */
export type PreparedTx = {
  protocol: 'hatom' | 'ashswap' | 'soul'
  action: string
  receiver: string
  /** EGLD value in atomic units (string) */
  value: string
  /** Data field (hex or ASCII function@args) */
  data: string
  gasLimit: number
  chainId: string
  summary: string
  riskNote?: string
  /** Slippage toléré 0–1 (défaut 0.005 = 0.5%) */
  slippage?: number
  /** Unix seconds — expiration payload DEX */
  deadline?: number
}

export type HealthFactorInput = {
  collateralUsd: number
  borrowUsd: number
  /** optional weighted LTV 0–1 */
  ltv?: number
}

export const HF_MIN_SAFE = 1.4

/** Slippage défaut 0.5% */
export const DEFAULT_SLIPPAGE = 0.005

/** Deadline défaut : maintenant + 20 min */
export const DEFAULT_DEADLINE_SEC = 20 * 60

/** Marge gaz +15% sur estimation de base */
export function withGasMargin(baseGas: number, margin = 0.15): number {
  return Math.ceil(baseGas * (1 + margin))
}

export function defaultDeadline(nowSec = Math.floor(Date.now() / 1000)): number {
  return nowSec + DEFAULT_DEADLINE_SEC
}

export function computeHealthFactor(input: HealthFactorInput): number {
  const { collateralUsd, borrowUsd, ltv = 0.75 } = input
  if (borrowUsd <= 0) return 999
  if (collateralUsd <= 0) return 0
  const adjusted = collateralUsd * Math.min(1, Math.max(0.05, ltv))
  return adjusted / borrowUsd
}

export function hfLabel(hf: number): { label: string; tone: 'safe' | 'warn' | 'crit' | 'na' } {
  if (hf >= 999) return { label: 'N/A — pas de dette', tone: 'na' }
  if (hf >= 2) return { label: `${hf.toFixed(2)} · sûr`, tone: 'safe' }
  if (hf >= HF_MIN_SAFE) return { label: `${hf.toFixed(2)} · attention`, tone: 'warn' }
  return { label: `${hf.toFixed(2)} · critique`, tone: 'crit' }
}
