import React from 'react'
import { LIA_ACCUMULATE, LIA_NEVER_HOLD } from '../config/contracts'
import './pages.css'

const PortfolioPage: React.FC = () => (
  <div className="page">
    <header className="page-head">
      <h1>Portfolio</h1>
      <p className="muted">Allocation cible LT · sleeves compound / yield · policy tokens.</p>
    </header>
    <section className="grid-3">
      <div className="card">
        <div className="label">USDC cible</div>
        <div className="value">45%</div>
        <div className="sub">Stable core + Hatom</div>
      </div>
      <div className="card">
        <div className="label">EGLD / WEGLD</div>
        <div className="value">30%</div>
        <div className="sub">Beta réseau</div>
      </div>
      <div className="card">
        <div className="label">WBTC</div>
        <div className="value">20%</div>
        <div className="sub">Hedge macro · buffer 5%</div>
      </div>
    </section>
    <section className="card mt">
      <h2>Règles</h2>
      <p>
        Hold autorisé: <strong>{LIA_ACCUMULATE.join(', ')}</strong>
      </p>
      <p>
        Interdit en ops: <strong>{LIA_NEVER_HOLD.join(', ')}</strong> → pool/stake/rewards/burn
      </p>
      <p className="muted">Surplus trade: 70% compound · 30% yield sleeve</p>
    </section>
  </div>
)

export default PortfolioPage
