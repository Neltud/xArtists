import React, { useState } from "react";
import "./DemoFeature.css";

const FaucetDemo: React.FC = () => {
  const [claimed, setClaimed] = useState(false);
  const [claimedNFT, setClaimedNFT] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleClaimTRO() {
    setFeedback(null);
    setError(null);
    if (claimed) {
      setError("You have already claimed TRO (Demo).");
      return;
    }
    setClaimed(true);
    setFeedback("Successfully claimed TRO (Demo).");
  }

  function handleClaimNFT() {
    setFeedback(null);
    setError(null);
    if (claimedNFT) {
      setError("You have already claimed NFT (Demo).");
      return;
    }
    setClaimedNFT(true);
    setFeedback("Successfully claimed NFT (Demo).");
  }

  function handleReset() {
    setClaimed(false);
    setClaimedNFT(false);
    setFeedback(null);
    setError(null);
  }

  return (
    <div className="demo-feature">
      <h2>🚰 Faucet Demo (Demo Mode)</h2>
      <p>
        <b>Get test tokens and NFTs</b> for development and experimentation.
        <br />
        <b>Demo Mode:</b>
      </p>
      <div className="demo-faucet-box">
        <button
          onClick={handleClaimTRO}
          disabled={claimed}
        >
          {claimed ? "Claimed TRO (Demo)" : "Claim Test TRO (Demo)"}
        </button>
        <button
          onClick={handleClaimNFT}
          disabled={claimedNFT}
        >
          {claimedNFT ? "Claimed NFT (Demo)" : "Claim Test NFT (Demo)"}
        </button>
      </div>
      {feedback && <div style={{ color: "#2e8b57", marginTop: 10 }}>{feedback}</div>}
      {error && <div style={{ color: "#d32f2f", marginTop: 10 }}>{error}</div>}
      <button style={{ marginTop: 18, background: "#eee", color: "#5a3be7" }} onClick={handleReset}>
        Reset Demo
      </button>
      <p className="demo-note">
        <i>This is a demo mode. No real tokens or NFTs are dispensed.</i>
      </p>
    </div>
  );
};

export default FaucetDemo;
