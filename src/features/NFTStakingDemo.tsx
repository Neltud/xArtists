import React, { useState } from "react";
import "./DemoFeature.css";

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

  function handleStakeNFT() {
    setFeedback(null);
    setError(null);
    if (!nftId || isNaN(Number(nftId)) || Number(nftId) <= 0) {
      setError("Please enter a valid NFT ID (positive number).");
      return;
    }
    if (stakedNFTs.some(nft => nft.nftId === nftId && nft.collection === collection)) {
      setError("This NFT is already staked.");
      return;
    }
    setStakedNFTs((prev) => [...prev, { collection, nftId }]);
    setRewards((r) => r + 10);
    setFeedback(`Staked NFT #${nftId} from ${collection} (Demo).`);
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
      <h2>🎨 NFT Staking &amp; Rewards (Demo)</h2>
      <p>
        <b>Stake your NFTs</b> to earn rewards. Supports multiple collections and custom scoring.
        <br />
        <b>Demo Mode:</b>
      </p>
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
        <button onClick={handleStakeNFT} disabled={!nftId}>Stake NFT (Demo)</button>
      </div>
      <div className="demo-rewards">
        <h3>Staked NFTs (Demo)</h3>
        <ul>
          {stakedNFTs.map((nft, i) => (
            <li key={i}>
              <b>{nft.collection}</b> - NFT #{nft.nftId}
            </li>
          ))}
        </ul>
        <h3>Rewards (Demo)</h3>
        <ul>
          <li>
            <b>TRO:</b> {rewards}
          </li>
          <li>
            <b>Special NFT:</b> {Math.floor(rewards / 100)}
          </li>
        </ul>
      </div>
      {feedback && <div style={{ color: "#2e8b57", marginTop: 10 }}>{feedback}</div>}
      {error && <div style={{ color: "#d32f2f", marginTop: 10 }}>{error}</div>}
      <button style={{ marginTop: 18, background: "#eee", color: "#5a3be7" }} onClick={handleReset}>
        Reset Demo
      </button>
      <p className="demo-note">
        <i>This is a demo mode. No real NFT staking or rewards are performed.</i>
      </p>
    </div>
  );
};

export default NFTStakingDemo;
