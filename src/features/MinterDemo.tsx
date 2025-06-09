import React, { useState } from "react";
import "./DemoFeature.css";

const MinterDemo: React.FC = () => {
  const [name, setName] = useState("");
  const [royalties, setRoyalties] = useState("");
  const [attributes, setAttributes] = useState("");
  const [minted, setMinted] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleMint() {
    setMinted(null);
    setError(null);
    if (!name) {
      setError("NFT name is required.");
      return;
    }
    if (royalties && (isNaN(Number(royalties)) || Number(royalties) < 0 || Number(royalties) > 100)) {
      setError("Royalties must be a number between 0 and 100.");
      return;
    }
    setMinted(`NFT "${name}" minted! (Demo)`);
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
      <h2>🖼️ NFT Minter Demo (Demo Mode)</h2>
      <p>
        <b>Mint unique NFTs</b> and experiment with attributes and royalties.
        <br />
        <b>Demo Mode:</b>
      </p>
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
        <button onClick={handleMint} disabled={!name}>Mint NFT (Demo)</button>
      </div>
      {minted && <div style={{ color: "#2e8b57", marginTop: 10 }}>{minted}</div>}
      {error && <div style={{ color: "#d32f2f", marginTop: 10 }}>{error}</div>}
      <button style={{ marginTop: 18, background: "#eee", color: "#5a3be7" }} onClick={handleReset}>
        Reset Demo
      </button>
      <p className="demo-note">
        <i>This is a demo mode. No real minting is performed.</i>
      </p>
    </div>
  );
};

export default MinterDemo;
