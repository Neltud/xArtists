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
import './atelier.css'
import './motion-fx.css'

/** Browser polyfill — some MultiversX / WC paths expect Node `process` */
const g = globalThis as typeof globalThis & { process?: { env: Record<string, string> } }
if (typeof g.process === 'undefined') {
  g.process = { env: { NODE_ENV: 'production' } }
} else if (!g.process.env) {
  g.process.env = { NODE_ENV: 'production' }
}

registerSW()
void probeChainTiming()

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
