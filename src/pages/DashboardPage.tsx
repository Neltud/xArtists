import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMvxAccount } from '../services/mvx'
import { isLiaWalletConnected } from '../utils/liaAuth'
import { txQueue } from '../services/txQueue'
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
  const [cycleMsg, setCycleMsg] = useState('')
  const [cycleBusy, setCycleBusy] = useState(false)
  const [queueSize, setQueueSize] = useState(0)

  const isLia = isLiaWalletConnected(isLoggedIn, address)

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/lia_compound_streak.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j && setStreak(j))
      .catch(() => null)
  }, [])

  useEffect(() => {
    return txQueue.subscribe(() => {
      setQueueSize(address ? txQueue.size(address) : txQueue.size())
    })
  }, [address])

  const egld = account?.balance ? parseFloat(account.balance) / 1e18 : 0
  const s = streak?.streak

  /**
   * Manual LIA cycle — ONLY when LIA ops wallet is the connected account.
   * Triggers backend/Vellum webhook or local guarded cycle endpoint if configured.
   */
  const onLaunchCycle = useCallback(async () => {
    if (!isLia || !address) {
      setCycleMsg('Réservé au wallet LIA connecté.')
      return
    }
    if (txQueue.isBusy(address)) {
      setCycleMsg('TX déjà en cours — attends la fin de la file.')
      return
    }
    setCycleBusy(true)
    setCycleMsg('')
    try {
      await txQueue.enqueue(address, async () => {
        const webhook =
          (typeof import.meta !== 'undefined' &&
            import.meta.env?.VITE_LIA_CYCLE_WEBHOOK) ||
          ''
        if (webhook) {
          const { fetchWithTimeout } = await import('../services/network')
          const res = await fetchWithTimeout(
            webhook,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'run_guarded_cycle',
                wallet: address,
                ts: new Date().toISOString(),
              }),
            },
            { timeoutMs: 30_000, retries: 1 }
          )
          if (!res.ok) throw new Error(`Cycle webhook HTTP ${res.status}`)
          setCycleMsg('Cycle LIA déclenché (webhook).')
        } else {
          // Publish intent for Vellum / ops — no public user trigger without LIA
          window.dispatchEvent(
            new CustomEvent('lia:run-cycle', { detail: { wallet: address } })
          )
          setCycleMsg(
            'Signal lia:run-cycle émis. Configure VITE_LIA_CYCLE_WEBHOOK pour un trigger distant.'
          )
        }
      }, 'lia-cycle')
    } catch (e) {
      setCycleMsg(e instanceof Error ? e.message : String(e))
    } finally {
      setCycleBusy(false)
    }
  }, [isLia, address])

  return (
    <div className="page">
      <header className="page-head">
        <h1>Dashboard opérationnel</h1>
        <p className="muted">
          Lecture publique pour tous · actions cycle LIA uniquement si wallet LIA connecté.
        </p>
      </header>

      <section className="grid-4">
        <div className="card">
          <div className="label">Wallet connecté</div>
          <div className="value sm">
            {isLoggedIn ? shortAddr(address || '') : 'Non connecté'}
            {isLia && <span className="badge" style={{ marginLeft: 8 }}>LIA OPS</span>}
          </div>
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

      {/* CRITICAL: cycle button ONLY for LIA wallet */}
      {isLia && (
        <section className="card mt accent">
          <h2>Contrôle ops LIA</h2>
          <p className="muted">
            Session authentifiée comme wallet LIA. Les utilisateurs standards ne voient pas ce
            panneau.
          </p>
          <div className="row-actions">
            <button
              type="button"
              className="btn"
              disabled={cycleBusy || queueSize > 0}
              onClick={() => void onLaunchCycle()}
            >
              {cycleBusy ? 'Cycle en cours…' : 'Lancer le cycle LIA'}
            </button>
            <Link className="btn ghost" to="/trading">
              Trading / Router
            </Link>
          </div>
          {queueSize > 0 && (
            <p className="sub">File TX: {queueSize} job(s) — concurrence verrouillée</p>
          )}
          {cycleMsg && <p className="mt">{cycleMsg}</p>}
        </section>
      )}

      {!isLia && isLoggedIn && (
        <section className="card mt">
          <p className="muted">
            Wallet connecté en lecture / marketplace. Le cycle LIA autonome tourne via Vellum (cron)
            — pas de déclencheur manuel pour les comptes non-LIA.
          </p>
        </section>
      )}

      <section className="grid-2 mt">
        <div className="card">
          <h2>Stratégies parallèles (budgets plafonnés)</h2>
          <p className="muted">Cap global entry {(GLOBAL_BUDGET_CAP * 100).toFixed(0)}%</p>
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
          Accumule <strong>EGLD / WEGLD / WBTC / USDC</strong>. Tout <strong>$TRO</strong> reçu est
          redistribué (pool 40 · stake 30 · rewards 20 · burn 10).
        </p>
      </section>
    </div>
  )
}

export default DashboardPage
