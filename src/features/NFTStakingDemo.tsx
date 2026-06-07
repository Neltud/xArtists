import React, { useState } from "react";
import "./DemoFeature.css";
import { useMvxAccount } from "../services/mvx";

const mockCollections = [
  { id: "XARTSFT-45f597", name: "xArtists SFT" },
  { id: "XARTNFT-63b9ea", name: "xArtists NFT" },
];

const NFTStakingDemo: React.FC = () => {
  const [collection, setCollection] = useState(mockCollections[0].id);
  const [nftId, setNftId] = useState("");
  const [stakedNFTs, setStakedNFTs] = useState<{ collection: string; nftId: string }[]>([]);
  const [rewards, setRewards] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { address, isLoggedIn, account } = useMvxAccount();

  function handleStakeNFT() {
    setFeedback(null);
    setError(null);

    if (!isLoggedIn) {
      setError("Please connect your wallet first to stake NFTs on-chain.");
      return;
    }

    if (!nftId || isNaN(Number(nftId)) || Number(nftId) <= 0) {
      setError("Please enter a valid NFT ID (positive number).");
      return;
    }

    if (stakedNFTs.some(nft => nft.nftId === nftId && nft.collection === collection)) {
      setError("This NFT is already staked.");
      return;
    }

    // TODO: Replace with real on-chain staking transaction
    // Example:
    // const tx = await stakeNFT(collection, nftId, contractAddress from tro-staking or nft-staking);
    // await sendTransaction(tx);

    setStakedNFTs((prev) => [...prev, { collection, nftId }]);
    setRewards((r) => r + 10);
    setFeedback(`✅ Staked NFT #${nftId} from ${collection} (Demo + Wallet: ${address?.slice(0,6)}...)`);
    setNftId("");
  }

  function handleReset() {
    setCollection(mockCollections[0].id);
    setNftId("");
    setStakedNFTs([]);
    setRewards(0);
    setFeedback(null);
    setError(null);
  }

  return (
    <div className="demo-feature">
      <h2>🎨 NFT Staking &amp; Rewards</h2>
      <p>
        <b>Stake your NFTs</b> to earn TRO rewards. Supports multiple collections.
      </p>

      {!isLoggedIn && (
        <div className="wallet-warning">
          Connect your wallet to enable real on-chain staking.
        </div>
      )}

      <div className="demo-stake-box">
        <label>
          NFT Collection:
          <select value={collection} onChange={e => setCollection(e.target.value)}>
            {mockCollections.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label>
          NFT ID:
          <input
            type="text"
            placeholder="123"
            value={nftId}
            onChange={e => setNftId(e.target.value)}
          />
        </label>
        <button onClick={handleStakeNFT} disabled={!nftId}>
          {isLoggedIn ? "Stake NFT (Demo + On-chain ready)" : "Connect Wallet to Stake"}
        </button>
      </div>

      <div className="demo-rewards">
        <h3>Staked NFTs</h3>
        <ul>
          {stakedNFTs.map((nft, i) => (
            <li key={i}>
              <b>{nft.collection}</b> - NFT #{nft.nftId}
            </li>
          ))}
        </ul>
        <h3>Rewards (Demo)</h3>
        <ul>
          <li><b>TRO:</b> {rewards}</li>
          <li><b>Special NFT:</b> {Math.floor(rewards / 100)}</li>
        </ul>
      </div>

      {feedback && <div style={{ color: "#2e8b57", marginTop: 10 }}>{feedback}</div>}
      {error && <div style={{ color: "#d32f2f", marginTop: 10 }}>{error}</div>}

      <button style={{ marginTop: 18, background: "#eee", color: "#5a3be7" }} onClick={handleReset}>
        Reset
      </button>

      <p className="demo-note">
        <i>Demo mode. Real staking will use nft-staking / tro-staking contracts + SDK transaction.</i>
      </p>
    </div>
  );
};

export default NFTStakingDemo;
