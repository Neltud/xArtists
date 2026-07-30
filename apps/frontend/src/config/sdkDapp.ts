/**
 * WalletConnect + xPortal deep link config
 * Project ID: e07ac8e2a212711609b21dade4c9e37f
 * Domain: neltud.github.io (WalletConnect Cloud allowlist)
 */

export type MxEnvironment = 'mainnet' | 'devnet' | 'testnet'

const projectId =
  (typeof import.meta !== 'undefined' &&
    (import.meta as any).env?.VITE_WALLETCONNECT_PROJECT_ID) ||
  'e07ac8e2a212711609b21dade4c9e37f'

export const WALLET_CONNECT_V2_RELAY_URL = 'wss://relay.walletconnect.com'

/** Public Pages origin for WC callback / deep link return */
export const DAPP_CALLBACK_BASE =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_DAPP_URL) ||
  'https://neltud.github.io/xArtists'

/**
 * xPortal deep links:
 * - Firebase dynamic link (legacy Maiar / store)
 * - Native scheme when app installed
 * Full QR pairing still needs WalletConnectLoginButton from sdk-dapp
 */
export const XPORTAL_DEEP_LINKS = {
  storeAndOpen:
    'https://maiar.page.link/?apn=com.elrond.maiar.wallet&isi=1519405832&ibi=com.elrond.maiar.wallet&link=https://xportal.com/',
  nativeScheme: 'xportal://',
  web: 'https://xportal.com/',
  /** Open xPortal with WC topic when available: xportal://wc?uri= */
  walletConnectUri: (wcUri: string) =>
    `https://maiar.page.link/?apn=com.elrond.maiar.wallet&isi=1519405832&ibi=com.elrond.maiar.wallet&link=https://xportal.com/?wallet-connect=${encodeURIComponent(wcUri)}`,
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
    walletConnectDeepLink: XPORTAL_DEEP_LINKS.storeAndOpen,
    walletConnectV2RelayAddresses: [WALLET_CONNECT_V2_RELAY_URL],
    walletConnectV2ProjectId: projectId,
  },
  dappConfig: {
    name: 'xArtists',
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
