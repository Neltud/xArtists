import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { WalletProvider } from './context/WalletContext'
import { MultiversXProvider } from './context/MultiversXContext'
import { MxDappProvider } from './providers/MxDappProvider'
import { registerSW } from './pwa/registerSW'
import './index.css'

registerSW()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MxDappProvider>
      <BrowserRouter basename="/xArtists">
        <WalletProvider>
          <MultiversXProvider>
            <App />
          </MultiversXProvider>
        </WalletProvider>
      </BrowserRouter>
    </MxDappProvider>
  </React.StrictMode>,
)
