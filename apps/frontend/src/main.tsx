import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { WalletProvider } from './context/WalletContext'
import { MultiversXProvider } from './context/MultiversXContext'
import { registerSW } from './pwa/registerSW'
import { probeChainTiming } from './config/chainTiming'
import './index.css'

registerSW()
void probeChainTiming()

/**
 * HashRouter — GitHub Pages serves HTTP 404 for /xArtists/entity etc.
 * Hash routes always load index.html (200) so lazy pages never fail on refresh.
 * URLs: https://neltud.github.io/xArtists/#/entity
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <WalletProvider>
        <MultiversXProvider>
          <App />
        </MultiversXProvider>
      </WalletProvider>
    </HashRouter>
  </React.StrictMode>,
)
