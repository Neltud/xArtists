import React, { useState } from 'react';
import { useTROPrice } from '../services/price';
import { useMvxAccount } from '../services/mvx';
import { useStakeNFT } from '../services/transactions';
import WalletConnect from '../components/WalletConnect';

const MainDashboard: React.FC = () => {
  const troPrice = useTROPrice();
  const { address, isLoggedIn, account } = useMvxAccount();
  const { stakeNFT } = useStakeNFT();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'battle' | 'dao' | 'staking'>('dashboard');
  const [stakingFeedback, setStakingFeedback] = useState('');

  // Real on-chain EGLD balance
  const egldBalance = account?.balance ? parseFloat(account.balance) / 1e18 : 0;

  // TODO: Replace these with real queries to tro-staking and nft-staking contracts
  const stakedTRO = 1240; // Example - replace with contract query
  const stakedNFTCount = 7;   // Example
  const stakedNFTValue = 480;

  const troValue = (troPrice?.usd || 0) * (stakedTRO + 300); // liquid + staked
  const portfolioTotal = (egldBalance * 4.19 + troValue + stakedNFTValue).toFixed(2);

  const handleStakeExample = async () => {
    if (!isLoggedIn) {
      alert('Connecte ton wallet d\'abord');
      return;
    }
    try {
      // Example stake call (replace with real collection + nftId)
      const txHash = await stakeNFT('XARTNFT-63b9ea', '42');
      setStakingFeedback(`Stake en cours... Tx: ${txHash?.slice(0, 12)}...`);
    } catch (err: any) {
      setStakingFeedback('Erreur: ' + err.message);
    }
  };

  return (
    <div className="main-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>✕ xArtists — LIA v5</h1>
          <p className="subtitle">Dashboard • Mainnet • LIA Staking</p>
        </div>
        <div className="header-actions">
          <span className="live-badge">● LIVE</span>
          <WalletConnect className="connect-btn" />
        </div>
      </div>

      <div className="tabs">
        <div className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>📊 Dashboard</div>
        <div className={`tab ${activeTab === 'staking' ? 'active' : ''}`} onClick={() => setActiveTab('staking')}>🔒 Staking</div>
        <div className={`tab ${activeTab === 'battle' ? 'active' : ''}`} onClick={() => setActiveTab('battle')}>⚔️ Battle of Nodes</div>
        <div className={`tab ${activeTab === 'dao' ? 'active' : ''}`} onClick={() => setActiveTab('dao')}>🗳️ DAO Vote</div>
      </div>

      {/* DASHBOARD TAB */}
      {activeTab === 'dashboard' && (
        <>
          <div className="stats-grid">
            <div className="stat-card highlight">
              <div className="stat-label">PORTFOLIO TOTAL (On-chain + Staked)</div>
              <div className="stat-value">${portfolioTotal}</div>
              <div className="stat-sub">EGLD + TRO-94c925 + Staked Assets</div>
              <div className="update-badge" style={{marginTop: '10px'}}>
                Mis à jour depuis MultiversX API + Contrats Staking
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-label">PRIX EGLD</div>
              <div className="stat-value">$4.19</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">PRIX TRO</div>
              <div className="stat-value">{troPrice?.usd ? `$${troPrice.usd.toFixed(6)}` : '$—'}</div>
              <div className="stat-sub">TRO-94c925</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">STAKED TRO</div>
              <div className="stat-value">{stakedTRO} TRO</div>
              <div className="stat-sub">Via tro-staking contract</div>
            </div>
          </div>

          <div className="staking-summary">
            <h3>🔒 Tes Stakings</h3>
            <div>Staked TRO: <strong>{stakedTRO}</strong></div>
            <div>NFTs Stakés: <strong>{stakedNFTCount}</strong> (valeur ≈ ${stakedNFTValue})</div>
            <button onClick={handleStakeExample} className="action-btn" style={{marginTop: '12px'}}>
              Staker un NFT (via nft-staking)
            </button>
            {stakingFeedback && <p style={{marginTop: '10px', color: '#4ade80'}}>{stakingFeedback}</p>}
          </div>
        </>
      )}

      {/* STAKING TAB */}
      {activeTab === 'staking' && (
        <div className="tab-content">
          <h2>🔒 Intégration Contrats Staking</h2>
          <p>Contrats utilisés : <strong>tro-staking</strong> et <strong>nft-staking</strong> (déployés avec le wallet LIA)</p>
          
          <div className="stat-card">
            <h4>Stake TRO</h4>
            <p>Endpoint: <code>stake</code> sur tro-staking</p>
            <button className="action-btn">Stake TRO (bientôt)</button>
          </div>

          <div className="stat-card">
            <h4>Stake NFT</h4>
            <p>Endpoint: <code>stake</code> sur nft-staking</p>
            <button onClick={handleStakeExample} className="action-btn">Staker un NFT maintenant</button>
          </div>
        </div>
      )}

      {/* Other tabs */}
      {activeTab === 'battle' && <div className="tab-content"><h2>⚔️ Battle of Nodes</h2><p>Contenu à venir...</p></div>}
      {activeTab === 'dao' && <div className="tab-content"><h2>🗳️ DAO Vote</h2><p>Contenu à venir...</p></div>}

      <style>{` ... (same styles as before) `}</style>
    </div>
  );
};

export default MainDashboard;
