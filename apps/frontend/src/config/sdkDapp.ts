/**
 * WalletConnect + xPortal deep link config
 * Project ID: e07ac8e2a212711609b21dade4c9e37f
 * Wallet metadata uses the current Site origin. The project may be overridden at build time.
 */

export type MxEnvironment = 'mainnet' | 'devnet' | 'testnet'

const projectId =
  (typeof import.meta !== 'undefined' &&
    (import.meta as any).env?.VITE_WALLETCONNECT_PROJECT_ID) ||
  'e07ac8e2a212711609b21dade4c9e37f'

export const WALLET_CONNECT_V2_RELAY_URL = 'wss://relay.walletconnect.com'

/** Site origin for WC callback / deep link return */
export const DAPP_CALLBACK_BASE =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_DAPP_URL) ||
  new URL(import.meta.env.BASE_URL, typeof window !== 'undefined' ? window.location.origin : 'https://neltud.github.io').href

/** Verified native WalletConnect schemes. App switching is initiated by a user tap. */
export const XPORTAL_DEEP_LINKS={
 storeAndOpen:'https://xportal.app.link/website',
 nativeScheme:'xportal://',
 web:'https://xportal.com/',
 walletConnectUri:(uri:string)=>`xportal://wc?uri=${encodeURIComponent(uri)}`,
}
export function xPortalPairingHref(uri:string,userAgent=typeof navigator!=='undefined'?navigator.userAgent:''){
 return /Android/i.test(userAgent)?uri:XPORTAL_DEEP_LINKS.walletConnectUri(uri)
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
    // Pairing is handled explicitly by WalletPairing; the legacy SDK link builder is not used.
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
