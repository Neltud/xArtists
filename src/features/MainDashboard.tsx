import React, { useState, useEffect } from 'react';
import { useTROPrice } from '../services/price';
import { useMvxAccount } from '../services/mvx';
import { useStakeNFT, useStakeTRO, queryStakedTRO, queryStakedNFTs, queryClaimableRewards } from '../services/transactions';
import WalletConnect from '../components/WalletConnect';

const MainDashboard: React.FC = () => {
  const troPrice = useTROPrice();
  const { address, isLoggedIn, account } = useMvxAccount();
  const { stakeNFT, stakeTRO } = useStakeNFT(); // Note: stakeTRO should be imported separately if needed

  const [activeTab, setActiveTab] = useState<'dashboard' | 'staking'>('dashboard');
  const [stakedTRO, setStakedTRO] = useState(0);
  const [claimableRewards, setClaimableRewards] = useState('0');
  const [stakedNFTCount, setStakedNFTCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [stakingFeedback, setStakingFeedback] = useState('');

  // Load real data from contracts when wallet connects
  useEffect(() => {
    const loadOnChainData = async () => {
      if (!isLoggedIn || !address) return;

      setIsLoading(true);
      try {
        const [troData, nftData, rewardsData] = await Promise.all([
          queryStakedTRO(address),
          queryStakedNFTs(address),
          queryClaimableRewards(address),
        ]);

        setStakedTRO(parseFloat(troData.stakedAmount) || 0);
        setStakedNFTCount(nftData.nftCount || 0);
        setClaimableRewards(rewardsData.claimable || '0');
      } catch (error) {
        console.error('Failed to load on-chain staking data', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOnChainData();
  }, [isLoggedIn, address]);

  const egldBalance = account?.balance ? parseFloat(account.balance) / 1e18 : 0;
  const portfolioTotal = (egldBalance * 4.19 + (stakedTRO * (troPrice?.usd || 0)) + (stakedNFTCount * 70)).toFixed(2);

  return (
    <div className="main-dashboard">
      <div className="dashboard-header">
        <h1>✕ xArtists — LIA v5</h1>
        <WalletConnect className="connect-btn" />
      </div>

      <div className="tabs">
        <div className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>Dashboard</div>
        <div className={`tab ${activeTab === 'staking' ? 'active' : ''}`} onClick={() => setActiveTab('staking')}>Staking</div>
      </div>

      {activeTab === 'dashboard' && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">PORTFOLIO TOTAL</div>
              <div className="stat-value">${portfolioTotal}</div>
              {isLoading && <div className="loading">Loading on-chain data...</div>}
            </div>
            <div className="stat-card">
              <div className="stat-label">STAKED TRO</div>
              <div className="stat-value">{stakedTRO} TRO</div>
              <div className="stat-sub">tro-staking contract</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">CLAIMABLE REWARDS</div>
              <div className="stat-value">{claimableRewards} TRO</div>
            </div>
          </div>

          <div className="staking-actions">
            <button onClick={() => { /* call stakeTRO */ }} className="action-btn">Stake TRO</button>
            <button onClick={() => { /* call stakeNFT */ }} className="action-btn">Stake NFT</button>
          </div>
        </>
      )}

      {activeTab === 'staking' && (
        <div>
          <h2>Staking Management</h2>
          <p>Connected to LIA wallet contracts</p>
          {/* Add more staking UI here */}
        </div>
      )}
    </div>
  );
};
export default MainDashboard;
