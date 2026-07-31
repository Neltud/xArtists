import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMvxAccount } from '../services/mvx'
import {
  LIA_WALLET,
  CONTRACTS,
  STRATEGY_BUDGETS,
  GLOBAL_BUDGET_CAP,
  shortAddr,
  explorerAccount,
  NETWORK,
} from '../config/contracts'
import '../pages/pages.css'

type StreakSnap = {
  phase?: string
  streak?: {
    wins?: number
    losses?: number
    consecutive_losses?: number
    compound_equity_usd?: number
    yield_sleeve_usd?: number
    halted?: boolean
    total_trades?: number
  }
}

const DashboardPage: React.FC = () => {
  const { address, isLoggedIn, account } = useMvxAccount()
  const [streak, setStreak] = useState<StreakSnap | null>(null)

  useEffect(() => {
    // Best-effort load of published JSON (GitHub pages / local public)
    fetch(`${import.meta.env.BASE_URL}data/lia_compound_streak.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j && setStreak(j))
      .catch(() => null)
  }, [])

  const egld = account?.balance ? parseFloat(account.balance) / 1e18 : 0
  const s = streak?.streak

  return (
    <div className="page">
      <header className="page-head">
        <h1>Dashboard opérationnel</h1>
        <p className="muted">
          Vue temps réel pour le prochain run Vellum — portfolio, circuit, routeur, contrats mainnet.
        </p>
      </header>

      <section className="grid-4">
        <div className="card">
          <div className="label">Wallet connecté</div>
          <div className="value sm">{isLoggedIn ? shortAddr(address || '') : 'Non connecté'}</div>
          <div className="sub">{egld.toFixed(4)} EGLD</div>
        </div>
        <div className="card">
          <div className="label">Wallet LIA (ops)</div>
          <a className="value sm link" href={explorerAccount(LIA_WALLET)} target="_blank" rel="noreferrer">
            {shortAddr(LIA_WALLET)}
          </a>
          <div className="sub">mainnet · chain {NETWORK.chainId}</div>
        </div>
        <div className="card">
          <div className="label">Circuit phase</div>
          <div className="value">{streak?.phase || '—'}</div>
          <div className="sub">
            {s?.halted ? 'HALTED' : `W${s?.wins ?? 0} / L${s?.losses ?? 0}`}
          </div>
        </div>
        <div className="card">
          <div className="label">Equity compound + yield</div>
          <div className="value">
            ${((s?.compound_equity_usd || 0) + (s?.yield_sleeve_usd || 0)).toFixed(2)}
          </div>
          <div className="sub">
            compound ${(s?.compound_equity_usd || 0).toFixed(2)} · yield $
            {(s?.yield_sleeve_usd || 0).toFixed(2)}
          </div>
        </div>
      </section>

      <section className="grid-2 mt">
        <div className="card">
          <h2>Stratégies parallèles (budgets plafonnés)</h2>
          <p className="muted">Cap global entry {(GLOBAL_BUDGET_CAP * 100).toFixed(0)}% — OrchestratorRouter</p>
          <table className="tbl">
            <thead>
              <tr>
                <th>ID</th>
                <th>Rôle</th>
                <th>Budget</th>
                <th>TP / SL</th>
              </tr>
            </thead>
            <tbody>
              {STRATEGY_BUDGETS.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.label}</td>
                  <td>{r.budget}</td>
                  <td>
                    {r.tp} / {r.sl}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2>Contrats mainnet</h2>
          <ul className="list">
            <li>
              <span>NFT Staking</span>
              <a href={explorerAccount(CONTRACTS.nftStaking)} target="_blank" rel="noreferrer">
                {shortAddr(CONTRACTS.nftStaking)}
              </a>
            </li>
            <li>
              <span>TRO Governance</span>
              <a href={explorerAccount(CONTRACTS.troGovernance)} target="_blank" rel="noreferrer">
                {shortAddr(CONTRACTS.troGovernance)}
              </a>
            </li>
            <li>
              <span>Marketplace</span>
              <a href={explorerAccount(CONTRACTS.marketplace)} target="_blank" rel="noreferrer">
                {shortAddr(CONTRACTS.marketplace)}
              </a>
            </li>
            <li>
              <span>NFT Minter</span>
              <a href={explorerAccount(CONTRACTS.nftMinter)} target="_blank" rel="noreferrer">
                {shortAddr(CONTRACTS.nftMinter)}
              </a>
            </li>
            <li>
              <span>Agents Marketplace</span>
              <span className="badge warn">{CONTRACTS.agentsMarketplace || 'TBD deploy'}</span>
            </li>
          </ul>
          <div className="row-actions">
            <Link className="btn" to="/trading">
              Trading LIA
            </Link>
            <Link className="btn ghost" to="/tech">
              Spec Vellum
            </Link>
          </div>
        </div>
      </section>

      <section className="card mt">
        <h2>Policy LIA</h2>
        <p>
          Accumule <strong>EGLD / WEGLD / WBTC / USDC</strong> uniquement. Tout{' '}
          <strong>$TRO</strong> reçu est redistribué (pool 40 · stake 30 · rewards 20 · burn 10).
        </p>
      </section>
    </div>
  )
}

export default DashboardPage
