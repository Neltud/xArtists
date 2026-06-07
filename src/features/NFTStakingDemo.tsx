import React, { useState } from "react";
import "./DemoFeature.css";
import { useMvxAccount } from "../services/mvx";
import { useStakeNFT } from "../services/transactions";

const mockCollections = [ { id: "XARTSFT-45f597", name: "xArtists SFT" } ];

const NFTStakingDemo: React.FC = () => {
  const [collection, setCollection] = useState(mockCollections[0].id);
  const [nftId, setNftId] = useState("");
  const [stakedNFTs, setStakedNFTs] = useState<any[]>([]);
  const [rewards, setRewards] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStaking, setIsStaking] = useState(false);

  const { address, isLoggedIn } = useMvxAccount();
  const { stakeNFT } = useStakeNFT();

  async function handleStakeNFT() {
    setFeedback(null); setError(null);
    if (!isLoggedIn) { setError("Connect wallet first"); return; }
    if (!nftId) { setError("Enter NFT ID"); return; }

    setIsStaking(true);
    try {
      const txHash = await stakeNFT(collection, nftId);
      setStakedNFTs(prev => [...prev, { collection, nftId }]);
      setRewards(r => r + 10);
      setFeedback(`✅ Staked! Tx: ${txHash?.slice(0,10)}... (Update contract address)`);
      setNftId("");
    } catch (err: any) {
      setError(`Stake failed: ${err.message}`);
    } finally {
      setIsStaking(false);
    }
  }

  return (
    <div className="demo-feature">
      <h2>🎨 NFT Staking (Real Transactions)</h2>
      {!isLoggedIn && <div className="wallet-warning">Connect wallet for real staking.</div>}
      <div className="demo-stake-box">
        <select value={collection} onChange={e => setCollection(e.target.value)}>
          {mockCollections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input type="text" placeholder="NFT ID" value={nftId} onChange={e => setNftId(e.target.value)} />
        <button onClick={handleStakeNFT} disabled={!nftId || isStaking}>
          {isStaking ? 'Staking...' : 'Stake NFT (Real Tx)'}
        </button>
      </div>
      <div>Staked: {stakedNFTs.length} | Rewards: {rewards} TRO</div>
      {feedback && <div style={{color:'green'}}>{feedback}</div>}
      {error && <div style={{color:'red'}}>{error}</div>}
    </div>
  );
};
export default NFTStakingDemo;
