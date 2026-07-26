import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { WalletProvider } from './context/WalletContext'
import { MultiversXProvider } from './context/MultiversXContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename="/xArtists">
      <WalletProvider>
        <MultiversXProvider>
          <App />
        </MultiversXProvider>
      </WalletProvider>
    </BrowserRouter>
  </React.StrictMode>
)
