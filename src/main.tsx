import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// MultiversX SDK Integration (v3+)
import { DappProvider } from "@multiversx/sdk-dapp/wrappers/DappProvider";
import { EnvironmentsEnum } from "@multiversx/sdk-dapp/types";

// Wallet providers
import { WalletConnectV2Provider } from "@multiversx/sdk-dapp/providers/walletConnectV2Provider";
import { ExtensionProvider } from "@multiversx/sdk-dapp/providers/extensionProvider";
import { WebWalletProvider } from "@multiversx/sdk-dapp/providers/webWalletProvider";

// Basic config - update chainId / api for mainnet or testnet
const MVX_CONFIG = {
  environment: EnvironmentsEnum.mainnet, // or testnet
  walletConnectV2ProjectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "your-project-id-here",
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <DappProvider
      environment={MVX_CONFIG.environment}
      walletConnectV2ProjectId={MVX_CONFIG.walletConnectV2ProjectId}
      providers={[WalletConnectV2Provider, ExtensionProvider, WebWalletProvider]}
    >
      <App />
    </DappProvider>
  </React.StrictMode>
);
