/**
 * Honest signing capability — paste-only sessions cannot List/Buy/Bid.
 */

export type WalletMethod =
  | 'xportal'
  | 'defi_wallet'
  | 'web_wallet'
  | 'wallet_connect'
  | 'paste_readonly'
  | 'pem'
  | null

/** Methods that can produce a user signature on mainnet. */
const SIGNING_METHODS: ReadonlySet<string> = new Set([
  'xportal',
  'defi_wallet',
  'web_wallet',
  'wallet_connect',
])

export function hasSendTxInjected(): boolean {
  if (typeof window === 'undefined') return false
  return typeof (window as unknown as { __xartistsSendTx?: unknown }).__xartistsSendTx === 'function'
}

/**
 * True if method can sign (xPortal / web wallet / WC).
 * Bridge is injected on demand by bootstrapSendTx / useSendTransaction.
 */
export function canSignOnChain(method: WalletMethod | string | null | undefined): boolean {
  if (!method || method === 'paste_readonly' || method === 'pem') return false
  return SIGNING_METHODS.has(method)
}

export function signBlockReason(method: WalletMethod | string | null | undefined): string | null {
  if (!method) return 'Connecte xPortal, DeFi Wallet ou Web Wallet (pas coller erd1).'
  if (method === 'paste_readonly') {
    return 'Session lecture seule (adresse collée) — impossible de signer. Reconnecte via xPortal / Web Wallet.'
  }
  if (method === 'pem') {
    return 'PEM interdit côté dApp user — réservé ops LIA / Vellum.'
  }
  if (!SIGNING_METHODS.has(method)) {
    return 'Méthode de connexion non signante.'
  }
  return null
}
