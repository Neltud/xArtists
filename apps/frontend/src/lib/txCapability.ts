/**
 * Honest signing capability — paste-only sessions cannot List/Buy/Bid.
 */

export type WalletMethod =
  | 'xportal'
  | 'defi_wallet'
  | 'web_wallet'
  | 'paste_readonly'
  | 'pem'
  | null

/** Methods that can produce a user signature on mainnet (when sdk-dapp is wired). */
const SIGNING_METHODS: ReadonlySet<string> = new Set([
  'xportal',
  'defi_wallet',
  'web_wallet', // only after real WC / web-wallet login hook, not paste
])

export function hasSendTxInjected(): boolean {
  if (typeof window === 'undefined') return false
  return typeof (window as unknown as { __xartistsSendTx?: unknown }).__xartistsSendTx === 'function'
}

/**
 * True only if session is not paste-readonly and bootstrap injected send.
 * Web-wallet callback from MultiversX still needs __xartistsSendTx for reliable sign.
 */
export function canSignOnChain(method: WalletMethod | string | null | undefined): boolean {
  if (!method || method === 'paste_readonly' || method === 'pem') return false
  if (!SIGNING_METHODS.has(method)) return false
  return hasSendTxInjected()
}

export function signBlockReason(method: WalletMethod | string | null | undefined): string | null {
  if (!method) return 'Connecte xPortal, DeFi Wallet ou Web Wallet (pas coller erd1).'
  if (method === 'paste_readonly') {
    return 'Session lecture seule (adresse collée) — impossible de signer List/Buy/Bid. Reconnecte via xPortal / extension / Web Wallet.'
  }
  if (method === 'pem') {
    return 'PEM interdit côté dApp user — réservé ops LIA / Vellum.'
  }
  if (!hasSendTxInjected()) {
    return 'sdk-dapp non branché (__xartistsSendTx manquant). Ouvre une page TX (Market) pour charger TxShell, ou configure WalletConnect.'
  }
  return null
}
