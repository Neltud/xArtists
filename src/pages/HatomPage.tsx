import React from 'react'
import './pages.css'

const HatomPage: React.FC = () => (
  <div className="page">
    <header className="page-head">
      <h1>Yield · Hatom</h1>
      <p className="muted">YieldAgent: idle USDC → supply si HF &gt; 1.8 · RISK_OFF priorise yield.</p>
    </header>
    <section className="card">
      <ul className="steps">
        <li>HF &lt; 1.5 → BLOCK (RiskAgent)</li>
        <li>HF &lt; 1.8 → pas de nouveau supply agressif</li>
        <li>Min supply ~$5 USDC · 50% idle par défaut</li>
        <li>Sleeve yield = 30% des profits circuit</li>
      </ul>
    </section>
  </div>
)

export default HatomPage
