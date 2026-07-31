import React from 'react'
import {
  NETWORK,
  LIA_WALLET,
  VELLUM_CRON,
  CONTRACTS,
  TOKENS,
  LIA_ACCUMULATE,
  explorerAccount,
} from '../config/contracts'
import './pages.css'

const TechPage: React.FC = () => {
  return (
    <div className="page">
      <header className="page-head">
        <h1>Tech · Vellum · Run checklist</h1>
        <p className="muted">
          Informations indispensables pour le prochain run — architecture, env, nœuds, symbiose.
        </p>
      </header>

      <section className="card">
        <h2>Réseau</h2>
        <dl className="dl">
          <dt>Chain ID</dt>
          <dd>{NETWORK.chainId} ({NETWORK.name})</dd>
          <dt>API</dt>
          <dd>
            <code>{NETWORK.api}</code>
          </dd>
          <dt>Gateway</dt>
          <dd>
            <code>{NETWORK.gateway}</code>
          </dd>
          <dt>Wallet LIA</dt>
          <dd>
            <a href={explorerAccount(LIA_WALLET)} target="_blank" rel="noreferrer">
              {LIA_WALLET}
            </a>
          </dd>
          <dt>Cron Vellum</dt>
          <dd>
            <code>{VELLUM_CRON}</code> (ajustable 30 min)
          </dd>
        </dl>
      </section>

      <section className="card mt">
        <h2>Nœuds critiques (prochain run)</h2>
        <table className="tbl">
          <thead>
            <tr>
              <th>Nœud</th>
              <th>Path</th>
              <th>Rôle</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>OrchestratorRouter</td>
              <td>
                <code>nodes/orchestrator_router.py</code>
              </td>
              <td>TRADE / STRONG_BUY / YIELD_ONLY / BLOCKED</td>
            </tr>
            <tr>
              <td>UniversalBrain</td>
              <td>
                <code>nodes/universal_brain_unified.py</code>
              </td>
              <td>Base TP1/TP3/TP5</td>
            </tr>
            <tr>
              <td>UniversalExecutor</td>
              <td>
                <code>nodes/universal_executor.py</code>
              </td>
              <td>Swap / stake + circuit breaker</td>
            </tr>
            <tr>
              <td>Symbiosis</td>
              <td>
                <code>lia/orchestration/symbiosis.py</code>
              </td>
              <td>fuse_votes · cap 85%</td>
            </tr>
            <tr>
              <td>Guards</td>
              <td>
                <code>lia/circuit/guards.py</code>
              </td>
              <td>G01–G17 preflight</td>
            </tr>
            <tr>
              <td>Compound</td>
              <td>
                <code>lia/circuit/compound_engine.py</code>
              </td>
              <td>+1% net · streak</td>
            </tr>
            <tr>
              <td>Risk / Yield</td>
              <td>
                <code>nodes/swarm_risk.py</code> / <code>swarm_yield.py</code>
              </td>
              <td>Veto HF · Hatom supply</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="grid-2 mt">
        <div className="card">
          <h2>Variables d&apos;environnement</h2>
          <ul className="list mono">
            <li>MVX_PRIVATE_KEY (PEM — hors git)</li>
            <li>LIA_LIVE_TRADING=1</li>
            <li>TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID</li>
            <li>AVG_ENTRY_EGLD / WBTC / WTAO</li>
            <li>VITE_WALLETCONNECT_PROJECT_ID (dApp)</li>
          </ul>
        </div>
        <div className="card">
          <h2>Tokens & policy</h2>
          <p>Accumulate: {LIA_ACCUMULATE.join(', ')}</p>
          <p>Never hold ops: TRO → redistribute</p>
          <ul className="list mono">
            <li>WEGLD {TOKENS.WEGLD}</li>
            <li>USDC {TOKENS.USDC}</li>
            <li>TRO {TOKENS.TRO}</li>
            <li>HWBTC {TOKENS.HWBTC}</li>
          </ul>
        </div>
      </section>

      <section className="card mt">
        <h2>Checklist run</h2>
        <ol className="steps">
          <li>PEM + LIA_LIVE_TRADING uniquement si micro-tx validée</li>
          <li>Brains // → OrchestratorRouter → executor_actions</li>
          <li>Guards preflight ok avant tout BUY</li>
          <li>Publier streak / router JSON vers <code>public/data/</code> pour le dApp</li>
          <li>Agents Marketplace SC deploy → maj adresse UI</li>
          <li>Telegram alerte sur HALT / BLOCKED</li>
        </ol>
      </section>

      <section className="card mt">
        <h2>Contrats (adresses)</h2>
        <pre className="pre">{JSON.stringify(CONTRACTS, null, 2)}</pre>
      </section>
    </div>
  )
}

export default TechPage
