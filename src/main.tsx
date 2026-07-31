import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

import { DappProvider } from '@multiversx/sdk-dapp/wrappers/DappProvider'
import { EnvironmentsEnum } from '@multiversx/sdk-dapp/types'
import { WalletConnectV2Provider } from '@multiversx/sdk-dapp/providers/walletConnectV2Provider'
import { ExtensionProvider } from '@multiversx/sdk-dapp/providers/extensionProvider'
import { WebWalletProvider } from '@multiversx/sdk-dapp/providers/webWalletProvider'

const WC_PROJECT_ID =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || ''

if (!WC_PROJECT_ID) {
  console.warn(
    '[xArtists] VITE_WALLETCONNECT_PROJECT_ID manquant — xPortal (WC v2) limité'
  )
}

const MVX_CONFIG = {
  environment: EnvironmentsEnum.mainnet,
  walletConnectV2ProjectId: WC_PROJECT_ID || '00000000000000000000000000000000',
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DappProvider
      environment={MVX_CONFIG.environment}
      walletConnectV2ProjectId={MVX_CONFIG.walletConnectV2ProjectId}
      providers={[WalletConnectV2Provider, ExtensionProvider, WebWalletProvider]}
    >
      <App />
    </DappProvider>
  </React.StrictMode>
)
