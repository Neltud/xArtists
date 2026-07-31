import React from 'react'
import { CONTRACTS, shortAddr, explorerAccount } from '../config/contracts'
import './pages.css'

const MarketplacePage: React.FC = () => (
  <div className="page">
    <header className="page-head">
      <h1>Marketplace</h1>
      <p className="muted">NFT / phygital · List & Buy via sdk-dapp sendTransactions (P0).</p>
    </header>
    <section className="card">
      <h2>Contrat marketplace</h2>
      <a href={explorerAccount(CONTRACTS.marketplace)} target="_blank" rel="noreferrer">
        {CONTRACTS.marketplace}
      </a>
      <p className="muted mt">Agents Marketplace SC: {CONTRACTS.agentsMarketplace || 'adresse TBD après deploy'}</p>
      <p className="muted">UI List/Buy branchée sur useSendTransaction — valider après adresse réelle.</p>
    </section>
  </div>
)

export default MarketplacePage
