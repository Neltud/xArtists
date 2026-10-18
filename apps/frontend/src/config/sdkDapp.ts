/**
 * WalletConnect + xPortal deep link config
 * Project ID: e07ac8e2a212711609b21dade4c9e37f
 * No Firebase / maiar.page.link — native scheme + https://xportal.com
 */

export type MxEnvironment = 'mainnet' | 'devnet' | 'testnet'

const projectId =
  (typeof import.meta !== 'undefined' &&
    (import.meta as { env?: { VITE_WALLETCONNECT_PROJECT_ID?: string } }).env
      ?.VITE_WALLETCONNECT_PROJECT_ID) ||
  'e07ac8e2a212711609b21dade4c9e37f'

export const WALLET_CONNECT_V2_RELAY_URL = 'wss://relay.walletconnect.com'

/** Real site origin for WC metadata (prefer runtime origin) */
export function dappOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  return (
    (typeof import.meta !== 'undefined' &&
      (import.meta as { env?: { VITE_DAPP_URL?: string } }).env?.VITE_DAPP_URL) ||
    'https://neltud.github.io'
  )
}

export const DAPP_CALLBACK_BASE =
  (typeof import.meta !== 'undefined' &&
    (import.meta as { env?: { VITE_DAPP_URL?: string } }).env?.VITE_DAPP_URL) ||
  'https://neltud.github.io/xArtists'

/**
 * xPortal deep links — no Firebase.
 * Open only from an explicit user gesture (button).
 */
export const XPORTAL_DEEP_LINKS = {
  web: 'https://xportal.com/',
  nativeScheme: 'xportal://',
  /** Native WC handoff */
  walletConnectNative: (wcUri: string) => `xportal://wc?uri=${encodeURIComponent(wcUri)}`,
  /** Universal / Android fallback (no Firebase) */
  walletConnectHttps: (wcUri: string) =>
    `https://xportal.com/?wallet-connect=${encodeURIComponent(wcUri)}`,
  /** Platform-aware open URL */
  walletConnectUri: (wcUri: string) => {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : ''
    if (/iPhone|iPad|iPod/i.test(ua)) {
      return `xportal://wc?uri=${encodeURIComponent(wcUri)}`
    }
    if (/Android/i.test(ua)) {
      return `https://xportal.com/?wallet-connect=${encodeURIComponent(wcUri)}`
    }
    return `https://xportal.com/?wallet-connect=${encodeURIComponent(wcUri)}`
  },
}

export const sdkDappConfig = {
  environment: 'mainnet' as MxEnvironment,
  walletConnectV2ProjectId: projectId,
  customNetworkConfig: {
    name: 'xArtists-mainnet',
    apiAddress: 'https://api.multiversx.com',
    gatewayAddress: 'https://gateway.multiversx.com',
    explorerAddress: 'https://explorer.multiversx.com',
    walletAddress: 'https://wallet.multiversx.com',
    walletConnectDeepLink: XPORTAL_DEEP_LINKS.web,
    walletConnectV2RelayAddresses: [WALLET_CONNECT_V2_RELAY_URL],
    walletConnectV2ProjectId: projectId,
  },
  dappConfig: {
    name: 'xArtists',
    url: typeof window !== 'undefined' ? window.location.origin : DAPP_CALLBACK_BASE,
  },
  providers: {
    xportal: true,
    extension: true,
    webwallet: true,
    ledger: true,
    pem: false,
  },
}

export const isWalletConnectConfigured = () =>
  Boolean(projectId) && projectId.length >= 32
