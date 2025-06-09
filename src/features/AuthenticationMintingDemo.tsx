import React from "react";
import "./DemoFeature.css";

const AuthenticationMintingDemo: React.FC = () => (
  <div className="demo-feature">
    <h2>🛡️ Authentication &amp; Minting (Demo)</h2>
    <p>
      <b>Securely tokenize artworks.</b> Artists upload art, AI (ChatGPT) assesses quality, NFT is minted, and TRO is issued.
    </p>
    <div>
      <label>
        Upload Artwork:
        <input type="file" disabled />
      </label>
      <button disabled>Submit to AI (Demo)</button>
      <div style={{ margin: "12px 0" }}>
        <b>AI Assessment:</b> <span>Pending (Demo)</span>
      </div>
      <button disabled>Mint NFT (Demo)</button>
    </div>
    <p className="demo-note">
      <i>This is a static demo. No real authentication or minting is performed.</i>
    </p>
  </div>
);

export default AuthenticationMintingDemo;
