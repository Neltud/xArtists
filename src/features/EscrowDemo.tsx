import React, { useState } from "react";
import "./DemoFeature.css";

const EscrowDemo: React.FC = () => {
  const [nftId, setNftId] = useState("");
  const [locked, setLocked] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleLock() {
    setFeedback(null);
    setError(null);
    if (!nftId) {
      setError("Please enter an NFT ID to lock.");
      return;
    }
    setLocked(nftId);
    setFeedback(`NFT #${nftId} is now locked in escrow (Demo).`);
    setNftId("");
  }
  function handleUnlock() {
    setFeedback(null);
    setError(null);
    if (!locked) {
      setError("No NFT is currently locked.");
      return;
    }
    setFeedback(`NFT #${locked} has been unlocked (Demo).`);
    setLocked(null);
  }
  function handleReset() {
    setNftId("");
    setLocked(null);
    setFeedback(null);
    setError(null);
  }

  return (
    <div className="demo-feature">
      <h2>🔒 Escrow Demo (Demo Mode)</h2>
      <p>
        <b>Demo escrow contract</b> for secure NFT updates and transfers.
        <br />
        <b>Demo Mode:</b>
      </p>
      <div className="demo-escrow-box">
        <label>
          NFT ID:
          <input type="text" placeholder="NFT ID" value={nftId} onChange={e => setNftId(e.target.value)} />
        </label>
        <button onClick={handleLock} disabled={!nftId}>Lock NFT (Demo)</button>
        <button onClick={handleUnlock} disabled={!locked}>Unlock NFT (Demo)</button>
      </div>
      {locked && (
        <div style={{ color: "#5a3be7", marginTop: 10 }}>
          NFT #{locked} is locked in escrow (Demo)
        </div>
      )}
      {feedback && <div style={{ color: "#2e8b57", marginTop: 10 }}>{feedback}</div>}
      {error && <div style={{ color: "#d32f2f", marginTop: 10 }}>{error}</div>}
      <button style={{ marginTop: 18, background: "#eee", color: "#5a3be7" }} onClick={handleReset}>
        Reset Demo
      </button>
      <p className="demo-note">
        <i>This is a demo mode. No real escrow actions are performed.</i>
      </p>
    </div>
  );
};

export default EscrowDemo;
