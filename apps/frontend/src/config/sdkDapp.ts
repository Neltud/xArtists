/**
 * WalletConnect + xPortal + DeFi Wallet config
 * Project ID: e07ac8e2a212711609b21dade4c9e37f
 * Domain neltud.github.io must be allowed in WalletConnect Cloud
 */

export type MxEnvironment = "mainnet" | "devnet" | "testnet";

const projectId =
  (typeof import.meta !== "undefined" &&
    (import.meta as any).env?.VITE_WALLETCONNECT_PROJECT_ID) ||
  "e07ac8e2a212711609b21dade4c9e37f";

export const WALLET_CONNECT_V2_RELAY_URL = "wss://relay.walletconnect.com";

export const sdkDappConfig = {
  environment: "mainnet" as MxEnvironment,
  walletConnectV2ProjectId: projectId,
  customNetworkConfig: {
    name: "xArtists-mainnet",
    apiAddress: "https://api.multiversx.com",
    gatewayAddress: "https://gateway.multiversx.com",
    explorerAddress: "https://explorer.multiversx.com",
    walletAddress: "https://wallet.multiversx.com",
    walletConnectDeepLink:
      "https://maiar.page.link/?apn=com.elrond.maiar.wallet&isi=1519405832&ibi=com.elrond.maiar.wallet&link=https://xportal.com/",
    walletConnectV2RelayAddresses: [WALLET_CONNECT_V2_RELAY_URL],
    walletConnectV2ProjectId: projectId,
  },
  providers: {
    xportal: true,
    extension: true,
    webwallet: true,
    ledger: true,
    pem: false,
  },
};

export const isWalletConnectConfigured = () =>
  Boolean(projectId) && projectId.length >= 32;
