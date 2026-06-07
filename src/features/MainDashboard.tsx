import React from 'react';
import { useTROPrice } from '../services/price';
import { useMvxAccount } from '../services/mvx';

const MainDashboard: React.FC = () => {
  const troPrice = useTROPrice();
  const { address, isLoggedIn, account } = useMvxAccount();

  const egldBalance = account?.balance 
    ? (parseFloat(account.balance) / 1e18).toFixed(4) 
    : '0.0000';

  const portfolioTotal = (parseFloat(egldBalance) * 4.19 + (troPrice?.usd || 0) * 1000).toFixed(2); // Example calculation

  return (
    <div className="main-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>✕ xArtists — LIA v5</h1>
          <p className="subtitle">Dashboard • Mainnet • Battle of Nodes • Supernova</p>
        </div>
        <div className="header-actions">
          <span className="live-badge">● LIVE</span>
          <button className="connect-btn">Connecter Wallet</button>
        </div>
      </div>

      <div className="tabs">
        <div className="tab active">📊 Dashboard</div>
        <div className="tab">⚔️ Battle of Nodes</div>
        <div className="tab">🗳️ DAO Vote</div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">PORTFOLIO TOTAL</div>
          <div className="stat-value">${portfolioTotal}</div>
          <div className="stat-sub">LIA v5 • Mainnet</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">PRIX EGLD</div>
          <div className="stat-value">$4.19</div>
          <div className="stat-sub">MultiversX</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">FEAR & GREED</div>
          <div className="stat-value">12</div>
          <div className="stat-sub">Extreme Fear</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">PRIX TRO</div>
          <div className="stat-value">
            {troPrice?.usd ? `$${troPrice.usd.toFixed(6)}` : '$—'}
          </div>
          <div className="stat-sub">TRO-94c925</div>
          {troPrice?.source && (
            <div className="update-badge">
              Mis à jour depuis {troPrice.source === 'multiversx' ? 'MultiversX API' : 'CoinGecko'}
            </div>
          )}
        </div>
      </div>

      <div className="balance-guard">
        <div className="guard-header">
          <span className="status ok">OK</span>
          <span>En attente du cycle LIA...</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: '65%' }}></div>
        </div>
      </div>

      <div className="progression-card">
        <div className="stat-label">PROGRESSION $1M</div>
        <div className="stat-value">0.000187%</div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: '0.000187%' }}></div>
        </div>
        <div className="stat-sub">Objectif: $1,000,000</div>
      </div>

      <style>{`
        .main-dashboard { padding: 20px; max-width: 1200px; margin: 0 auto; color: #fff; }
        .dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .live-badge { background: #22c55e; color: black; padding: 2px 10px; border-radius: 999px; font-size: 12px; }
        .connect-btn { background: #7c3aed; color: white; border: none; padding: 10px 20px; border-radius: 12px; font-weight: bold; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .stat-card { background: #1f2937; padding: 20px; border-radius: 16px; }
        .stat-label { font-size: 12px; opacity: 0.7; margin-bottom: 8px; }
        .stat-value { font-size: 28px; font-weight: bold; }
        .update-badge { font-size: 11px; background: #166534; color: #4ade80; padding: 2px 8px; border-radius: 6px; display: inline-block; margin-top: 8px; }
        .progress-bar { height: 6px; background: #374151; border-radius: 999px; margin-top: 8px; overflow: hidden; }
        .progress-fill { height: 100%; background: linear-gradient(to right, #3b82f6, #22c55e); transition: width 0.5s ease; }
      `}</style>
    </div>
  );
};

export default MainDashboard;
