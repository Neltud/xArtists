import React from 'react'
import './pages.css'

const AgentsPage: React.FC = () => (
  <div className="page">
    <header className="page-head">
      <h1>Agents</h1>
      <p className="muted">LIA (Vellum) · Liia / Lia / Macro (GreenSmoke).</p>
    </header>
    <section className="grid-2">
      <div className="card">
        <h2>LIA</h2>
        <p>Trading autonome mainnet, compound, yield, DAO vote.</p>
        <p className="muted">62 nœuds · OrchestratorRouter · Guards</p>
      </div>
      <div className="card">
        <h2>GreenSmoke</h2>
        <p>Liia / Lia: prévisions · Macro: régime RISK_ON / RISK_OFF</p>
        <p className="muted">Biais only — pas d&apos;exécution directe</p>
      </div>
    </section>
  </div>
)

export default AgentsPage
