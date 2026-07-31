import React, { useEffect, useState } from 'react'
import { GUARDS, STRATEGY_BUDGETS, GLOBAL_BUDGET_CAP } from '../config/contracts'
import './pages.css'

type RouterSnap = {
  route?: string
  mode?: string
  summary?: string
  buy_count?: number
  sell_count?: number
  total_budget_pct?: number
  risk_status?: string
}

const TradingPage: React.FC = () => {
  const [router, setRouter] = useState<RouterSnap | null>(null)
  const [guards, setGuards] = useState<{ daily_trades?: number; manual_halt?: boolean } | null>(null)

  useEffect(() => {
    const base = import.meta.env.BASE_URL
    fetch(`${base}data/lia_guards_state.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j && setGuards(j))
      .catch(() => null)
    // Optional last router summary if published by Vellum reporter
    fetch(`${base}data/lia_router_last.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j && setRouter(j))
      .catch(() => null)
  }, [])

  return (
    <div className="page">
      <header className="page-head">
        <h1>Trading LIA · Circuit & Router</h1>
        <p className="muted">
          Signaux multi-cerveaux → OrchestratorRouter → Executor. SL −1% obligatoire, surplus 70/30
          compound/yield.
        </p>
      </header>

      <section className="grid-3">
        <div className="card accent">
          <div className="label">Route Vellum</div>
          <div className="value">{router?.route || '—'}</div>
          <div className="sub">{router?.summary || 'En attente prochain cycle'}</div>
        </div>
        <div className="card">
          <div className="label">Risk / Halt</div>
          <div className="value">
            {guards?.manual_halt ? 'HALT' : router?.risk_status || 'OK'}
          </div>
          <div className="sub">Trades jour: {guards?.daily_trades ?? 0} / 8</div>
        </div>
        <div className="card">
          <div className="label">Budget entry utilisé</div>
          <div className="value">
            {router?.total_budget_pct != null
              ? `${(router.total_budget_pct * 100).toFixed(0)}%`
              : `cap ${(GLOBAL_BUDGET_CAP * 100).toFixed(0)}%`}
          </div>
          <div className="sub">
            buys {router?.buy_count ?? '—'} · sells {router?.sell_count ?? '—'}
          </div>
        </div>
      </section>

      <section className="grid-2 mt">
        <div className="card">
          <h2>Pipeline décision</h2>
          <ol className="steps">
            <li>DataHub / ESDTScanner / GreenSmoke regime</li>
            <li>Brains // TP1 · TP3 · TP5 · LIABrain · Contrarian</li>
            <li>RiskAgent + YieldAgent</li>
            <li>
              <strong>OrchestratorRouter</strong> (fuse_votes · cap 85%)</li>
            <li>Guards preflight G01–G17</li>
            <li>UniversalExecutor (série, nonce)</li>
            <li>Post-verify tx + streak / surplus</li>
          </ol>
        </div>
        <div className="card">
          <h2>Garde-fous (17)</h2>
          <div className="chips">
            {GUARDS.map((g) => (
              <span key={g} className="chip">
                {g}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="card mt">
        <h2>Allocation cible par stratégie</h2>
        <div className="bar-list">
          {STRATEGY_BUDGETS.map((s) => (
            <div key={s.id} className="bar-row">
              <span>{s.id}</span>
              <div className="bar">
                <div
                  className="bar-fill"
                  style={{ width: s.budget }}
                  title={s.budget}
                />
              </div>
              <span className="bar-pct">{s.budget}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default TradingPage
