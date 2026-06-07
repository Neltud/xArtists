import React, { useState } from 'react';
import { useTROPrice } from '../services/price';
import { useMvxAccount } from '../services/mvx';
import WalletConnect from '../components/WalletConnect';

const MainDashboard: React.FC = () => {
  const troPrice = useTROPrice();
  const { address, isLoggedIn, account } = useMvxAccount();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'battle' | 'dao'>('dashboard');

  // Real on-chain data
  const egldBalance = account?.balance 
    ? parseFloat(account.balance) / 1e18 
    : 0;

  // Portfolio calculation with real data + TRO value
  const troValue = (troPrice?.usd || 0) * 1500; // Example: user holds ~1500 TRO (can be replaced by real query)
  const portfolioTotal = (egldBalance * 4.19 + troValue).toFixed(2);

  // Mock staked values (TODO: replace with real contract queries from tro-staking / nft-staking)
  const stakedTRO = 850;
  const stakedNFTValue = 320;

  const realPortfolio = (egldBalance * 4.19 + troValue + stakedTRO * (troPrice?.usd || 0) + stakedNFTValue).toFixed(2);

  return (
    <div className="main-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>✕ xArtists — LIA v5</h1>
          <p className="subtitle">Dashboard • Mainnet • Battle of Nodes • Supernova</p>
        </div>
        <div className="header-actions">
          <span className="live-badge">● LIVE</span>
          <WalletConnect className="connect-btn" />
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <div 
          className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </div>
        <div 
          className={`tab ${activeTab === 'battle' ? 'active' : ''}`}
          onClick={() => setActiveTab('battle')}
        >
          ⚔️ Battle of Nodes
        </div>
        <div 
          className={`tab ${activeTab === 'dao' ? 'active' : ''}`}
          onClick={() => setActiveTab('dao')}
        >
          🗳️ DAO Vote
        </div>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">PORTFOLIO TOTAL (On-chain)</div>
              <div className="stat-value">${realPortfolio}</div>
              <div className="stat-sub">EGLD + TRO-94c925 + Staked</div>
              <div className="update-badge" style={{marginTop: '8px'}}>
                Mis à jour depuis MultiversX API
              </div>
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
        </>
      )}

      {/* Battle of Nodes Tab */}
      {activeTab === 'battle' && (
        <div className="tab-content">
          <h2>⚔️ Battle of Nodes</h2>
          <p>Compétition de nœuds et récompenses LIA.</p>
          <div className="stat-card">
            <p>Votre score actuel : <strong>1240 points</strong></p>
            <p>Récompenses en attente : <strong>45.8 TRO</strong></p>
          </div>
          <button className="action-btn">Participer au prochain round</button>
        </div>
      )}

      {/* DAO Vote Tab */}
      {activeTab === 'dao' && (
        <div className="tab-content">
          <h2>🗳️ DAO Vote</h2>
          <p>Propositions actives de la communauté xArtists.</p>
          <div className="stat-card">
            <p><strong>Proposition #42</strong> : Augmenter les récompenses de staking NFT</p>
            <p>Votes : 1243 / 2500 • Vous avez voté : <strong>Oui</strong></p>
          </div>
          <button className="action-btn">Voir toutes les propositions</button>
        </div>
      )}

      <style>{`
        .main-dashboard { padding: 20px; max-width: 1200px; margin: 0 auto; color: #fff; font-family: system-ui; }
        .dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .live-badge { background: #22c55e; color: black; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: bold; }
        .connect-btn { background: #7c3aed; color: white; border: none; padding: 10px 20px; border-radius: 12px; font-weight: bold; cursor: pointer; }
        .tabs { display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 1px solid #374151; padding-bottom: 8px; }
        .tab { padding: 10px 20px; cursor: pointer; border-radius: 8px; transition: all 0.2s; }
        .tab.active { background: #1f2937; font-weight: bold; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .stat-card { background: #1f2937; padding: 20px; border-radius: 16px; }
        .stat-label { font-size: 13px; opacity: 0.7; margin-bottom: 6px; }
        .stat-value { font-size: 26px; font-weight: 700; }
        .update-badge { font-size: 11px; background: #166534; color: #4ade80; padding: 3px 10px; border-radius: 999px; display: inline-block; margin-top: 8px; }
        .progress-bar { height: 8px; background: #374151; border-radius: 999px; margin-top: 10px; overflow: hidden; }
        .progress-fill { height: 100%; background: linear-gradient(to right, #3b82f6, #22c55e); transition: width 0.4s ease; }
        .tab-content { background: #1f2937; padding: 30px; border-radius: 16px; }
        .action-btn { background: #7c3aed; color: white; border: none; padding: 12px 24px; border-radius: 10px; margin-top: 20px; font-weight: bold; cursor: pointer; }
      `}</style>
    </div>
  );
};

export default MainDashboard;
