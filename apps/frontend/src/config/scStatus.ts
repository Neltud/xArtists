/** On-chain SC readiness — driven by build-time VITE_* after verify_marketplace_codehash */

const truthy = (v: string | undefined) =>
  v === '1' || v === 'true' || v === 'TRUE' || v === 'yes'

export const LIA_PROTOCOL_WALLET = (
  import.meta.env.VITE_LIA_PROTOCOL_WALLET ||
  'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6'
).toLowerCase()

export const MARKETPLACE_ADDRESS =
  (import.meta.env.VITE_MARKETPLACE_ADDRESS as string | undefined) || ''

export const AGENTS_MARKETPLACE_ADDRESS =
  (import.meta.env.VITE_AGENTS_MARKETPLACE_ADDRESS as string | undefined) || ''

export const MARKETPLACE_LIVE = truthy(import.meta.env.VITE_MARKETPLACE_CODEHASH_OK)
export const AGENTS_LIVE = truthy(import.meta.env.VITE_AGENTS_CODEHASH_OK)

export const AGENTS_FEE_BPS = Number(import.meta.env.VITE_AGENTS_FEE_BPS || 300)

export function isLiaOpsWallet(addr?: string | null): boolean {
  if (!addr) return false
  return addr.trim().toLowerCase() === LIA_PROTOCOL_WALLET
}

export function canListBuyNft(): boolean {
  return MARKETPLACE_LIVE && Boolean(MARKETPLACE_ADDRESS.startsWith('erd1'))
}

export function canBuyAgent(): boolean {
  return AGENTS_LIVE && Boolean(AGENTS_MARKETPLACE_ADDRESS.startsWith('erd1'))
}
