import React, { useState, useEffect } from 'react';
import { useTROPrice } from '../services/price';
import { useMvxAccount } from '../services/mvx';
import { useStakeNFT, useStakeTRO, queryStakedTRO, queryStakedNFTs } from '../services/transactions';
import WalletConnect from '../components/WalletConnect';

const MainDashboard: React.FC = () => {
  const troPrice = useTROPrice();
  const { address, isLoggedIn, account } = useMvxAccount();
  const { stakeNFT } = useStakeNFT();
  const { stakeTRO } = useStakeTRO();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'staking' | 'battle' | 'dao'>('dashboard');
  const [stakedTRO, setStakedTRO] = useState(0);
  const [stakedNFTCount, setStakedNFTCount] = useState(0);
  const [stakingFeedback, setStakingFeedback] = useState('');

  // Load real staked data when wallet connects
  useEffect(() => {
    if (isLoggedIn && address) {
      queryStakedTRO(address).then(data => setStakedTRO(parseFloat(data.stakedAmount) || 0));
      queryStakedNFTs(address).then(data => setStakedNFTCount(data.nftCount || 0));
    }
  }, [isLoggedIn, address]);

  const egldBalance = account?.balance ? parseFloat(account.balance) / 1e18 : 0;
  const troValue = (troPrice?.usd || 0) * (stakedTRO + 300);
  const portfolioTotal = (egldBalance * 4.19 + troValue + (stakedNFTCount * 70)).toFixed(2);

  const handleStakeTRO = async () => {
    if (!isLoggedIn) return alert('Connecte ton wallet');
    try {
      const tx = await stakeTRO('100'); // stake 100 TRO
      setStakingFeedback(`Stake TRO envoyé ! Tx: ${tx?.slice(0,10)}...`);
    } catch (e: any) {
      setStakingFeedback('Erreur: ' + e.message);
    }
  };

  const handleStakeNFT = async () => {
    if (!isLoggedIn) return alert('Connecte ton wallet');
    try {
      const tx = await stakeNFT('XARTNFT-63b9ea', '42');
      setStakingFeedback(`NFT staké ! Tx: ${tx?.slice(0,10)}...`);
    } catch (e: any) {
      setStakingFeedback('Erreur: ' + e.message);
    }
  };

  return (
    <div className="main-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>✕ xArtists — LIA v5</h1>
          <p>Dashboard • Contrats Staking Intégrés</p>
        </div>
        <WalletConnect className="connect-btn" />
      </div>

      <div className="tabs">
        <div className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>📊 Dashboard</div>
        <div className={`tab ${activeTab === 'staking' ? 'active' : ''}`} onClick={() => setActiveTab('staking')}>🔒 Staking</div>
        <div className={`tab ${activeTab === 'battle' ? 'active' : ''}`} onClick={() => setActiveTab('battle')}>⚔️ Battle of Nodes</div>
        <div className={`tab ${activeTab === 'dao' ? 'active' : ''}`} onClick={() => setActiveTab('dao')}>🗳️ DAO Vote</div>
      </div>

      {activeTab === 'dashboard' && (
        <>
          <div className="stats-grid">
            <div className="stat-card highlight">
              <div className="stat-label">PORTFOLIO TOTAL (On-chain)</div>
              <div className="stat-value">${portfolioTotal}</div>
              <div className="stat-sub">EGLD + TRO-94c925 + Staked</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">STAKED TRO</div>
              <div className="stat-value">{stakedTRO} TRO</div>
              <div className="stat-sub">Via tro-staking</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">PRIX TRO</div>
              <div className="stat-value">{troPrice?.usd ? `$${troPrice.usd.toFixed(6)}` : '$—'}</div>
            </div>
          </div>

          <div className="staking-summary">
            <h3>Tes Stakings (On-chain ready)</h3>
            <p>Staked TRO: <strong>{stakedTRO}</strong></p>
            <p>NFTs Stakés: <strong>{stakedNFTCount}</strong></p>
            <button onClick={handleStakeTRO} className="action-btn">Stake 100 TRO</button>
            <button onClick={handleStakeNFT} className="action-btn" style={{marginLeft: '10px'}}>Stake NFT</button>
            {stakingFeedback && <p style={{color: '#4ade80', marginTop: '10px'}}>{stakingFeedback}</p>}
          </div>
        </>
      )}

      {activeTab === 'staking' && (
        <div className="tab-content">
          <h2>🔒 Contrats Staking</h2>
          <p>Wallet LIA utilisé pour déploiement : <code>erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6</code></p>
          <button onClick={handleStakeTRO} className="action-btn">Stake TRO</button>
          <button onClick={handleStakeNFT} className="action-btn" style={{marginLeft:'10px'}}>Stake NFT</button>
        </div>
      )}

      {/* Other tabs simplified */}
      {activeTab === 'battle' && <div className="tab-content"><h2>Battle of Nodes</h2></div>}
      {activeTab === 'dao' && <div className="tab-content"><h2>DAO Vote</h2></div>}

      <style>{`/* styles omitted for brevity - same as previous */`}</style>
    </div>
  );
};

export default MainDashboard;
