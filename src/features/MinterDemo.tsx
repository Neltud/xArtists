import React, { useState } from "react";
import "./DemoFeature.css";
import { useMvxAccount } from "../services/mvx";
import { useMintNFT } from "../services/transactions";

const MinterDemo: React.FC = () => {
  const [name, setName] = useState("");
  const [royalties, setRoyalties] = useState("");
  const [attributes, setAttributes] = useState("");
  const [minted, setMinted] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMinting, setIsMinting] = useState(false);

  const { address, isLoggedIn } = useMvxAccount();
  const { mintNFT } = useMintNFT();

  async function handleMint() {
    setMinted(null);
    setError(null);

    if (!isLoggedIn) {
      setError("Please connect your wallet to mint real NFTs.");
      return;
    }
    if (!name) {
      setError("NFT name is required.");
      return;
    }

    setIsMinting(true);
    try {
      // Real transaction
      const txHash = await mintNFT(name, Number(royalties) || 0, attributes);
      setMinted(`✅ NFT "${name}" minted! Tx: ${txHash?.slice(0, 10)}... (Update contract address in transactions.ts)`);
    } catch (err: any) {
      setError(`Mint failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsMinting(false);
    }
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
      <h2>🖼️ NFT Minter (Real Transactions Ready)</h2>
      <p>Mint NFTs on MultiversX with real on-chain transactions.</p>

      {!isLoggedIn && <div className="wallet-warning">Connect wallet to enable real minting.</div>}

      <div className="demo-minter-box">
        <label>Name: <input type="text" value={name} onChange={e => setName(e.target.value)} /></label>
        <label>Royalties (%): <input type="number" value={royalties} onChange={e => setRoyalties(e.target.value)} /></label>
        <label>Attributes: <input type="text" value={attributes} onChange={e => setAttributes(e.target.value)} /></label>
        <button onClick={handleMint} disabled={!name || isMinting}>
          {isMinting ? 'Minting...' : isLoggedIn ? 'Mint NFT (Real Tx)' : 'Connect Wallet'}
        </button>
      </div>

      {minted && <div style={{color:'#2e8b57'}}>{minted}</div>}
      {error && <div style={{color:'#d32f2f'}}>{error}</div>}

      <button onClick={handleReset} style={{marginTop:18}}>Reset</button>
      <p className="demo-note">Update CONTRACT_ADDRESSES in src/services/transactions.ts after deploying your Rust NFT contract.</p>
    </div>
  );
};

export default MinterDemo;
