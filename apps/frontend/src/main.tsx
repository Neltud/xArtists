import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { WalletProvider } from './context/WalletContext'
import { MultiversXProvider } from './context/MultiversXContext'
import { MxDappProvider } from './providers/MxDappProvider'
import TxShell from './providers/TxShell'
import EmpireBalanceSync from './components/EmpireBalanceSync'
import AgentAccessSync from './components/AgentAccessSync'
import PulseBoot from './components/PulseBoot'
import { ToastProvider } from './components/ui/Toast'
import NetworkToastBridge from './components/NetworkToastBridge'
import { I18nProvider } from './i18n/I18nContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <I18nProvider>
        <MxDappProvider>
          <WalletProvider>
            <MultiversXProvider>
              <ToastProvider>
                <NetworkToastBridge />
                <TxShell>
                  <EmpireBalanceSync />
                  <AgentAccessSync />
                  <PulseBoot />
                  <App />
                </TxShell>
              </ToastProvider>
            </MultiversXProvider>
          </WalletProvider>
        </MxDappProvider>
      </I18nProvider>
    </HashRouter>
  </React.StrictMode>,
)
