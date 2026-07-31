import React from 'react'
import { CONTRACTS, explorerAccount } from '../config/contracts'
import './pages.css'

const DaoPage: React.FC = () => (
  <div className="page">
    <header className="page-head">
      <h1>DAO $TRO</h1>
      <p className="muted">Gouvernance on-chain · quorum 60% · LIA vote HIGHEST_TVL.</p>
    </header>
    <section className="card">
      <h2>TRO Governance</h2>
      <a href={explorerAccount(CONTRACTS.troGovernance)} target="_blank" rel="noreferrer">
        {CONTRACTS.troGovernance}
      </a>
      <ul className="steps mt">
        <li>Durée proposal: 24h</li>
        <li>Votes liquidité TRO/USDC, TRO/WEGLD, TRO/WBTC…</li>
        <li>LIA ne conserve pas le TRO ops — redistribution policy</li>
      </ul>
    </section>
  </div>
)

export default DaoPage
