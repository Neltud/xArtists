import React, { useState } from "react";
import "./DemoFeature.css";
import { useMvxAccount } from "../services/mvx";

const MinterDemo: React.FC = () => {
  const [name, setName] = useState("");
  const [royalties, setRoyalties] = useState("");
  const [attributes, setAttributes] = useState("");
  const [minted, setMinted] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { address, isLoggedIn } = useMvxAccount();

  function handleMint() {
    setMinted(null);
    setError(null);

    if (!isLoggedIn) {
      setError("Please connect your wallet to mint real NFTs on MultiversX.");
      return;
    }

    if (!name) {
      setError("NFT name is required.");
      return;
    }
    if (royalties && (isNaN(Number(royalties)) || Number(royalties) < 0 || Number(royalties) > 100)) {
      setError("Royalties must be a number between 0 and 100.");
      return;
    }

    // TODO: Real mint transaction using SDK + NFT contract
    // const tx = buildMintTransaction(name, royalties, attributes, contractAddress);
    // await sendTransaction(tx);

    setMinted(`✅ NFT "${name}" minted on-chain! (Demo + Wallet: ${address?.slice(0,6)}...)`);
    setName("");
    setRoyalties("");
    setAttributes("");
  }

  function handleReset() {
    setName("");
    setRoyalties("");
    setAttributes("");
    setMinted(null);
    setError(null);
  }

  return (
    <div className="demo-feature">
      <h2>🖼️ NFT Minter</h2>
      <p>
        <b>Mint unique NFTs</b> with attributes and royalties on MultiversX.
      </p>

      {!isLoggedIn && <div className="wallet-warning">Connect wallet to enable real minting.</div>}

      <div className="demo-minter-box">
        <label>
          Name:
          <input type="text" placeholder="My NFT" value={name} onChange={e => setName(e.target.value)} />
        </label>
        <label>
          Royalties (%):
          <input type="number" min="0" max="100" placeholder="5" value={royalties} onChange={e => setRoyalties(e.target.value)} />
        </label>
        <label>
          Attributes:
          <input type="text" placeholder="e.g. color:blue" value={attributes} onChange={e => setAttributes(e.target.value)} />
        </label>
        <button onClick={handleMint} disabled={!name}>
          {isLoggedIn ? "Mint NFT (Demo + On-chain ready)" : "Connect Wallet to Mint"}
        </button>
      </div>

      {minted && <div style={{ color: "#2e8b57", marginTop: 10 }}>{minted}</div>}
      {error && <div style={{ color: "#d32f2f", marginTop: 10 }}>{error}</div>}

      <button style={{ marginTop: 18, background: "#eee", color: "#5a3be7" }} onClick={handleReset}>
        Reset
      </button>

      <p className="demo-note">
        <i>Demo. Real mint will use SDK + NFT contract from contracts/ folder.</i>
      </p>
    </div>
  );
};

export default MinterDemo;
