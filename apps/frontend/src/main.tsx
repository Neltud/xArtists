import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { WalletProvider } from './context/WalletContext'
import { MultiversXProvider } from './context/MultiversXContext'
import { MxDappProvider } from './providers/MxDappProvider'
import { registerSW } from './pwa/registerSW'
import { probeChainTiming } from './config/chainTiming'
import './index.css'

registerSW()
void probeChainTiming()

/**
 * HashRouter — GitHub Pages SPA.
 * MxDappProvider wraps sdk-dapp when available (WC / extension).
 * WalletProvider keeps session + web-wallet redirect address.
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <MxDappProvider>
        <WalletProvider>
          <MultiversXProvider>
            <App />
          </MultiversXProvider>
        </WalletProvider>
      </MxDappProvider>
    </HashRouter>
  </React.StrictMode>,
)
