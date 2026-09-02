/**
 * Agent marketplace fee split (mirrors SC buyAgentAction).
 * fee stays on contract; seller receives price - fee.
 * @see docs/TREASURY_FLOWS.md
 */

const DEFAULT_FEE_BPS = 300

export function getAgentsFeeBps(): number {
  const raw = import.meta.env.VITE_AGENTS_FEE_BPS
  if (raw === undefined || raw === '') return DEFAULT_FEE_BPS
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 0 || n > 1000) return DEFAULT_FEE_BPS
  return Math.floor(n)
}

export type AgentFeeSplit = {
  priceEgld: number
  feeBps: number
  feeEgld: number
  sellerEgld: number
  feePercentLabel: string
}

/** priceEgld as human EGLD (e.g. 0.5), not atomic */
export function splitAgentSale(priceEgld: number, feeBps = getAgentsFeeBps()): AgentFeeSplit {
  const price = Math.max(0, priceEgld)
  const bps = Math.min(1000, Math.max(0, feeBps))
  const feeEgld = (price * bps) / 10_000
  const sellerEgld = price - feeEgld
  return {
    priceEgld: price,
    feeBps: bps,
    feeEgld,
    sellerEgld,
    feePercentLabel: `${(bps / 100).toFixed(bps % 100 === 0 ? 0 : 1)}%`,
  }
}

export function formatAgentCheckoutLine(priceEgld: number, feeBps?: number): string {
  const s = splitAgentSale(priceEgld, feeBps ?? getAgentsFeeBps())
  return `Vous payez ${s.priceEgld} EGLD · Frais protocol ${s.feePercentLabel} (${s.feeEgld.toFixed(4)}) · Créateur reçoit ${s.sellerEgld.toFixed(4)} EGLD`
}
