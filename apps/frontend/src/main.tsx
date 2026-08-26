import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { WalletProvider } from './context/WalletContext'
import { MultiversXProvider } from './context/MultiversXContext'
import { registerSW } from './pwa/registerSW'
import { probeChainTiming } from './config/chainTiming'
import './index.css'

registerSW()
void probeChainTiming()

/**
 * MxDapp / sdk-dapp is NOT mounted globally — only on TX routes via TxShell (lazy).
 * This cuts initial JS for Home / Gallery / Board visitors.
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename="/xArtists">
      <WalletProvider>
        <MultiversXProvider>
          <App />
        </MultiversXProvider>
      </WalletProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
